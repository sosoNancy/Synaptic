import hre, { ethers } from "hardhat";

async function main() {
  const target = ethers.getAddress("0x70997970c51812dc3a010c7d01b50e0d17dc79c8");
  const deployment = await hre.deployments.get("NeuroFlashLedger");
  const contract = await ethers.getContractAt("NeuroFlashLedger", deployment.address);
  const role = await contract.CURATOR_ROLE();
  const tx = await contract.grantRole(role, target);
  console.log(`Granting CURATOR_ROLE to ${target}, tx: ${tx.hash}`);
  await tx.wait();
  console.log("Role granted successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

