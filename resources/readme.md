Self-hosted V6 Swap API
Jupiter provides the ability for advanced users can run a self-hosted Jupiter Swap API. You can download the jupiter-swap-api here.

Mission-critical use cases, like liquidations and oracles, can deploy their own API servers relying on their own RPC nodes to entirely decouple their systems from Jupiter infrastructure.

Integrators load is no longer restricted by the public API rate limits.

Prerequisites
A dedicated or shared Solana RPC node: optional but recommended with the Yellowstone gRPC plugin access.

The following RPC providers can provide a RPC node with the geyser plugin:

Triton
Helius Contact Helius on Discord
Shyft Contact Shyft on Discord
Solana Tracker
Usage
To start the API server:

RUST_LOG=info ./jupiter-swap-api --rpc-url <RPC-URL> --yellowstone-grpc-endpoint <GRPC-ENDPOINT> --yellowstone-grpc-x-token <X-TOKEN>

For instance, if you used Triton and your RPC url is https://supersolnode.jup/91842103123091841, the arguments would be --rpc-url https://supersolnode.jup/91842103123091841 --yellowstone-grpc-endpoint https://supersolnode.jup --yellowstone-grpc-x-token 91842103123091841

It is also possible to run the API in poll mode (heavy for nodes and it is not recommended). It will periodically poll the Solana RPC node for accounts rather than listening with the Yellowstone gRPC endpoint:

RUST_LOG=info ./jupiter-swap-api --rpc-url <RPC-URL>

For others options, use --help:

./jupiter-swap-api --help

Once the API server is ready, it will open a HTTP server at 0.0.0.0:8080.

The jupiter-swap-api is identical to the public Jupiter Swap API so all the documentation applies Swap API, replacing the api URL https://quote-api.jup.ag/v6 with http://127.0.0.1:8080.

Market Cache
The Jupiter self hosted Swap API relies on the market cache https://cache.jup.ag/markets?v=3 maintained by the Jupiter team, as a snapshot of all the relevant markets after liquidity filtering.

To pick up those new markets the api has to be restarted. The cache is updated every 30 minutes.

This is the only reliance on Jupiter infrastructure.

Adding New Markets (Without Restart)
To pick up new markets without restart, you can set --enable-add-market when starting the Jupiter self hosted Swap API. This way, you will see a new endpoint at /add-market. To add a new market without restarting the API, you can post to this endpoint. For example, let's say you have a new market on Raydium AMM, you will have to post the following payload to this endpoint:

{
  "address": "EzvDheLRnPjWy3S29MZYEi5qzcaR1WR5RNS8YhUA5WG5",
  "owner": "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  "params": { // Optional
    "serumAsks":"Ac8Hoi4LBbJfG4pCEUu2sS3jkmNrZBv6tbdmEnxAkRsK",
    "serumBids":"CF1NyAZjWqi8t9WZ7pSiqCiTSr3taZ94EW44AjyZRsnY",
    "serumCoinVaultAccount":"65LDE8k8WqhgrZy6NDsVQxGuUq3r8fT8bJunt5WPAZAk",
    "serumEventQueue":"1Xpk12GqjPLS8bkL8XVRHc6nrnunqcJhDha9jUq6Ymc",
    "serumPcVaultAccount":"AKATaDtSNPc5HemQCJzhph7o76Q1ndRHyKwai5C4wFkR",
    "serumVaultSigner":"7xookfS7px2FxR4JzpB3bT9nS3hUAENE4KsGaqkM6AoQ"
  },
  "addressLookupTableAddress":"5tVPTN4afHxuyS8CNCNrnU7WZJuYeq5e2FvxUdCMQG7F" // Optional
}

To derive the params, you can look up the Serum documentation.

MacOS
On MacOS you will see this error message:

“jupiter-swap-api” can’t be opened because Apple cannot check it for malicious software.

Go to System Settings and click on "Open Anyway":



Advanced
If a set of AMMs is never needed for routing, they can be removed before starting the api to reduce load.

Create a market-cache excluding the program you want to remove, Openbook for this example:

curl "https://cache.jup.ag/markets?v=3" -o market-cache.json
jq 'map(select(.owner != "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"))' market-cache.json > market-cache-no-openbook.json


Then:

RUST_LOG=info ./jupiter-swap-api --market-cache market-cache-no-openbook.json ...

This will start the API server without Openbook as part of routing. You can also remove individual market as well.

Paid Hosted APIs
We are working with some Solana RPC partners in the ecosystem as well so that you can get a paid hosted API ran by them.

QuickNode: https://marketplace.quicknode.com/add-on/metis-jupiter-v6-swap-api
Reach out to Triton: Triton





1. RPC节点

要么自建 》要么使用付费的 》 要么使用免费的


2. 如何使用付费RPC节点，来跑V6节点
主动轮询
./jupiter-swap-api --rpc-url "https://mainnet.helius-rpc.com/?api-key=" --allow-circular-arbitrage --filter-markets-with-mints So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --snapshot-poll-interval-ms 3000 --total-thread-count 6 --host 0.0.0.0 --port 8080


yellowstone 使用helius 的rpc 节点，自动推送最新的账户更新，比主动轮询的效率更高：instantly detect liquidity and price changes across DEXes
./jupiter-swap-api \
  --rpc-url "https://mainnet.helius-rpc.com/?api-key=" \
  --yellowstone-grpc-endpoint "solana-yellowstone-grpc.publicnode.com:443" \
  --yellowstone-grpc-x-token "c9a7aa2a-c8b6-4720-87e0-aa975aba56b7" \
  --allow-circular-arbitrage \
  --filter-markets-with-mints So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --host 0.0.0.0 \
  --port 8080




  2.1 --filter-markets-with-mints 作用？ 
    --filter-markets-with-mints 的作用是只监控包含指定代币的交易对，避免监控链上所有交易对导致速度变慢，让套利机器人只关注高价值、高流动性的交易对（如SOL、USDC、USDT），从而提高报价速度和捕获套利机会的效率。
    简单说：过滤交易对 → 减少监控数量 → 提高响应速度 → 更容易抓住套利机会

    Your --filter-markets-with-mints is working perfectly - it reduced markets from 758,888 to just 139 AMMs

    2025-05-31T10:41:58.368771Z  INFO jupiter_core::amms::loader: Excluded 758748 AMMs based on filter markets with mints: {EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, So11111111111111111111111111111111111111112}    
    2025-05-31T10:41:58.368793Z  INFO jupiter_core::amms::loader: Loaded 139 amms from market cache  

  2.2  --allow-circular-arbitrage 作用？
    --allow-circular-arbitrage 的作用是允许输入代币和输出代币相同的套利交易（如SOL→USDC→SOL），这是套利的核心功能，没有这个参数就无法进行"进出同一种币"的套利操作。
    简单说：开启循环套利 → 允许同币种进出 → 实现真正的套利交易（这就是课程中提到的必须开启的"Doop"选项）
  2.3  --total-thread-count 8 作用？
    --total-thread-count 8 的作用是为Jupiter API分配8个线程来并行处理报价请求、账户更新和交易对监控，提高套利机器人的并发处理能力和响应速度。
    简单说：8个线程 → 并行处理 → 更快的报价速度 → 更高的套利成功率
  2.4  --snapshot-poll-interval-ms 200 作用？
    --snapshot-poll-interval-ms 200 的作用是每200毫秒轮询一次AMM相关账户的状态更新（如流动性池余额变化），确保获取最新的链上数据来计算准确的套利报价。
    简单说：200毫秒轮询 → 获取最新池子状态 → 准确的价格数据 → 精确的套利计算
    注意： 如果使用Yellowstone gRPC，这个间隔会自动延长到30秒，因为gRPC提供实时推送，不需要频繁轮询。

  3. Yellowstone 在Arbitrage 中起到什么作用？
  Yellowstone provides real-time account updates that let your arbitrage bot instantly detect liquidity and price changes across DEXes, giving you the speed advantage to execute trades before competitors notice the opportunities

  3.1 如何使用Yellowstone ?
  --yellowstone-grpc-endpoint "https://jupiter.rpcpool.com" \
  --yellowstone-grpc-enable-ping \
  --yellowstone-grpc-compression-encoding gzip \



3. How to  check the speed of the API ? 



4. what I can learn from the response ? 

4.1 DEX Protocol Districution: 

The logs show which protocols dominate your filtered markets:
Meteora DLMM: 62 AMMs (44% of total)
Raydium CLMM: 13 AMMs
Whirlpool: 9 AMMs
Meteora: 6 AMMs
OpenBook V2: 6 AMMs

2025-05-31T10:41:58.368793Z  INFO jupiter_core::amms::loader: Loaded 139 amms from market cache    
2025-05-31T10:41:58.369061Z  INFO jupiter_core::amms::loader: AMMS per label loaded: {"FluxBeam": 1, "Whirlpool": 9, "SolFi": 5, "ZeroFi": 2, "Raydium CLMM": 13, "Token Swap": 1, "Perps": 1, "Meteora DLMM": 62, "Meteora": 6, "Woofi": 1, "Lifinity V2": 5, "Crema": 1, "Cropper": 1, "Guacswap": 1, "Phoenix": 1, "DexLab": 1, "OpenBook V2": 6, "Invariant": 2, "Pump.fun Amm": 3, "Raydium": 1, "Obric V2": 2, "Stabble Weighted Swap": 4, "Saros": 1, "Meteora DAMM v2": 3, "Aldrin": 1, "StepN": 1, "Orca V1": 1, "Orca V2": 1, "1DEX": 1, "Oasis": 1}  

4.2 Performance Bottlenecks
Router loading: 148 seconds (very slow)
Europa fetch: 9.86 seconds for market data
ALT loading: 367ms for 127 address lookup tables


4.3 Yellowstone gRPC Issues ⚠️
Multiple connection errors suggest configuration problems:
error while getting subscribe update: Status { code: Internal, message: "protocol error: received message with invalid compression flag: 32 (valid flags are 0 and 1) while receiving response with status: 403 Forbidden"


4.4 Filtering Effectiveness
Your --filter-markets-with-mints is working perfectly - it reduced markets from 758,888 to just 139 AMMs
This dramatically improves performance by focusing only on WSOL/USDC pairs


2025-05-31T10:35:51.446728Z  INFO jupiter_swap_api: Version: 6.0.48 709b6d2ed3e7ba9afa7bdd9be316a3fb86874e64
2025-05-31T10:35:51.447136Z  INFO jupiter_swap_api: Loading Jupiter router...
2025-05-31T10:35:51.447175Z  INFO jupiter_swap_api: Using market cache kind: Europa { url: "https://europa2.jup.ag" }    
2025-05-31T10:35:51.447196Z  INFO jupiter_swap_api: Running router with 2 threads in the CPU bound work thread pool
2025-05-31T10:35:51.592694Z  INFO jupiter_core::europa_client: Fetching markets from europa server...    
2025-05-31T10:36:01.394942Z  INFO jupiter_core::europa_client: Fetched 758833 markets from europa server in 9.802216727s    
2025-05-31T10:37:44.885707Z  INFO jupiter_core::amms::loader: markets len(): 758832    
2025-05-31T10:38:01.388885Z  INFO jupiter_core::amms::loader: Found 2583 not supported markets for owners: {11111111111111111111111111111111}    
2025-05-31T10:41:54.074419Z  WARN jupiter_core::amms::loader: Stakedex AMMs where not found in the cache, 2583 out of 930927    
2025-05-31T10:41:54.074522Z  INFO jupiter_core::amms::loader: New dexes are disabled, [] are not loaded    
2025-05-31T10:41:54.085382Z  INFO jupiter_core::amms::loader: updating amms with account_keys.len(): 29928 
2025-05-31T10:41:58.368771Z  INFO jupiter_core::amms::loader: Excluded 758748 AMMs based on filter markets with mints: {EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, So11111111111111111111111111111111111111112}    
2025-05-31T10:41:58.368793Z  INFO jupiter_core::amms::loader: Loaded 139 amms from market cache    
2025-05-31T10:41:58.369061Z  INFO jupiter_core::amms::loader: AMMS per label loaded: {"FluxBeam": 1, "Whirlpool": 9, "SolFi": 5, "ZeroFi": 2, "Raydium CLMM": 13, "Token Swap": 1, "Perps": 1, "Meteora DLMM": 62, "Meteora": 6, "Woofi": 1, "Lifinity V2": 5, "Crema": 1, "Cropper": 1, "Guacswap": 1, "Phoenix": 1, "DexLab": 1, "OpenBook V2": 6, "Invariant": 2, "Pump.fun Amm": 3, "Raydium": 1, "Obric V2": 2, "Stabble Weighted Swap": 4, "Saros": 1, "Meteora DAMM v2": 3, "Aldrin": 1, "StepN": 1, "Orca V1": 1, "Orca V2": 1, "1DEX": 1, "Oasis": 1}    
2025-05-31T10:41:58.888818Z  INFO jupiter_core::address_lookup_table_cache: Loading AddressLookupTableCache...    
2025-05-31T10:41:58.888848Z  INFO jupiter_core::address_lookup_table_cache: Fetching 127 address lookup tables    
2025-05-31T10:41:59.256125Z  INFO jupiter_core::address_lookup_table_cache: Update 127 ALTs into the AddressLookupTableCache in 367.272349ms    
2025-05-31T10:41:59.256148Z  INFO jupiter_core::router: 139 amms for 132 lookup tables    
2025-05-31T10:41:59.648501Z  INFO jupiter_core::router: Fetched 30 referral token accounts    
2025-05-31T10:41:59.648594Z  INFO jupiter_core::router: Fetching 7 mints...    
2025-05-31T10:42:00.207590Z  INFO jupiter_core::router: Fetched 7 mints into the mint repository    
2025-05-31T10:42:00.360217Z  INFO jupiter_core::router: Perform initial update #1    
2025-05-31T10:42:00.360344Z  INFO jupiter_core::router: create key_set: 35.67µs    
2025-05-31T10:42:00.890504Z  INFO jupiter_core::router: getMA + insert 530.12ms    
2025-05-31T10:42:00.897030Z  INFO jupiter_core::router: update: 6.50ms    
2025-05-31T10:42:00.897106Z  INFO jupiter_core::router: Perform initial update #2    
2025-05-31T10:42:00.897201Z  INFO jupiter_core::router: create key_set: 55.81µs    
2025-05-31T10:42:01.402441Z  INFO jupiter_core::router: getMA + insert 505.07ms    
2025-05-31T10:42:01.404661Z  INFO jupiter_core::router: update: 2.20ms    
2025-05-31T10:42:01.404673Z  INFO jupiter_core::router: Perform initial update #3    
2025-05-31T10:42:01.404740Z  INFO jupiter_core::router: create key_set: 60.15µs    
2025-05-31T10:42:01.713567Z  INFO jupiter_core::router: getMA + insert 308.82ms    
2025-05-31T10:42:01.713576Z  INFO jupiter_core::router: update: 684.00ns    
2025-05-31T10:42:01.714268Z  INFO jupiter_core::price_tracker: Price tracker updated 6 prices in 680.257µs    
2025-05-31T10:42:01.714283Z  INFO jupiter_swap_api: Loaded Jupiter router in 148.375197955s
2025-05-31T10:42:01.714302Z  INFO jupiter_swap_api: Starting Jupiter router background thread...
2025-05-31T10:42:01.714611Z  INFO jupiter_core::thread_pool_metrics: Thread pool metrics - waiting: 0, active: 0, max wait: 0.00ms    
2025-05-31T10:42:01.714764Z  INFO jupiter_core::geyser_client: geyser_subscribe_accounts_loop start, initial filter with 724    
2025-05-31T10:42:01.714815Z  INFO jupiter_core::geyser_client: Starting geyser client with accounts chunk size: 121    
2025-05-31T10:42:01.714852Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.719299Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.719464Z  INFO jupiter_core::price_tracker: Price tracker updated 6 prices in 702.175µs    
2025-05-31T10:42:01.723472Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.726580Z  INFO jupiter_core::price_tracker: Price tracker updated 6 prices in 655.466µs    
2025-05-31T10:42:01.727786Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.732133Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.736050Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.740468Z  INFO jupiter_core::geyser_client: Connect to subscribe to the geyser server    
2025-05-31T10:42:01.793919Z  INFO jupiter_core::europa_client: Connected to europa server    
2025-05-31T10:42:01.937218Z  INFO jupiter_core::geyser_client: subscribed to new accounts    
2025-05-31T10:42:01.937305Z  INFO jupiter_core::geyser_client: stream opened    
2025-05-31T10:42:01.937321Z ERROR jupiter_core::geyser_client: error while getting subscribe update: Status { code: Internal, message: "protocol error: received message with invalid compression flag: 32 (valid flags are 0 and 1) while receiving response with status: 403 Forbidden", source: None }    
2025-05-31T10:42:01.937972Z ERROR jupiter_core::geyser_client: stream closed    
2025-05-31T10:42:01.938625Z  INFO jupiter_core::geyser_client: subscribed to new accounts    
2025-05-31T10:42:01.938641Z  INFO jupiter_core::geyser_client: stream opened    
2025-05-31T10:42:01.938652Z ERROR jupiter_core::geyser_client: error while getting subscribe update: Status { code: Internal, message: "protocol error: received message with invalid compression flag: 32 (valid flags are 0 and 1) while receiving response with status: 403 Forbidden", source: None }    
2025-05-31T10:42:01.938664Z ERROR jupiter_core::geyser_client: stream closed    
2025-05-31T10:42:01.943901Z  INFO jupiter_core::geyser_client: subscribed to new accounts    
2025-05-31T10:42:01.943923Z  INFO jupiter_core::geyser_client: stream opened    
2025-05-31T10:42:01.943935Z ERROR jupiter_core::geyser_client: error while getting subscribe update: Status { code: Internal, message: "protocol error: received message with invalid compression flag: 32 (valid flags are 0 and 1) while receiving response with status: 403 Forbidden", source: None }    
2025-05-31T10:42:01.943946Z ERROR jupiter_core::geyser_client: stream closed    
2025-05-31T10:42:01.957756Z  INFO jupiter_core::geyser_client: subscribed to new accounts    
2025-05-31T10:42:01.957837Z  INFO jupiter_core::geyser_client: stream opened    
2025-05-31T10:42:01.957865Z ERROR jupiter_core::geyser_client: error while getting subscribe update: Status { code: Internal, message: "protocol error: received message with invalid compression flag: 32 (valid flags are 0 and 1) while receiving response with status: 403 Forbidden", source: None }    
2025-05-31T10:42:01.957890Z ERROR jupiter_core::geyser_client: stream closed    
2025-05-31T10:42:01.969255Z  INFO jupiter_core::geyser_client: subscribed to new accounts    
2025-05-31T10:42:01.969279Z  INFO jupiter_core::geyser_client: stream opened    