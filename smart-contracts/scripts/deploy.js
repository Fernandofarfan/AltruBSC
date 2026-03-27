import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DonationPlatform
  const DonationPlatform = await connection.ethers.deployContract("DonationPlatform");
  await DonationPlatform.waitForDeployment();
  const platformAddress = await DonationPlatform.getAddress();
  console.log("DonationPlatform deployed to:", platformAddress);

  // Deploy Mock USDT
  const MockUSDT = await connection.ethers.deployContract("MockERC20", ["Mock USDT", "USDT"]);
  await MockUSDT.waitForDeployment();
  const usdtAddress = await MockUSDT.getAddress();
  console.log("Mock USDT deployed to:", usdtAddress);

  console.log("\nAddresses for frontend:");
  console.log(`CONTRACT_ADDRESS = "${platformAddress}"`);
  console.log(`USDT_ADDRESS = "${usdtAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
