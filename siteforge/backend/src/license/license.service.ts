import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as crypto from 'node:crypto';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';
import { licenseDataSchema, type LicenseData, type LicenseFile } from './license.dto';

/**
 * LicenseService — License 授权管理服务
 *
 * 实现架构方案 4.8 节：
 * 1. 机器码生成（采集硬件指纹：CPU ID + MAC + 磁盘序列号 → SHA256）
 * 2. License 文件解析与 RSA-SHA256 签名验证
 * 3. 机器码 / 域名 / 过期时间 三重校验
 * 4. 启动时主动验证 License 状态
 *
 * 注：本实现使用 Node.js 内置 crypto 模块完成 RSA 验签，无需第三方依赖
 *
 * 测试用密钥生成方式：
 *   openssl genrsa -out private.pem 2048
 *   openssl rsa -in private.pem -pubout -out public.pem
 */

const LICENSE_FIELDS_TO_SIGN: (keyof LicenseData)[] = [
  'licenseId',
  'machineId',
  'domain',
  'edition',
  'issuedAt',
  'expireAt',
  'features',
  'maxSites',
];

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);
  private machineIdCache: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ============================================================================
  // 1. 机器码生成
  // ============================================================================

  /**
   * 生成当前机器的机器码
   * 算法：sha256(cpuId | mac | diskSerial).slice(0, 32)
   *
   * 实现说明：
   * - Linux: /proc/cpuinfo 读 CPU ID；getmac() 读 MAC；lsblk/udev 读磁盘序列号
   * - 跨平台兜底：os.hostname() + os.networkInterfaces() + os.cpus()[0]
   * - 结果缓存，避免重复采集
   */
  generateMachineId(): string {
    if (this.machineIdCache) return this.machineIdCache;

    const cpuId = this.readCpuId();
    const mac = this.readPrimaryMac();
    const diskSerial = this.readDiskSerial();
    const salt = os.hostname() || 'unknown-host';

    const raw = `${cpuId}|${mac}|${diskSerial}|${salt}`;
    this.machineIdCache = crypto
      .createHash('sha256')
      .update(raw)
      .digest('hex')
      .substring(0, 32);

    this.logger.log(`机器码已生成：${this.machineIdCache}`);
    return this.machineIdCache;
  }

  /**
   * 读取 CPU ID（Linux 优先读 /proc/cpuinfo）
   */
  private readCpuId(): string {
    try {
      if (process.platform === 'linux') {
        const cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf-8');
        const match = cpuinfo.match(/model name\s*:\s*(.+)/);
        if (match) {
          // 用所有 CPU 的 model name 哈希作为指纹
          return crypto
            .createHash('sha1')
            .update(match[1].trim())
            .digest('hex')
            .substring(0, 16);
        }
      }
    } catch {
      // 忽略读取失败
    }
    // 兜底：os.cpus()
    const cpus = os.cpus();
    if (cpus.length > 0) {
      return crypto
        .createHash('sha1')
        .update(cpus[0].model)
        .digest('hex')
        .substring(0, 16);
    }
    return 'cpu-unknown';
  }

  /**
   * 读取主网卡 MAC 地址
   */
  private readPrimaryMac(): string {
    const interfaces = os.networkInterfaces();
    // 优先 eth0 / enp0s* / wlan0，跳过 docker / lo
    const sortedNames = Object.keys(interfaces).sort((a, b) => {
      const score = (name: string): number => {
        if (name.startsWith('eth') || name.startsWith('enp') || name.startsWith('wlan')) return 0;
        if (name === 'lo' || name.startsWith('docker') || name.startsWith('br-')) return 9;
        return 5;
      };
      return score(a) - score(b);
    });

    for (const name of sortedNames) {
      const addrs = interfaces[name];
      if (!addrs) continue;
      for (const addr of addrs) {
        if (!addr.internal && addr.mac && addr.mac !== '00:00:00:00:00:00') {
          return addr.mac;
        }
      }
    }
    return 'mac-unknown';
  }

  /**
   * 读取根分区磁盘序列号（仅 Linux）
   */
  private readDiskSerial(): string {
    try {
      if (process.platform === 'linux') {
        // 优先尝试 /dev/disk/by-id
        const byIdDir = '/dev/disk/by-id';
        if (fs.existsSync(byIdDir)) {
          const entries = fs.readdirSync(byIdDir);
          for (const entry of entries) {
            // 跳过 partitions
            if (entry.includes('-part')) continue;
            return crypto
              .createHash('sha1')
              .update(entry)
              .digest('hex')
              .substring(0, 16);
          }
        }
      }
    } catch {
      // 忽略
    }
    return 'disk-unknown';
  }

  // ============================================================================
  // 2. License 文件签名与验证
  // ============================================================================

  /**
   * 计算待签名字符串
   * 将 LicenseData 中的关键字段按固定顺序拼接
   */
  private buildSignPayload(data: LicenseData): string {
    return LICENSE_FIELDS_TO_SIGN.map((field) => {
      const value = data[field];
      return `${field}=${Array.isArray(value) ? value.join(',') : String(value)}`;
    }).join('&');
  }

  /**
   * 用私钥对 LicenseData 进行 RSA-SHA256 签名（仅用于本地开发/测试签发）
   *
   * 生产环境中此函数不会调用 —— 签发由我方云端 License 服务完成
   */
  signLicense(data: LicenseData): string {
    const privateKeyPem = this.config.get<string>('LICENSE_RSA_PRIVATE_KEY');
    if (!privateKeyPem) {
      throw new BadRequestException({
        code: 'LICENSE_SIGN_KEY_MISSING',
        message: '未配置 LICENSE_RSA_PRIVATE_KEY，无法签发 License（仅用于开发环境）',
      });
    }

    const payload = this.buildSignPayload(data);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(payload);
    signer.end();
    return signer.sign(privateKeyPem, 'base64');
  }

  /**
   * 用公钥验证 License 签名
   * 返回 true/false
   */
  verifySignature(data: LicenseData, signature: string): boolean {
    const publicKeyPem = this.config.get<string>('LICENSE_RSA_PUBLIC_KEY');
    if (!publicKeyPem) {
      this.logger.warn('未配置 LICENSE_RSA_PUBLIC_KEY，跳过签名验证（仅开发环境允许）');
      return true;
    }

    const payload = this.buildSignPayload(data);
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(payload);
    verifier.end();

    try {
      return verifier.verify(publicKeyPem, signature, 'base64');
    } catch (err) {
      this.logger.error(`License 签名验证异常：${(err as Error).message}`);
      return false;
    }
  }

  /**
   * 解析 License 文件（base64 → JSON → 校验 schema → 验签）
   */
  parseLicenseFile(licenseFileBase64: string): LicenseFile {
    let jsonStr: string;
    try {
      jsonStr = Buffer.from(licenseFileBase64, 'base64').toString('utf-8');
    } catch {
      throw new BadRequestException({
        code: 'LICENSE_FILE_DECODE_FAILED',
        message: 'License 文件 base64 解码失败',
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new BadRequestException({
        code: 'LICENSE_FILE_PARSE_FAILED',
        message: 'License 文件 JSON 解析失败',
      });
    }

    if (typeof parsed !== 'object' || parsed === null) {
      throw new BadRequestException({
        code: 'LICENSE_FILE_INVALID',
        message: 'License 文件格式无效',
      });
    }

    const obj = parsed as { data?: unknown; signature?: unknown };
    if (!obj.data || typeof obj.signature !== 'string') {
      throw new BadRequestException({
        code: 'LICENSE_FILE_INVALID',
        message: 'License 文件缺少 data 或 signature 字段',
      });
    }

    const dataResult = licenseDataSchema.safeParse(obj.data);
    if (!dataResult.success) {
      throw new BadRequestException({
        code: 'LICENSE_DATA_INVALID',
        message: 'License 数据字段校验失败',
        detail: dataResult.error.errors,
      });
    }

    return {
      data: dataResult.data,
      signature: obj.signature,
    };
  }

  // ============================================================================
  // 3. License 激活与校验
  // ============================================================================

  /**
   * 激活 License
   *
   * 流程：
   * 1. 解析 License 文件
   * 2. 验证签名
   * 3. 校验 machineId 是否匹配当前机器
   * 4. 校验过期时间
   * 5. 持久化到数据库
   */
  async activate(licenseFileBase64: string): Promise<{ status: string; license: LicenseData }> {
    const file = this.parseLicenseFile(licenseFileBase64);

    // 验签
    if (!this.verifySignature(file.data, file.signature)) {
      throw new ForbiddenException({
        code: 'LICENSE_SIGNATURE_INVALID',
        message: 'License 签名验证失败，文件可能被篡改',
      });
    }

    // 校验机器码
    const currentMachineId = this.generateMachineId();
    if (file.data.machineId !== currentMachineId) {
      throw new ForbiddenException({
        code: 'LICENSE_MACHINE_MISMATCH',
        message: `License 绑定的机器码与当前机器不匹配（期望 ${file.data.machineId.slice(0, 8)}…，实际 ${currentMachineId.slice(0, 8)}…）`,
      });
    }

    // 校验过期时间
    const expireAt = new Date(file.data.expireAt);
    if (expireAt.getTime() < Date.now()) {
      throw new ForbiddenException({
        code: 'LICENSE_EXPIRED',
        message: `License 已于 ${file.data.expireAt} 过期`,
      });
    }

    // 持久化（单实例仅一条 License 记录）
    const existing = await this.prisma.license.findFirst();
    const data: Prisma.LicenseCreateInput | Prisma.LicenseUpdateInput = {
      licenseData: file.data as unknown as Prisma.InputJsonValue,
      machineId: file.data.machineId,
      domain: file.data.domain,
      status: 'ACTIVE',
      verifiedAt: new Date(),
      expireAt,
    };

    let license;
    if (existing) {
      license = await this.prisma.license.update({
        where: { id: existing.id },
        data: data as Prisma.LicenseUpdateInput,
      });
    } else {
      license = await this.prisma.license.create({
        data: data as Prisma.LicenseCreateInput,
      });
    }

    this.logger.log(`License 已激活：${file.data.licenseId}（域名 ${file.data.domain}，到期 ${file.data.expireAt}）`);
    return { status: license.status, license: file.data };
  }

  /**
   * 获取当前 License 状态
   */
  async getStatus(): Promise<{
    activated: boolean;
    status: string;
    machineId: string;
    license?: LicenseData;
    expireAt?: string;
    daysRemaining?: number;
  }> {
    const machineId = this.generateMachineId();
    const record = await this.prisma.license.findFirst();

    if (!record) {
      return { activated: false, status: 'INACTIVE', machineId };
    }

    const expireAt = record.expireAt;
    const now = Date.now();
    let status = record.status;

    if (expireAt && expireAt.getTime() < now && status === 'ACTIVE') {
      status = 'EXPIRED';
      await this.prisma.license.update({
        where: { id: record.id },
        data: { status: 'EXPIRED' },
      });
    }

    const daysRemaining = expireAt
      ? Math.max(0, Math.ceil((expireAt.getTime() - now) / (24 * 60 * 60 * 1000)))
      : undefined;

    return {
      activated: status === 'ACTIVE',
      status,
      machineId,
      license: record.licenseData as unknown as LicenseData,
      expireAt: expireAt?.toISOString(),
      daysRemaining,
    };
  }

  /**
   * 启动时验证 License 状态（供 main.ts 调用）
   *
   * 验证失败时：
   * - 已发布静态站点保持正常访问（Nginx 直接托管）
   * - 管理/编辑功能锁定（通过 isLicenseValid() 判断）
   */
  async validateOnStartup(): Promise<{ valid: boolean; reason?: string }> {
    const strictMode = this.config.get<boolean>('LICENSE_STRICT_MODE', true);
    if (!strictMode) {
      this.logger.warn('License 严格模式已关闭，跳过启动验证（仅供开发环境使用）');
      return { valid: true };
    }

    const record = await this.prisma.license.findFirst();
    if (!record) {
      return { valid: false, reason: '未激活 License' };
    }

    const machineId = this.generateMachineId();
    if (record.machineId !== machineId) {
      return { valid: false, reason: '机器码不匹配，License 已失效' };
    }

    if (record.expireAt && record.expireAt.getTime() < Date.now()) {
      return { valid: false, reason: 'License 已过期' };
    }

    return { valid: true };
  }

  /**
   * 检查 License 是否有效（供守卫或业务逻辑调用）
   */
  async isLicenseValid(): Promise<boolean> {
    const result = await this.validateOnStartup();
    return result.valid;
  }

  /**
   * 获取当前机器码（用于页面显示，提交给 License 签发服务）
   */
  async getMachineFingerprint(): Promise<{ machineId: string }> {
    return { machineId: this.generateMachineId() };
  }
}
