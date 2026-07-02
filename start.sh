#!/bin/bash
# SiteForge 一键启动脚本
# 用法: ./start.sh [prototype|backend|frontend|all]

set -e

NODE_BIN="/root/.nvm/versions/node/v22.13.1/bin"
NPX="$NODE_BIN/npx"
NODE="$NODE_BIN/node"
NPM="$NODE_BIN/npm"
export NODE_OPTIONS=""

MODE="${1:-all}"

echo ""
echo "============================================"
echo "  SiteForge 一键启动"
echo "============================================"
echo ""

# 检查 node
if ! $NODE -v &>/dev/null; then
  echo "❌ Node.js 未找到，请先安装 Node.js 18+"
  exit 1
fi

echo "Node.js: $($NODE -v)"

# ========== 原型 ==========
start_prototype() {
  echo ""
  echo "--- 启动原型 (UI + API) ---"
  cd /workspace/siteforge-prototype
  if [ ! -d node_modules ]; then
    echo "安装依赖..."
    $NPM install 2>&1 | tail -1
  fi
  $NODE server.js &
  PROTO_PID=$!
  echo "✅ 原型已启动: http://localhost:3000 (PID: $PROTO_PID)"
}

# ========== 后端 ==========
start_backend() {
  echo ""
  echo "--- 启动后端 (NestJS API) ---"
  cd /workspace/siteforge/backend
  if [ ! -d node_modules ]; then
    echo "安装依赖..."
    $NPM install 2>&1 | tail -1
  fi
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "已创建 .env 文件，请修改配置后重启"
  fi
  $NPX prisma generate 2>/dev/null
  $NPM run start:dev &
  BACKEND_PID=$!
  echo "✅ 后端已启动: http://localhost:3001 (PID: $BACKEND_PID)"
}

# ========== 前端 ==========
start_frontend() {
  echo ""
  echo "--- 启动前端 (React + Vite) ---"
  cd /workspace/siteforge/frontend
  if [ ! -d node_modules ]; then
    echo "安装依赖..."
    $NPM install 2>&1 | tail -1
  fi
  $NPX vite --port 5173 &
  FRONTEND_PID=$!
  echo "✅ 前端已启动: http://localhost:5173 (PID: $FRONTEND_PID)"
}

case "$MODE" in
  prototype|proto)
    start_prototype
    echo ""
    echo "按 Ctrl+C 停止"
    wait $PROTO_PID
    ;;
  backend)
    start_backend
    echo ""
    echo "按 Ctrl+C 停止"
    wait $BACKEND_PID
    ;;
  frontend)
    start_frontend
    echo ""
    echo "按 Ctrl+C 停止"
    wait $FRONTEND_PID
    ;;
  all)
    start_prototype
    start_frontend
    echo ""
    echo "============================================"
    echo "  全部服务已启动！"
    echo "  原型 UI:  http://localhost:3000"
    echo "  前端 UI:  http://localhost:5173"
    echo "============================================"
    echo ""
    echo "按 Ctrl+C 停止所有服务"
    wait
    ;;
  *)
    echo "用法: ./start.sh [prototype|backend|frontend|all]"
    exit 1
    ;;
esac
