import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const [owner, ngoWallet, userWallet] = await connection.ethers.getSigners();
  
  const platformAddress = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
  const usdtAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

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
