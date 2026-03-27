import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [owner, ngoWallet, userWallet] = await connection.ethers.getSigners();
  
  const platformAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const usdtAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
