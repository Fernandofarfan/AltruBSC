import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("DonationPlatform", function () {
  let DonationPlatform, donationPlatform;
  let MockERC20, mockToken;
  let owner, admin, donor, nonAdmin;

  beforeEach(async function () {
    [owner, admin, donor, nonAdmin] = await ethers.getSigners();

    MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Tether USD", "USDT");

    DonationPlatform = await ethers.getContractFactory("DonationPlatform");
    donationPlatform = await DonationPlatform.deploy();

    await mockToken.transfer(donor.address, ethers.parseUnits("1000", 18));
  });

  it("Should register an NGO", async function () {
    await donationPlatform.registerNGO(admin.address, "Red Cross");
    const ngo = await donationPlatform.verifiedNGOs(admin.address);
    expect(ngo.isVerified).to.be.true;
    expect(ngo.name).to.equal("Red Cross");
  });

  it("Should create a cause", async function () {
    await donationPlatform.registerNGO(admin.address, "Red Cross");
    await donationPlatform.createCause("Flood Relief", ethers.parseUnits("10", 18), admin.address);
    const cause = await donationPlatform.causes(1);
    expect(cause.name).to.equal("Flood Relief");
    expect(cause.verifiedNGO).to.equal(admin.address);
  });

  it("Should accept BNB donations", async function () {
    await donationPlatform.registerNGO(admin.address, "Red Cross");
    await donationPlatform.createCause("Flood Relief", ethers.parseUnits("10", 18), admin.address);
    
    await donationPlatform.connect(donor).donateToCause(1, { value: ethers.parseUnits("1", 18) });
    const balance = await donationPlatform.causeBalances(1, ethers.ZeroAddress);
    expect(balance).to.equal(ethers.parseUnits("1", 18));
  });

  it("Should accept ERC20 donations", async function () {
    await donationPlatform.registerNGO(admin.address, "Red Cross");
    await donationPlatform.createCause("Flood Relief", ethers.parseUnits("10", 18), admin.address);
    
    await mockToken.connect(donor).approve(donationPlatform.target, ethers.parseUnits("100", 18));
    await donationPlatform.connect(donor).donateTokenToCause(1, mockToken.target, ethers.parseUnits("100", 18));
    
    const balance = await donationPlatform.causeBalances(1, mockToken.target);
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Should allow cause admin to withdraw BNB", async function () {
    await donationPlatform.registerNGO(admin.address, "Red Cross");
    await donationPlatform.createCause("Flood Relief", ethers.parseUnits("10", 18), admin.address);
    await donationPlatform.connect(donor).donateToCause(1, { value: ethers.parseUnits("1", 18) });
    
    const initialBalance = await ethers.provider.getBalance(admin.address);
    const tx = await donationPlatform.connect(admin).withdraw(1, ethers.ZeroAddress);
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    
    const finalBalance = await ethers.provider.getBalance(admin.address);
    expect(finalBalance).to.equal(initialBalance + ethers.parseUnits("1", 18) - gasUsed);
  });

});
