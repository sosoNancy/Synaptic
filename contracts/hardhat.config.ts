import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

const MNEMONIC = vars.get("MNEMONIC", "");
const INFURA_API_KEY = vars.get("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
const PRIVATE_KEY = vars.get("PRIVATE_KEY", "");
const SEPOLIA_RPC_URL = vars.get(
  "SEPOLIA_RPC_URL",
  `https://sepolia.infura.io/v3/${INFURA_API_KEY}`
);

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
    organizer: 1,
    verifier: 2
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        bytecodeHash: "ipfs"
      },
      optimizer: {
        enabled: true,
        runs: 800
      },
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      chainId: 11155111,
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY && PRIVATE_KEY.length > 0 ? [PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", "")
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy"
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6"
  }
};

export default config;

