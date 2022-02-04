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
      stak = await Staking.connect(owner).deploy(token.address, reward.address, parseUnits("500", 18), 3600, 3600);
    });


    it("1.1) Deploy", async function() {
      await token.deployed();
      await reward.deployed();
      await stak.deployed();
    });

    it("1.2) Mint", async function() {
      const mint = await reward.connect(owner).mint(stak.address, parseUnits("24000", 18));
      await mint.wait();
      const mint1 = await token.connect(owner).mint(addr1.address, parseUnits("2500", 18));
      const mint2 = await token.connect(owner).mint(addr2.address, parseUnits("2000", 18));
      const mint3 = await token.connect(owner).mint(addr3.address, parseUnits("2500", 18));
      const mint4 = await token.connect(owner).mint(addr4.address, parseUnits("5000", 18));
      await mint1.wait();
      await mint2.wait();
      await mint3.wait();
      await mint4.wait();
    });

    it("1.3) Get allowance", async function() {
      const allowance1 = await token.connect(addr1).approve(stak.address, parseUnits("5000", 18));
      const allowance2 = await token.connect(addr2).approve(stak.address, parseUnits("2000", 18));
      const allowance3 = await token.connect(addr3).approve(stak.address, parseUnits("2500", 18));
      const allowance4 = await token.connect(addr4).approve(stak.address, parseUnits("5000", 18));
      await allowance1.wait();
      await allowance2.wait();
      await allowance3.wait();
      await allowance4.wait();
    });

    it("2) 1st hour: Deposit and set new parametres", async function() {
      const deposit1 = await stak.connect(addr1).stake(parseUnits("1000", 18));
      await deposit1.wait();
      
      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      const newParametres = await stak.connect(owner).setParametres(parseUnits("100", 18), 3600, 3600);
      await newParametres.wait();
    });

    it("2) Deposit & 4 hours", async function() {

      const deposit2 = await stak.connect(addr2).stake(parseUnits("2000", 18));
      await deposit2.wait();
      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      const deposit3 = await stak.connect(addr3).stake(parseUnits("2500", 18));
      await deposit3.wait();
      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      const deposit4 = await stak.connect(addr4).stake(parseUnits("5000", 18));
      await deposit4.wait();
      const deposit5 = await stak.connect(addr1).stake(parseUnits("1500", 18));
      await deposit5.wait();
      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);
    });

    it("3) Claim tokens and deposit them again", async function() {
      const claimTokens1 = await stak.connect(addr1).unstake(parseUnits("1000", 18));
      await claimTokens1.wait();
      const claimTokens2 = await stak.connect(addr1).unstake(parseUnits("1000", 18));
      await claimTokens2.wait();
      const deposit11 = await stak.connect(addr1).stake(parseUnits("2000", 18));
      await deposit11.wait();
    });

    it("4) Check Rewards on next day", async function() {
      await ethers.provider.send("evm_increaseTime", [2 * 3650]);
      await ethers.provider.send("evm_mine", []);
      expect(await stak.availableReward(addr1.address)).to.equal(parseUnits("614", 18));
    });

    it("4) Try to Claim Rewards", async function() {
      const claimRewards1 = await stak.connect(addr1).claim();
      await claimRewards1.wait();
      expect(await reward.connect(addr1).balanceOf(addr1.address)).to.equal(parseUnits("614", 18));
    });
  });

  describe("Check errors", () => {
    it("User has no rights to this token", async () => {
      await token.deployed();
      await stak.deployed();
    });
  });

});
