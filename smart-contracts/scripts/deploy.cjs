const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const DonationPlatform = await ethers.getContractFactory("DonationPlatform");
  const donationPlatform = await DonationPlatform.deploy();

  await donationPlatform.waitForDeployment();

  console.log("DonationPlatform deployed to:", await donationPlatform.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
