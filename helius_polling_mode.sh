#!/bin/bash

# Helius共享节点 - 轮询模式（无gRPC）
./jupiter-swap-api \
  --rpc-url "https://mainnet.helius-rpc.com/?api-key=c9a7aa2a-c8b6-4720-87e0-aa975aba56b7" \
  --allow-circular-arbitrage \
  --filter-markets-with-mints So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --snapshot-poll-interval-ms 5000 \
  --total-thread-count 6 \
  --host 0.0.0.0 \
  --port 8080 