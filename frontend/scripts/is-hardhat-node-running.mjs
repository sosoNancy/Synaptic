import { ethers } from "ethers";

async function ensureHardhatNode() {
  const provider = new ethers.JsonRpcProvider("http://localhost:8545");

  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`[NeuroFlash] Hardhat node detected. Latest block: ${blockNumber}`);
  } catch {
    console.error("\n==============================================================\n");
    console.error("⚠️  未检测到本地 Hardhat 节点。\n");
    console.error("请按以下步骤启动：");
    console.error("1. 打开新的终端窗口");
    console.error("2. 切换到 ./action/contracts 目录");
    console.error("3. 执行: npx hardhat node --network hardhat");
    console.error("\n==============================================================\n");
    process.exit(1);
  }
}

ensureHardhatNode();


