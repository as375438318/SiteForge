#!/bin/bash
# ============================================================================
# SiteForge 首次部署初始化脚本
#
# 功能：
#   1. 检查 .env 文件，不存在则从 .env.example 复制
#   2. 启动 Docker Compose 服务
#   3. 等待数据库就绪
#   4. 运行数据库迁移（prisma migrate deploy）
#   5. 显示服务状态与访问地址
#
# 用法：
#   bash scripts/init.sh
# ============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== SiteForge 首次部署 ==="
echo ""

# 1. 检查 .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ 已创建 .env 文件（从 .env.example 复制）"
  echo "⚠️  请按需修改 .env 中的 DOMAIN / POSTGRES_PASSWORD / JWT_SECRET 等敏感配置"
else
  echo "✅ 已存在 .env 文件，跳过创建"
fi

# 2. 检查 Docker 环境
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ 未安装 docker，请先安装 Docker"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "❌ 未安装 docker compose 插件，请先安装"
  exit 1
fi
echo "✅ Docker 环境就绪"

# 3. 启动 Docker 服务
echo ""
echo ">>> 启动 Docker 服务（docker compose up -d --build）..."
docker compose up -d --build

# 4. 等待数据库就绪
echo ""
echo ">>> 等待 PostgreSQL / Redis 健康检查通过..."
timeout=120
elapsed=0
while [ $elapsed -lt $timeout ]; do
  pg_state=$(docker inspect --format='{{.State.Health.Status}}' siteforge-postgres 2>/dev/null || echo "starting")
  rd_state=$(docker inspect --format='{{.State.Health.Status}}' siteforge-redis 2>/dev/null || echo "starting")
  if [ "$pg_state" = "healthy" ] && [ "$rd_state" = "healthy" ]; then
    echo "✅ 数据库与缓存已就绪（耗时 ${elapsed}s）"
    break
  fi
  printf "."
  sleep 3
  elapsed=$((elapsed + 3))
done
echo ""

if [ "$pg_state" != "healthy" ]; then
  echo "❌ PostgreSQL 健康检查失败（status=$pg_state），请检查日志：docker logs siteforge-postgres"
  exit 1
fi

# 5. 等待 app 容器就绪并运行迁移（Dockerfile CMD 已自动执行 prisma migrate deploy）
echo ""
echo ">>> 等待 app 容器启动..."
app_state="starting"
timeout=120
elapsed=0
while [ $elapsed -lt $timeout ]; do
  app_state=$(docker inspect --format='{{.State.Health.Status}}' siteforge-app 2>/dev/null || echo "starting")
  if [ "$app_state" = "healthy" ]; then
    echo "✅ app 容器已就绪（耗时 ${elapsed}s）"
    break
  fi
  printf "."
  sleep 3
  elapsed=$((elapsed + 3))
done
echo ""

# 即使容器健康也再显式执行一次迁移，确保 schema 同步
echo ""
echo ">>> 执行数据库迁移（docker compose exec app npx prisma migrate deploy）..."
docker compose exec -T app npx prisma migrate deploy || echo "⚠️  迁移执行失败，请手动检查：docker compose exec app npx prisma migrate deploy"

# 6. 验证
echo ""
echo ">>> 容器状态："
docker compose ps

echo ""
echo "=== 部署完成 ==="
echo ""
echo "服务地址："
echo "  API:        http://localhost/api"
echo "  健康检查:   http://localhost/health"
echo "  Swagger:    http://localhost/api/docs"
echo ""
echo "常用命令："
echo "  查看日志:   docker compose logs -f"
echo "  停止服务:   docker compose down"
echo "  自检:       bash scripts/verify.sh"
echo "  备份:       bash scripts/backup.sh"
