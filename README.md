
如何运行代码

1. 下载代码库
https://github.com/wangyouquanMas/arbitrage.git

2. 安装Jupiter v6 节点

为什么要安装？ 
不安全就无法进行循环套利：就是输入输出币种相同
Jupiter v6 节点支持循环套利
参考：https://dev.jup.ag/docs/old/apis/self-hosted

如何安装：
第一步： 下载 jupiter-swap-api 
https://github.com/jup-ag/jupiter-swap-api/releases

第二步： 解压
unzip jupiter-swap-api-v6.0.0-linux-x64.zip

第三步： 运行
./jupiter-swap-api --rpc-url "填写RPC节点" --allow-circular-arbitrage --filter-markets-with-mints So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v --snapshot-poll-interval-ms 3000 --host 0.0.0.0 --port 8080

RPC节点可以填写Helius 的RPC节点


3. 运行套利代码
npx esrun src/index.ts


















