import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [owner, ngoWallet] = await connection.ethers.getSigners();
  
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const DonationPlatform = await connection.ethers.getContractAt("DonationPlatform", contractAddress);

  console.log("Registering NGO...");
  await (await DonationPlatform.registerNGO(ngoWallet.address, "Red Cross BSC")).wait();

  console.log("Creating Cause...");
  const goal = connection.ethers.parseEther("50");
  await (await DonationPlatform.createCause("Flood Relief 2026", goal, ngoWallet.address)).wait();

  console.log("Mock data setup complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
