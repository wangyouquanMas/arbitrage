# 🔄 Solana 套利机器人

> 基于 Jupiter 和 Jito 的 Solana 链上套利交易系统

## 🚀 快速开始

### 📋 前置要求

- Node.js 18+
- Git
- Linux/macOS 环境（推荐）

### 📥 安装步骤

#### 1. 克隆代码库

```bash
git clone https://github.com/wangyouquanMas/arbitrage.git
cd arbitrage
```

#### 2. 安装依赖

```bash
npm install
```

---

## ⚙️ Jupiter v6 节点配置

### 🤔 为什么需要自建节点？

> **循环套利支持**: 只有 Jupiter v6 自建节点才支持循环套利（输入输出币种相同）

### 📦 安装 Jupiter v6 API

#### 步骤 1: 下载 API 服务

```bash
# 访问 GitHub Releases 下载最新版本
wget https://github.com/jup-ag/jupiter-swap-api/releases/download/v6.0.0/jupiter-swap-api-v6.0.0-linux-x64.zip
```

#### 步骤 2: 解压文件

```bash
unzip jupiter-swap-api-v6.0.0-linux-x64.zip
chmod +x jupiter-swap-api
```

#### 步骤 3: 启动服务

```bash
./jupiter-swap-api \
  --rpc-url "YOUR_RPC_ENDPOINT" \
  --allow-circular-arbitrage \
  --filter-markets-with-mints So11111111111111111111111111111111111111112 EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --snapshot-poll-interval-ms 3000 \
  --host 0.0.0.0 \
  --port 8080
```

### 🔧 配置说明

| 参数 | 说明 |
|------|------|
| `--rpc-url` | Solana RPC 节点地址（推荐使用 Helius） |
| `--allow-circular-arbitrage` | 启用循环套利功能 |
| `--filter-markets-with-mints` | 过滤特定代币市场 |
| `--snapshot-poll-interval-ms` | 快照轮询间隔（毫秒） |
| `--host` | 服务监听地址 |
| `--port` | 服务端口 |

---

## 🏃‍♂️ 运行套利程序

### 启动命令

```bash
npx esrun src/index.ts
```

### 🔍 监控输出

程序运行时会显示：
- 🔍 **扫描状态**: 实时市场扫描
- 💰 **套利机会**: 发现的盈利机会
- 📊 **交易结果**: 执行结果和收益

---

## 🏗️ 代码架构

### 📁 项目结构

```
arbitrage/
├── src/
│   └── index.ts          # 主程序入口
├── package.json          # 项目配置
└── README.md            # 项目文档
```

### 🔧 核心模块

代码结构简洁，分为 **3个核心部分**：

#### 1. 🔍 Jupiter 报价模块
- 获取最优交易路径
- 计算套利机会
- 双向报价比较

#### 2. 🔨 交易构造模块
- 构建套利交易指令
- 合并多个 swap 操作
- 优化 gas 费用

#### 3. ⛓️ Jito 上链模块
- Bundle 交易打包
- MEV 保护执行
- 失败零成本保障

### 💡 技术亮点

> 🎯 **核心技术**: 将两个 swap 指令合并到一个交易中，涉及 Jupiter 路由构造的高级技术

---

## 🔧 配置说明

### 环境变量

创建 `.env` 文件：
在其中填写你的私钥