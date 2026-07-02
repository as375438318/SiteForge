import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Prisma Seed 脚本
 *
 * 用法：
 *   npx prisma db seed
 *
 * 创建一个默认管理员账号（仅当数据库中无用户时）
 * 默认账号：admin / admin@siteforge.local / Admin@12345
 * 首次登录后请立即修改密码！
 */
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('已存在用户，跳过 seed');
    return;
  }

  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@siteforge.local',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log('Seed 完成 — 默认管理员账号已创建');
  console.log('  用户名: admin');
  console.log('  密码: Admin@12345');
  console.log('  ⚠️ 请立即修改默认密码！');
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
