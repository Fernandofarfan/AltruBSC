import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const adminSigner = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const deployerAddr = adminSigner.address;

  console.log("Deploying with account:", deployerAddr);

  const artifactsDir = "../artifacts/contracts";

  async function deployContract(name, constructorArgs = []) {
    const artifactPath = path.join(__dirname, artifactsDir, `${name}.sol/${name}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, adminSigner);
    
    console.log(`Deploying ${name}...`);
    const contract = await factory.deploy(...constructorArgs);
    const receipt = await contract.deploymentTransaction()?.wait();
    const addr = await contract.getAddress();
    console.log(`✓ ${name} → ${addr}`);
    
    return contract;
  }

  try {
    // Deploy only contracts - no setup
    const platform = await deployContract("DonationPlatform");
    const platformAddr = await platform.getAddress();
    
    await sleep(2000);
    
    const usdt = await deployContract("MockERC20", ["Mock USDT", "USDT"]);
    const usdtAddr = await usdt.getAddress();
    
    await sleep(2000);
    
    const nft = await deployContract("AltruRewardNFT", [deployerAddr]);
    const nftAddr = await nft.getAddress();

    console.log("\n✓ CONTRACTS DEPLOYED SUCCESSFULLY\n");
    console.log("Use these in contract.ts:\n");
    console.log(`export const CONTRACT_ADDRESS = "${platformAddr}";`);
    console.log(`export const USDT_ADDRESS = "${usdtAddr}";`);
    console.log(`export const REWARD_NFT_ADDRESS = "${nftAddr}";\n`);

  } catch (error) {
    console.error("ERROR:", error.message);
    process.exitCode = 1;
  }
}

main();
