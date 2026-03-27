#!/usr/bin/env node

import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONTRACTS = {
  PLATFORM: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  USDT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  NFT: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

async function getCauses() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const artifactsDir = "../artifacts/contracts";
  
  const platformAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "DonationPlatform.sol/DonationPlatform.json"), "utf8")
  ).abi;
  
  const platform = new ethers.Contract(CONTRACTS.PLATFORM, platformAbi, provider);
  
  const count = await platform.causeCount();
  console.log("\n📋 DONATION CAUSES\n");
  console.log("═══════════════════════════════════════════════════════════════");
  
  for (let i = 1; i <= count; i++) {
    const cause = await platform.causes(i);
    const percentage = (Number(cause.raised) / Number(cause.goalAmount) * 100).toFixed(1);
    const unit = cause.name.includes("USDT") ? "USDT" : "BNB";
    
    console.log(`\n💚 Cause #${i}: ${cause.name}`);
    console.log(`   Status: ${cause.isClosed ? "CLOSED ❌" : "ACTIVE ✅"}`);
    console.log(`   Goal: ${ethers.formatUnits(cause.goalAmount, unit === "USDT" ? 18 : 0)} ${unit}`);
    console.log(`   Raised: ${ethers.formatUnits(cause.raised, unit === "USDT" ? 18 : 0)} ${unit}`);
    console.log(`   Progress: [${"█".repeat(Math.floor(percentage/5))}${" ".repeat(20-Math.floor(percentage/5))}] ${percentage}%`);
  }
  
  console.log("\n═══════════════════════════════════════════════════════════════\n");
}

async function getDonor(address) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const artifactsDir = "../artifacts/contracts";
  
  const platformAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "DonationPlatform.sol/DonationPlatform.json"), "utf8")
  ).abi;
  
  const platform = new ethers.Contract(CONTRACTS.PLATFORM, platformAbi, provider);
  
  const donor = await platform.donors(address);
  const totalDonations = await platform.totalDonations(address);
  
  console.log(`\n👤 DONOR PROFILE: ${address.substring(0, 10)}...`);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`Total Donated: ${ethers.formatEther(donor.totalDonated)} BNB`);
  console.log(`Number of Donations: ${donor.donationCount}`);
  console.log(`Total Tracked: ${ethers.formatEther(totalDonations)} BNB`);
  console.log(`Reward Eligible: ${Number(donor.totalDonated) >= 0.5 ? "✅ YES" : "❌ NO"}`);
  console.log("═══════════════════════════════════════════════════════════════\n");
}

async function getCauseUpdates(causeId) {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const artifactsDir = "../artifacts/contracts";
  
  const platformAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "DonationPlatform.sol/DonationPlatform.json"), "utf8")
  ).abi;
  
  const platform = new ethers.Contract(CONTRACTS.PLATFORM, platformAbi, provider);
  
  const cause = await platform.causes(causeId);
  const updates = await platform.getCauseUpdates(causeId);
  
  console.log(`\n📰 UPDATES FOR: ${cause.name}`);
  console.log("═══════════════════════════════════════════════════════════════");
  
  if (updates.length === 0) {
    console.log("No updates yet.");
  } else {
    updates.forEach((update, i) => {
      console.log(`${i+1}. ${update}`);
    });
  }
  
  console.log("═══════════════════════════════════════════════════════════════\n");
}

async function getStatus() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const artifactsDir = "../artifacts/contracts";
  
  const platformAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "DonationPlatform.sol/DonationPlatform.json"), "utf8")
  ).abi;
  
  const platform = new ethers.Contract(CONTRACTS.PLATFORM, platformAbi, provider);
  
  const count = await platform.causeCount();
  const owner = await platform.owner();
  const nft = await platform.rewardNFT();
  
  let totalRaised = 0n;
  for (let i = 1; i <= count; i++) {
    const cause = await platform.causes(i);
    totalRaised += cause.raised;
  }
  
  console.log("\n📊 PLATFORM STATUS");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`✅ Status: OPERATIONAL`);
  console.log(`📍 Network: Hardhat Local (127.0.0.1:8545)`);
  console.log(`👤 Owner: ${owner.substring(0, 10)}...`);
  console.log(`💼 Active Causes: ${count}`);
  console.log(`💰 Total Raised: ${ethers.formatEther(totalRaised)} BNB equivalent`);
  console.log(`🎁 NFT System: ${nft === CONTRACTS.NFT ? "✅ ACTIVE" : "❌ INACTIVE"}`);
  console.log("═══════════════════════════════════════════════════════════════\n");
}

// Main CLI
const command = process.argv[2];

(async () => {
  try {
    switch (command) {
      case "causes":
        await getCauses();
        break;
      case "donor":
        await getDonor(process.argv[3] || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
        break;
      case "updates":
        await getCauseUpdates(process.argv[3] || 1);
        break;
      case "status":
        await getStatus();
        break;
      default:
        console.log(`
📚 ALTRU BSC PLATFORM - UTILITY CLI

Usage: node cli.js [command] [args]

Commands:
  causes          List all donation causes
  donor [addr]    Get donor statistics
  updates [id]    Get cause progress updates  
  status          Platform overall status

Examples:
  node cli.js causes
  node cli.js donor 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  node cli.js updates 1
  node cli.js status
        `);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
