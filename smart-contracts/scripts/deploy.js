import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const DonationPlatform = await connection.ethers.getContractFactory("DonationPlatform");
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
