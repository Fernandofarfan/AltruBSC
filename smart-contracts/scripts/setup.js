import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const DEPLOYMENT = {
  PLATFORM: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  USDT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  NFT: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const signerAddr = signer.address;

  console.log("Setting up platform with account:", signerAddr);
  console.log("Platform:", DEPLOYMENT.PLATFORM);
  console.log("USDT:", DEPLOYMENT.USDT);
  console.log("NFT:", DEPLOYMENT.NFT);

  // Load ABI
  const artifactsDir = "../artifacts/contracts";
  const platformArtifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "DonationPlatform.sol/DonationPlatform.json"), "utf8")
  );

  const platformContract = new ethers.Contract(DEPLOYMENT.PLATFORM, platformArtifact.abi, signer);

  try {
    console.log("\n1. Setting up NFT system...");
    let tx = await platformContract.setRewardNFT(DEPLOYMENT.NFT);
    await tx.wait();
    console.log("✓ NFT system configured");

    await sleep(1000);

    console.log("\n2. Registering NGO...");
    tx = await platformContract.registerNGO(signerAddr, "Global Relief Foundation");
    await tx.wait();
    console.log("✓ NGO registered");

    await sleep(1000);

    console.log("\n3. Creating donation causes...");
    const causes = [
      { name: "Clean Water Initiative (BNB)", amount: ethers.parseEther("5") },
      { name: "Education for All (USDT)", amount: ethers.parseUnits("10000", 18) },
      { name: "Healthcare Crisis Response (BNB)", amount: ethers.parseEther("10") },
      { name: "Climate Action Program (USDT)", amount: ethers.parseUnits("50000", 18) },
      { name: "Food Security Project (BNB)", amount: ethers.parseEther("3") }
    ];

    for (const cause of causes) {
      tx = await platformContract.createCause(cause.name, cause.amount, signerAddr);
      await tx.wait();
      console.log(`✓ Created: ${cause.name}`);
      await sleep(500);
    }

    console.log("\n✓✓✓ PLATFORM SETUP COMPLETE ✓✓✓");
    console.log("\nYour platform is ready for donations!");
    console.log("Causes created: " + causes.length);

  } catch (error) {
    console.error("\nSETUP ERROR:", error.message);
    process.exitCode = 1;
  }
}

main();
