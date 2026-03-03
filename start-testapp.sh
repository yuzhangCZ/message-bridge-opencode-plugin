#!/bin/bash

# 启动 Mock Feishu Server 和 TestApp 示例的脚本

echo "=== 启动 Mock Feishu Server ==="
cd mockService
npm start &
MOCK_PID=$!
cd ..

# 等待 Mock Server 启动
sleep 2

echo "=== 启动 TestApp 示例 ==="
npx ts-node src/testApp/example.ts &
TESTAPP_PID=$!

echo "Mock Server PID: $MOCK_PID"
echo "TestApp PID: $TESTAPP_PID"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $MOCK_PID $TESTAPP_PID 2>/dev/null; exit" INT TERM

wait
