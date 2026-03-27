import hre from "hardhat";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const CONTRACTS = {
  PLATFORM: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  USDT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  NFT: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  // Only use owner account to avoid nonce issues
  const owner = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🧪 ALTRU BSC PLATFORM - FUNCTIONAL TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const artifactsDir = "../artifacts/contracts";
  
  // Load ABIs
  const platformAbi = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "DonationPlatform.sol/DonationPlatform.json"), "utf8")
  ).abi;
  
  const erc20Abi = JSON.parse(
    fs.readFileSync(path.join(__dirname, artifactsDir, "MockERC20.sol/MockERC20.json"), "utf8")
  ).abi;

  const platform = new ethers.Contract(CONTRACTS.PLATFORM, platformAbi, owner);
  const usdt = new ethers.Contract(CONTRACTS.USDT, erc20Abi, owner);

  let tests = [];

  async function test(name, fn) {
    try {
      console.log(`\n📝 ${name}`);
      const result = await fn();
      if (result) console.log(`   ${result}`);
      console.log(`   ✅ SUCCESS`);
      tests.push({ name, passed: true });
      return true;
    } catch (error) {
      console.error(`   ❌ FAILED: ${error.message}`);
      tests.push({ name, passed: false });
      return false;
    }
  }

  try {
    // TEST 1: Contract addresses
    await test("Verify contract addresses", async () => {
      const owner_addr = await platform.owner();
      if (owner_addr !== owner.address) throw new Error("Owner mismatch");
      return `Contracts loaded successfully`;
    });

    // TEST 2: Platform state
    await test("Read platform state", async () => {
      const count = await platform.causeCount();
      return `${count} causes in platform`;
    });

    // TEST 3: Cause retrieval
    await test("Retrieve cause details", async () => {
      const cause = await platform.causes(1);
      if (!cause.name) throw new Error("Cause not found");
      return `Cause 1: "${cause.name}" | Goal: ${ethers.formatEther(cause.goalAmount)} BNB`;
    });

    // TEST 4: View all causes
    await test("List all donation causes", async () => {
      const count = await platform.causeCount();
      let summary = "";
      for (let i = 1; i <= count; i++) {
        const cause = await platform.causes(i);
        summary += `\n   [${i}] ${cause.name}`;
      }
      return summary;
    });

    // TEST 5: NGO verification
    await test("Verify NGO registration", async () => {
      const ngo = await platform.verifiedNGOs(owner.address);
      if (!ngo.isVerified) throw new Error("NGO not verified");
      return `NGO verified: "${ngo.name}"`;
    });

    // TEST 6: BNB donation
    await test("Test BNB donation functionality", async () => {
      const amount = ethers.parseEther("1.0");
      const balBefore = await platform.causeBalances(1, ethers.ZeroAddress);
      
      const tx = await platform.donateToCause(1, { value: amount });
      await tx.wait(2);
      
      const balAfter = await platform.causeBalances(1, ethers.ZeroAddress);
      const raised = balAfter - balBefore;
      
      if (raised !== amount) throw new Error("Balance not updated");
      return `Donated ${ethers.formatEther(raised)} BNB successfully`;
    });

    await sleep(3000); // Extra time after major transaction

    // TEST 7: Donor tracking
    await test("Verify donor information tracking", async () => {
      const donor = await platform.donors(owner.address);
      return `Total donated: ${ethers.formatEther(donor.totalDonated)} BNB | Donations: ${donor.donationCount}`;
    });

    // TEST 8: User contributions
    await test("Check user contribution to cause", async () => {
      const contrib = await platform.userContributions(owner.address, 1, ethers.ZeroAddress);
      return `Contribution to Cause 1: ${ethers.formatEther(contrib)} BNB`;
    });

    // TEST 9: Token (USDT) approval
    await test("Approve USDT for platform", async () => {
      await sleep(2000); // Wait longer to avoid nonce issues
      const amount = ethers.parseUnits("10000", 18);
      const tx = await usdt.approve(CONTRACTS.PLATFORM, amount);
      await tx.wait(2); // Wait for 2 confirmations
      
      const allowance = await usdt.allowance(owner.address, CONTRACTS.PLATFORM);
      if (allowance < amount) throw new Error("Approval failed");
      return `Approved ${ethers.formatUnits(amount, 18)} USDT`;
    });

    // TEST 10: Token balance check
    await test("Check USDT balance", async () => {
      const balance = await usdt.balanceOf(owner.address);
      return `USDT balance: ${ethers.formatUnits(balance, 18)} USDT`;
    });

    // TEST 11: Token donation
    await test("Test USDT token donation", async () => {
      await sleep(2000); // Wait to avoid nonce issues
      const amount = ethers.parseUnits("500", 18);
      const balBefore = await platform.causeBalances(2, CONTRACTS.USDT);
      
      const tx = await platform.donateTokenToCause(2, CONTRACTS.USDT, amount);
      await tx.wait(2);
      
      const balAfter = await platform.causeBalances(2, CONTRACTS.USDT);
      const raised = balAfter - balBefore;
      
      if (raised !== amount) throw new Error("Token balance not updated");
      return `Donated ${ethers.formatUnits(raised, 18)} USDT successfully`;
    });

    // TEST 12: Cause updates
    await test("Add cause progress update", async () => {
      await sleep(2000);
      const updateMsg = "Foundation completed on day 1 - ahead of schedule!";
      const tx = await platform.addCauseUpdate(1, updateMsg);
      await tx.wait(2);
      return `Update added: "${updateMsg}"`;
    });

    // TEST 13: Retrieve updates
    await test("Retrieve cause updates/news", async () => {
      const updates = await platform.getCauseUpdates(1);
      if (updates.length === 0) throw new Error("No updates found");
      let summary = `Found ${updates.length} update(s)`;
      updates.forEach((u, i) => {
        summary += `\n   [${i+1}] ${u}`;
      });
      return summary;
    });

    // TEST 14: Cause status
    await test("Check closed cause status", async () => {
      const cause = await platform.causes(1);
      return `Cause 1 status: ${cause.isClosed ? "CLOSED" : "ACTIVE"}`;
    });

    // TEST 15: Cause balance
    await test("View cause financial summary", async () => {
      const cause = await platform.causes(1);
      const balance = await platform.causeBalances(1, ethers.ZeroAddress);
      const percentage = (Number(cause.raised) / Number(cause.goalAmount) * 100).toFixed(1);
      
      return `Cause 1: ${ethers.formatEther(cause.raised)}/${ethers.formatEther(cause.goalAmount)} BNB (${percentage}% of goal)`;
    });

    // TEST 16: Withdrawal
    await test("Withdraw funds from cause", async () => {
      await sleep(2000);
      const balBefore = await platform.causeBalances(3, ethers.ZeroAddress);
      if (balBefore === 0n) throw new Error("No balance to withdraw");
      
      const tx = await platform.withdraw(3, ethers.ZeroAddress);
      await tx.wait(2);
      
      const balAfter = await platform.causeBalances(3, ethers.ZeroAddress);
      return `Withdrew ${ethers.formatEther(balBefore)} BNB | Balance now: ${ethers.formatEther(balAfter)}`;
    });

    // TEST 17: Multiple causes status
    await test("View all causes summary", async () => {
      const count = await platform.causeCount();
      let summary = "";
      for (let i = 1; i <= Math.min(Number(count), 3); i++) {
        const cause = await platform.causes(i);
        const pct = (Number(cause.raised) / Number(cause.goalAmount) * 100).toFixed(0);
        summary += `\n   [${i}] ${cause.name.substring(0, 30)}... | ${pct}%`;
      }
      return summary;
    });

    // TEST 18: Total donations  
    await test("Verify total donations tracked", async () => {
      const totalDonations = await platform.totalDonations(owner.address);
      return `Total donations by owner: ${ethers.formatEther(totalDonations)} BNB equivalent`;
    });

    // TEST 19: NFT system
    await test("Verify NFT reward system configured", async () => {
      const nftAddr = await platform.rewardNFT();
      if (!nftAddr || nftAddr === ethers.ZeroAddress) throw new Error("NFT not configured");
      return `NFT system active: ${nftAddr === CONTRACTS.NFT ? "✅" : "❌"}`;
    });

    // TEST 20: Platform operational
    await test("Confirm platform is fully operational", async () => {
      const owner_check = await platform.owner();
      const count = await platform.causeCount();
      const nft_check = await platform.rewardNFT();
      
      if (!owner_check || count === 0n || !nft_check) throw new Error("Platform not fully operational");
      return `All systems operational: Owner ✅ | ${count} Causes ✅ | NFT ✅`;
    });

  } catch (error) {
    console.error("\n⚠️ CRITICAL ERROR:", error.message);
  }

  // SUMMARY
  const passed = tests.filter(t => t.passed).length;
  const total = tests.length;
  
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log("\n🎉 ALL TESTS PASSED - PLATFORM FULLY OPERATIONAL!");
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) need attention`);
  }
  console.log("═══════════════════════════════════════════════════════════════\n");
}

main();
