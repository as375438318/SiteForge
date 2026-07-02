# SiteForge Backend Dockerfile
# 基于 Node 22 LTS 镜像（多阶段构建）

# ====== Stage 1: 依赖安装与构建 ======
FROM node:22-slim AS builder

WORKDIR /app

# 安装构建 Prisma 所需的 OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 先复制 package*.json 与 prisma schema 以利用 Docker 缓存层
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# 安装所有依赖（含 devDependencies）
RUN npm ci || npm install

# 生成 Prisma Client
RUN npx prisma generate

# 复制源代码
COPY tsconfig.json nest-cli.json ./
COPY src ./src

# 编译 TypeScript
RUN npm run build

# 剔除 devDependencies，仅保留运行时依赖
RUN npm prune --production

# ====== Stage 2: 运行时镜像 ======
FROM node:22-slim AS runner

WORKDIR /app

# 安装运行时必需的 OpenSSL 与 tini（Prisma 客户端依赖 + 进程信号处理）
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    tini \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN groupadd -r siteforge && useradd -r -g siteforge -d /app -s /sbin/nologin siteforge

# 从 builder 阶段复制产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 创建数据目录
RUN mkdir -p /app/data/media /app/data/sites /app/data/backups \
    && chown -R siteforge:siteforge /app

USER siteforge

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]

# 启动前自动执行 prisma migrate deploy（生产环境用）
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
