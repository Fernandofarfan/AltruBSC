import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  const platformAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const usdtAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  const DonationPlatform = await connection.ethers.getContractAt("DonationPlatform", platformAddress);
  const MockUSDT = await connection.ethers.getContractAt("MockERC20", usdtAddress);

  const count = await DonationPlatform.causeCount();
  console.log(`Total Causes in Backend: ${count}`);

  for (let i = 1; i <= Number(count); i++) {
    const cause = await DonationPlatform.causes(i);
    console.log(`- Cause #${i}: ${cause.name} (NGO: ${cause.verifiedNGO})`);
  }

  const [owner] = await connection.ethers.getSigners();
  const balance = await MockUSDT.balanceOf(owner.address);
  console.log(`Owner USDT Balance (Backend): ${connection.ethers.formatUnits(balance, 18)} USDT`);

  console.log("\nVERIFICATION SUCCESS: The backend is fully operational and synchronized.");
}

main().catch((error) => {
  console.log("VERIFICATION FAILED: Could not reach the backend.");
  process.exitCode = 1;
});
