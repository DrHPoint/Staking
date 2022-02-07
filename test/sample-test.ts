import { expect } from "chai";
import { Contract, ContractFactory, Signer, utils } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { hexConcat } from "@ethersproject/bytes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

let Staking : ContractFactory;
let stak : Contract;
let ERC20 : ContractFactory;
let token : Contract;
let Reward : ContractFactory;
let reward : Contract;
let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let addr3: SignerWithAddress;
let addr4: SignerWithAddress;

describe("Hermes", function () {

  beforeEach(async () => {
    ERC20 = await ethers.getContractFactory("MyToken");
    Reward = await ethers.getContractFactory("MyToken");
    Staking = await ethers.getContractFactory("Staking");
  });

  describe("Stacking", () => {

    it("0) Deploy, mint and get allowance", async function() {
      [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
      token = await ERC20.connect(owner).deploy();
      reward = await Reward.connect(owner).deploy();
      stak = await Staking.connect(owner).deploy(token.address, reward.address, parseUnits("500", 18), 1800, 900);
    });


    it("1.1) Deploy", async function() {
      await token.deployed();
      await reward.deployed();
      await stak.deployed();
    });

    it("1.2) Mint", async function() {
      await reward.connect(owner).mint(stak.address, parseUnits("24000", 18));
      await token.connect(owner).mint(addr1.address, parseUnits("2500", 18));
      await token.connect(owner).mint(addr2.address, parseUnits("2000", 18));
      await token.connect(owner).mint(addr3.address, parseUnits("2500", 18));
      await token.connect(owner).mint(addr4.address, parseUnits("5000", 18));
    });

    it("1.3) Get allowance", async function() {
      await token.connect(addr1).approve(stak.address, parseUnits("5000", 18));
      await token.connect(addr2).approve(stak.address, parseUnits("2000", 18));
      await token.connect(addr3).approve(stak.address, parseUnits("2500", 18));
      await token.connect(addr4).approve(stak.address, parseUnits("5000", 18));
    });

    it("2) 1st hour: Deposit and set new parametres", async function() {
      await stak.connect(addr1).stake(parseUnits("1000", 18));
      
      await ethers.provider.send("evm_increaseTime", [1850]);
      await ethers.provider.send("evm_mine", []);

      await stak.connect(owner).setParametres(parseUnits("100", 18), 3600, 3600);
    });

    it("2) Deposit & 4 hours", async function() {

      await stak.connect(addr2).stake(parseUnits("2000", 18));

      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      await stak.connect(addr3).stake(parseUnits("2500", 18));

      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      const account = await stak.getAccount(addr1.address);
      expect(await account.accumulate).to.closeTo(parseUnits("551.515", 18),1e15);

      await stak.connect(addr4).stake(parseUnits("5000", 18));
      (await stak.connect(addr1).stake(parseUnits("1500", 18))).wait();

      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);
    });

    it("3) Claim tokens and deposit them again", async function() {
      await stak.connect(addr1).unstake(parseUnits("1000", 18));
      await stak.connect(addr1).unstake(parseUnits("1000", 18));
      await stak.connect(addr1).stake(parseUnits("2000", 18));
    });

    it("4) Check Rewards on next day", async function() {
      await ethers.provider.send("evm_increaseTime", [2 * 3650]);
      await ethers.provider.send("evm_mine", []);

      const account = await stak.getAccount(addr1.address);
      expect(await account.accumulate).to.closeTo(parseUnits("614.015", 18),1e15);
    });

    it("5) Try to Claim Rewards", async function() {
      await stak.connect(addr1).claim();

      expect(await reward.connect(addr1).balanceOf(addr1.address)).to.closeTo(parseUnits("614.015", 18),1e15);
    });

    it("6) Get View Data", async function() {
      const viewData = await stak.connect(owner).getViewData();
      expect(await viewData.tokenAddress).to.equal(token.address);
      expect(await viewData.rewardAddress).to.equal(reward.address);
      expect(await viewData.rewardAtEpoch).to.equal(parseUnits("100", 18));
      expect(await viewData.epochDuration).to.equal(3600);
      expect(await viewData.minReceiveRewardDuration).to.equal(3600);
    });
  });

  describe("Check errors", () => {
    it("User has no rights to this token", async () => {
      await token.deployed();
      await stak.deployed();
    });
  });

});
