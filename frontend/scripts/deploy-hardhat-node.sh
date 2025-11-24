#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

set -euo pipefail

HARDHAT_NODE_PORT=8545
HARDHAT_NODE_HOST=127.0.0.1
HARDHAT_NODE_URL="http://${HARDHAT_NODE_HOST}:${HARDHAT_NODE_PORT}"
TIMEOUT_SECONDS=60
CHECK_INTERVAL_SECONDS=1

cd "${SCRIPT_DIR}/../../contracts"

echo "--- 启动 Hardhat Node (后台运行) ---"
npx hardhat node &> /dev/null &
HARDHAT_PID_ROOT=$!

echo "Hardhat Node PID: $HARDHAT_PID_ROOT，等待节点就绪…"

ATTEMPTS=0
while [ $ATTEMPTS -lt $TIMEOUT_SECONDS ]; do
    if curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' "$HARDHAT_NODE_URL" > /dev/null 2>&1; then
        echo "Hardhat Node 已就绪！"
        break
    fi
    echo "等待中… (第 $((ATTEMPTS+1)) 次 / 共 $TIMEOUT_SECONDS 秒)"
    sleep "$CHECK_INTERVAL_SECONDS"
    ATTEMPTS=$((ATTEMPTS+1))
done

HARDHAT_PID=$(lsof -i :${HARDHAT_NODE_PORT} -t)

if [ $ATTEMPTS -eq $TIMEOUT_SECONDS ]; then
    echo "错误：Hardhat Node 未在 $TIMEOUT_SECONDS 秒内启动完成。"
    kill "$HARDHAT_PID_ROOT" || true
    kill "$HARDHAT_PID" || true
    exit 1
fi

echo "--- 在 Hardhat Node 上部署 NeuroFlashLedger.sol ---"
npx hardhat deploy --network localhost || true
TEST_EXIT_CODE=$?

echo "--- 关闭 Hardhat Node (PID: $HARDHAT_PID_ROOT) ---"
if ps -p "$HARDHAT_PID_ROOT" > /dev/null 2>&1; then
  kill "$HARDHAT_PID_ROOT"
fi

if ps -p "$HARDHAT_PID" > /dev/null 2>&1; then
  kill "$HARDHAT_PID"
fi

wait "$HARDHAT_PID_ROOT" 2>/dev/null || true
wait "$HARDHAT_PID" 2>/dev/null || true

sleep 1
exit "$TEST_EXIT_CODE"


