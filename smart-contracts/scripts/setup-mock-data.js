import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [owner, ngoWallet, userWallet] = await connection.ethers.getSigners();
  
  const platformAddress = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
  const usdtAddress = "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c";

  const DonationPlatform = await connection.ethers.getContractAt("DonationPlatform", platformAddress);
  const MockUSDT = await connection.ethers.getContractAt("MockERC20", usdtAddress);

  console.log("Registering NGO...");
  await (await DonationPlatform.registerNGO(ngoWallet.address, "Red Cross BSC")).wait();

  console.log("Creating Causes...");
  const goalBNB = connection.ethers.parseEther("50");
  const goalUSDT = connection.ethers.parseUnits("5000", 18);
  
  await (await DonationPlatform.createCause("Emergency Flood Relief", goalBNB, ngoWallet.address)).wait();
  await (await DonationPlatform.createCause("Education for All (USDT)", goalUSDT, ngoWallet.address)).wait();

  console.log("Minting USDT to user...");
  await (await MockUSDT.mint(owner.address, connection.ethers.parseUnits("10000", 18))).wait();

  console.log("Mock data setup COMPLETE.");

  // Add Proof of Impact Updates
  console.log("Adding Proof of Impact updates...");
  await (await DonationPlatform.connect(ngoWallet).addCauseUpdate(1, "¡Camas de hospital instaladas!")).wait();
  await (await DonationPlatform.connect(ngoWallet).addCauseUpdate(2, "Primeras cajas de insumos entregadas.")).wait();
  console.log("Impact updates ADDED.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
