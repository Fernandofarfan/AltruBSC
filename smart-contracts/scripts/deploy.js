import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DonationPlatform
  const DonationPlatformFactory = await connection.ethers.getContractFactory("DonationPlatform");
  const platform = await DonationPlatformFactory.deploy();
  await platform.waitForDeployment();
  const platformAddress = await platform.getAddress();
  console.log("DonationPlatform deployed to:", platformAddress);

  // Deploy Mock USDT
  const MockERC20Factory = await connection.ethers.getContractFactory("MockERC20");
  const usdt = await MockERC20Factory.deploy("Mock USDT", "USDT"); // Original had args, need to keep them.
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("Mock USDT deployed to:", usdtAddress);

  // Deploy AltruRewardNFT
  const AltruRewardNFTFactory = await connection.ethers.getContractFactory("AltruRewardNFT");
  const rewardNFT = await AltruRewardNFTFactory.deploy(deployer.address); // Use deployer.address as owner
  await rewardNFT.waitForDeployment();
  const rewardNFTAddress = await rewardNFT.getAddress();
  console.log("AltruRewardNFT deployed to:", rewardNFTAddress);

  // Link NFT to Platform
  await platform.setRewardNFT(rewardNFTAddress);
  // Transfer ownership of NFT to Platform so it can mint
  await rewardNFT.transferOwnership(platformAddress);
  console.log("NFT System linked and active.");

  console.log("\nAddresses for frontend:");
  console.log(`CONTRACT_ADDRESS = "${platformAddress}"`);
  console.log(`USDT_ADDRESS = "${usdtAddress}"`);
  console.log(`REWARD_NFT_ADDRESS = "${rewardNFTAddress}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
