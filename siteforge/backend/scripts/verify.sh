#!/usr/bin/env bash
# ============================================================================
# SiteForge 部署自检脚本
#
# 功能：
#   1. 检查环境变量配置完整性
#   2. 检查 Docker 与 Compose 是否就绪
#   3. 检查所有容器状态
#   4. 检查 PostgreSQL 连通性
#   5. 检查 Redis 连通性
#   6. 检查 Nginx 是否对外服务
#   7. 检查应用健康端点
#   8. 检查 License 状态
#
# 用法：
#   bash scripts/verify.sh
# ============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
fi

# ----- 颜色 -----
if [[ -t 1 ]]; then
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    GREEN='' RED='' YELLOW='' BLUE='' NC=''
fi

PASS=0
FAIL=0
WARN=0

check() {
    local name="$1"
    local result="$2"
    local detail="${3:-}"

    if [[ "$result" == "pass" ]]; then
        echo -e "${GREEN}[PASS]${NC} $name"
        PASS=$((PASS + 1))
    elif [[ "$result" == "warn" ]]; then
        echo -e "${YELLOW}[WARN]${NC} $name ${detail:+— $detail}"
        WARN=$((WARN + 1))
    else
        echo -e "${RED}[FAIL]${NC} $name ${detail:+— $detail}"
        FAIL=$((FAIL + 1))
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SiteForge 部署自检${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# 1. 环境变量检查
# ============================================================================
echo -e "${BLUE}== 1. 环境变量 ==${NC}"

[[ -n "${DOMAIN:-}" ]] && check "DOMAIN 配置" pass || check "DOMAIN 配置" fail "未配置 DOMAIN"
[[ -n "${POSTGRES_PASSWORD:-}" && "${POSTGRES_PASSWORD}" != "siteforge123" ]] \
    && check "POSTGRES_PASSWORD 已修改" pass \
    || check "POSTGRES_PASSWORD" warn "使用默认值，请修改"
[[ -n "${JWT_SECRET:-}" && "${JWT_SECRET}" != "change-this-in-production" ]] \
    && check "JWT_SECRET 已修改" pass \
    || check "JWT_SECRET" warn "使用默认值，请修改"

# ============================================================================
# 2. Docker 与 Compose
# ============================================================================
echo ""
echo -e "${BLUE}== 2. Docker 环境 ==${NC}"

if command -v docker >/dev/null 2>&1; then
    check "docker 命令存在" pass
else
    check "docker 命令存在" fail "未安装 docker"
    exit 1
fi

if docker compose version >/dev/null 2>&1; then
    check "docker compose 插件" pass
elif command -v docker-compose >/dev/null 2>&1; then
    check "docker-compose 命令" pass
else
    check "docker compose" fail "未安装 docker compose"
fi

# ============================================================================
# 3. 容器状态
# ============================================================================
echo ""
echo -e "${BLUE}== 3. 容器状态 ==${NC}"

for svc in postgres redis app nginx; do
    container="siteforge-${svc}"
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        check "${container} 运行中" pass
    else
        check "${container} 运行中" fail "容器未运行"
    fi
done

# ============================================================================
# 4. PostgreSQL 连通性
# ============================================================================
echo ""
echo -e "${BLUE}== 4. PostgreSQL 数据库 ==${NC}"

PGPASSWORD="${POSTGRES_PASSWORD:-}" docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-}" \
    siteforge-postgres psql -U "${POSTGRES_USER:-siteforge}" -d "${POSTGRES_DB:-siteforge}" \
    -c "SELECT version();" >/dev/null 2>&1 \
    && check "PostgreSQL 连通" pass \
    || check "PostgreSQL 连通" fail "无法连接数据库"

# 检查数据库表是否已 migrate
table_count=$(PGPASSWORD="${POSTGRES_PASSWORD:-}" docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-}" \
    siteforge-postgres psql -U "${POSTGRES_USER:-siteforge}" -d "${POSTGRES_DB:-siteforge}" \
    -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
table_count=$(echo "$table_count" | tr -d '[:space:]')
if [[ "$table_count" -ge 10 ]]; then
    check "数据库已 migrate (${table_count} 张表)" pass
else
    check "数据库已 migrate" warn "仅 ${table_count} 张表，可能未执行 prisma migrate"
fi

# ============================================================================
# 5. Redis 连通性
# ============================================================================
echo ""
echo -e "${BLUE}== 5. Redis ==${NC}"

docker exec siteforge-redis redis-cli -a "${REDIS_PASSWORD:-siteforge-redis}" \
    ping >/dev/null 2>&1 \
    && check "Redis 连通" pass \
    || check "Redis 连通" fail "无法连接 Redis"

# ============================================================================
# 6. Nginx 服务
# ============================================================================
echo ""
echo -e "${BLUE}== 6. Nginx 反向代理 ==${NC}"

# 检查 80 端口
if curl -sSf -o /dev/null --max-time 5 "http://localhost/health" 2>/dev/null; then
    check "Nginx 80 端口响应" pass
elif curl -sSf -o /dev/null --max-time 5 "http://localhost:80/health" 2>/dev/null; then
    check "Nginx 80 端口响应" pass
else
    check "Nginx 80 端口响应" warn "无法访问 /health（可能 HTTPS 强制跳转）"
fi

# 检查 Nginx 配置语法
docker exec siteforge-nginx nginx -t >/dev/null 2>&1 \
    && check "Nginx 配置语法" pass \
    || check "Nginx 配置语法" fail "配置语法错误"

# ============================================================================
# 7. 应用健康端点
# ============================================================================
echo ""
echo -e "${BLUE}== 7. 应用服务 ==${NC}"

# 通过内网直连 app 容器
health_resp=$(docker exec siteforge-app node -e \
    "require('http').get('http://localhost:3000/health', r => { let d=''; r.on('data', c => d+=c); r.on('end', () => console.log(r.statusCode + '|' + d)); })" \
    2>/dev/null || echo "fail|")

if [[ "$health_resp" == 200* ]]; then
    check "应用 /health 端点" pass
else
    check "应用 /health 端点" fail "返回：${health_resp:0:50}"
fi

ready_resp=$(docker exec siteforge-app node -e \
    "require('http').get('http://localhost:3000/health/ready', r => { let d=''; r.on('data', c => d+=c); r.on('end', () => console.log(r.statusCode + '|' + d)); })" \
    2>/dev/null || echo "fail|")

if [[ "$ready_resp" == 200* ]]; then
    check "应用 /health/ready 端点" pass
else
    check "应用 /health/ready 端点" warn "返回：${ready_resp:0:50}"
fi

# ============================================================================
# 8. License 状态
# ============================================================================
echo ""
echo -e "${BLUE}== 8. License 授权 ==${NC}"

license_resp=$(docker exec siteforge-app node -e \
    "require('http').get('http://localhost:3000/license/machine-id', r => { let d=''; r.on('data', c => d+=c); r.on('end', () => console.log(r.statusCode + '|' + d)); })" \
    2>/dev/null || echo "fail|")

if [[ "$license_resp" == 200* ]]; then
    check "License 机器码生成" pass
else
    check "License 机器码生成" warn "无法获取机器码（需要登录认证）"
fi

# ============================================================================
# 汇总
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "  自检结果：${GREEN}${PASS} 通过${NC} / ${YELLOW}${WARN} 警告${NC} / ${RED}${FAIL} 失败${NC}"
echo -e "${BLUE}========================================${NC}"

if [[ $FAIL -gt 0 ]]; then
    echo ""
    echo -e "${RED}存在失败项，部署未通过自检${NC}"
    exit 1
elif [[ $WARN -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}存在警告项，建议检查后投产${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}全部检查通过，SiteForge 部署成功！${NC}"
    exit 0
fi
