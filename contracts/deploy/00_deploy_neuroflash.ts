import type { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();

  await deployments.deploy("NeuroFlashLedger", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true
  });
};

export default func;
func.tags = ["NeuroFlashLedger"];

