#!/bin/bash

# Helius共享节点 + Yellowstone gRPC 正确配置
./jupiter-swap-api \
  --rpc-url "https://mainnet.helius-rpc.com/?api-key=c9a7aa2a-c8b6-4720-87e0-aa975aba56b7" \
  --yellowstone-grpc-endpoint "grpc.helius.com:2053" \
  --yellowstone-grpc-x-token "c9a7aa2a-c8b6-4720-87e0-aa975aba56b7" \
  --allow-circular-arbitrage \
  --filter-markets-with-mints So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --total-thread-count 6 \
  --host 0.0.0.0 \
  --port 8080 