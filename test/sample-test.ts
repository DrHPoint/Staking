import { expect } from "chai";
import { Contract, ContractFactory, Signer, utils } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { network, ethers } from "hardhat";
import config from '../config';
import { hexConcat } from "@ethersproject/bytes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import console from "console";

let Staking : ContractFactory;
let stak : Contract;
let token : Contract;
let Reward : ContractFactory;
let reward : Contract;
let USDTWallet: SignerWithAddress;
let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let addr3: SignerWithAddress;
let addr4: SignerWithAddress;
let initBlockTimestamp;
let endBlockTimestamp;

describe("Staking", function () {

  beforeEach(async () => {

    // await network.provider.request({
    //   method: "hardhat_reset",
    //   params: [
    //       {
    //           forking: {
    //               jsonRpcUrl: process.env.ALCHEMY_API_HTTP,
    //               blockNumber: 8000000,
    //           },
    //       },
    //   ],
    // });
    
    
    Reward = await ethers.getContractFactory("Token");
    Staking = await ethers.getContractFactory("Staking");
    token = await ethers.getContractAt("ERC20", config.mainnet.USDT_ADDRESS);

  });

  describe("Staking with test frames", () => {

    it("0) Deploy contracts", async () => {
      [owner, addr1, addr2] = await ethers.getSigners();
      
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [config.mainnet.USDT_WALLET_ADDRESS],
      });
      USDTWallet = await ethers.getSigner(config.mainnet.USDT_WALLET_ADDRESS as string);
      
      reward = await Reward.connect(owner).deploy();
      stak = await Staking.connect(owner).deploy(token.address, reward.address, parseUnits("1000", 18), 2592000, 86400, 3600);
    });
    
    it("1) Mint usdt and reward tokens, get allowance", async () => {
      await reward.connect(owner).mint(stak.address, parseUnits("30000", 18));
      await token.connect(USDTWallet).transfer(addr1.address, parseUnits("1000", 6));
      await token.connect(USDTWallet).transfer(addr2.address, parseUnits("3000", 6));

      await token.connect(addr1).approve(stak.address, parseUnits("1000", 6));
      await token.connect(addr2).approve(stak.address, parseUnits("3000", 6));
    });
    
    it("2) Stake with first user and skip 10 days & 30 minutes (+ check balances after stake)", async () => {
      let user1_usdt_balance_before = await token.balanceOf(addr1.address);
      
      await stak.connect(addr1).stake(parseUnits("1000", 6));

      let user1_usdt_balance_after = await token.balanceOf(addr1.address);
      expect(user1_usdt_balance_before.sub(user1_usdt_balance_after)).to.be.equal(parseUnits("1000", 6));
      
      await ethers.provider.send("evm_increaseTime", [865800]);
      await ethers.provider.send("evm_mine", []);

      let user1_reward_1_month = (await stak.getAccount(addr1.address)).accumulate;
      expect(user1_reward_1_month).to.be.closeTo(parseUnits("10000", 18), 10);
    });
    
    it("3) Stake with second user and skip 3 months (+ check balances after stake)", async () => {
      let user2_usdt_balance_before = await token.balanceOf(addr2.address);
      
      await stak.connect(addr2).stake(parseUnits("3000", 6));

      let user2_usdt_balance_after = await token.balanceOf(addr2.address);
      expect(user2_usdt_balance_before.sub(user2_usdt_balance_after)).to.be.equal(parseUnits("3000", 6));
      
      await ethers.provider.send("evm_increaseTime", [7776000]);
      await ethers.provider.send("evm_mine", []);      
    });

    it("4) Check accumulate rewards", async () => {
      let user1_reward_3_months = (await stak.getAccount(addr1.address)).accumulate;
      let user2_reward_2_months = (await stak.getAccount(addr2.address)).accumulate;

      expect(user1_reward_3_months).to.be.closeTo(parseUnits("15000", 18), 10);
      expect(user1_reward_3_months).to.be.equal(user2_reward_2_months);
    });
    
    it("5) Unstake and check addresses", async () => {
      let user1_usdt_balance_before = await token.balanceOf(addr1.address);
      let user2_usdt_balance_before = await token.balanceOf(addr2.address);

      expect(user1_usdt_balance_before).to.be.equal(0);
      expect(user2_usdt_balance_before).to.be.equal(0);

      await stak.connect(addr1).unstake(parseUnits("1000", 6));
      await stak.connect(addr2).unstake(parseUnits("3000", 6));

      let user1_usdt_balance_after = await token.balanceOf(addr1.address);
      let user2_usdt_balance_after = await token.balanceOf(addr2.address);

      expect(user1_usdt_balance_after.sub(user1_usdt_balance_before)).to.be.equal(parseUnits("1000", 6));
      expect(user2_usdt_balance_after.sub(user2_usdt_balance_before)).to.be.equal(parseUnits("3000", 6));
    });
    
    it("6) Claim and check balances", async () => {
      let user1_ttt_balance_before = await reward.balanceOf(addr1.address);
      let user2_ttt_balance_before = await reward.balanceOf(addr2.address);

      expect(user1_ttt_balance_before).to.be.equal(0);
      expect(user2_ttt_balance_before).to.be.equal(0);

      await stak.connect(addr1).claim();
      await stak.connect(addr2).claim();

      let user1_ttt_balance_after = await reward.balanceOf(addr1.address);
      let user2_ttt_balance_after = await reward.balanceOf(addr2.address);

      expect(user1_ttt_balance_after.sub(user1_ttt_balance_before)).to.be.closeTo(parseUnits("15000", 18), 10);
      expect(user2_ttt_balance_after.sub(user2_ttt_balance_before)).to.be.closeTo(parseUnits("15000", 18), 10);
    });

    
  });

  describe("Staking with short frames", () => {

    it("0) Deploy contracts", async function() {
      [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
      
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [config.mainnet.USDT_WALLET_ADDRESS],
      });
      USDTWallet = await ethers.getSigner(config.mainnet.USDT_WALLET_ADDRESS as string);
      
      reward = await Reward.connect(owner).deploy();
      stak = await Staking.connect(owner).deploy(token.address, reward.address, parseUnits("500", 18), 28800, 1800, 900);
    });
    
    
    it("1.1) Check timestamp", async function() {
      initBlockTimestamp = ((await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp);
      endBlockTimestamp = await stak.stakingEndTimestamp();
      expect(endBlockTimestamp).to.equal(initBlockTimestamp + 28800);
    });

    it("1.2) Mint", async function() {
      await reward.connect(owner).mint(stak.address, parseUnits("24000", 18));
      await token.connect(USDTWallet).transfer(addr1.address, parseUnits("25", 6));
      await token.connect(USDTWallet).transfer(addr2.address, parseUnits("20", 6));
      await token.connect(USDTWallet).transfer(addr3.address, parseUnits("25", 6));
      await token.connect(USDTWallet).transfer(addr4.address, parseUnits("50", 6));
    });

    it("1.3) Get allowance", async function() {
      await token.connect(addr1).approve(stak.address, parseUnits("50", 6));
      await token.connect(addr2).approve(stak.address, parseUnits("20", 6));
      await token.connect(addr3).approve(stak.address, parseUnits("25", 6));
      await token.connect(addr4).approve(stak.address, parseUnits("50", 6));
    });

    it("2) 1st hour: Deposit and set new parametres", async function() {
      await stak.connect(addr1).stake(parseUnits("10", 6));
      
      await ethers.provider.send("evm_increaseTime", [1850]);
      await ethers.provider.send("evm_mine", []);

      await stak.connect(owner).setParametres(parseUnits("100", 18), endBlockTimestamp, 3600, 3600); 
    });

    it("3) Deposit & 4 hours", async function() {

      await stak.connect(addr2).stake(parseUnits("20", 6));

      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      await stak.connect(addr3).stake(parseUnits("25", 6));

      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);

      const account = await stak.getAccount(addr1.address);
      expect(await account.accumulate).to.closeTo(parseUnits("551.515", 18),1e15);

      await stak.connect(addr4).stake(parseUnits("50", 6));
      (await stak.connect(addr1).stake(parseUnits("15", 6))).wait();

      await ethers.provider.send("evm_increaseTime", [3650]);
      await ethers.provider.send("evm_mine", []);
    });

    it("5) Claim tokens and deposit them again", async function() {
      await stak.connect(addr1).unstake(parseUnits("10", 6));
      await stak.connect(addr1).unstake(parseUnits("10", 6));
      await stak.connect(addr1).stake(parseUnits("20", 6));
    });

    it("6) Check Rewards on next day", async function() {
      await ethers.provider.send("evm_increaseTime", [2 * 3650]);
      await ethers.provider.send("evm_mine", []);

      const account = await stak.getAccount(addr1.address);
      expect(await account.accumulate).to.closeTo(parseUnits("614.015", 18),1e15);
    });

    it("7) Try to Claim Rewards", async function() {
      await stak.connect(addr1).claim();

      expect(await reward.connect(addr1).balanceOf(addr1.address)).to.closeTo(parseUnits("614.015", 18),1e15);
    });

    it("8) Get View Data", async function() {
      const viewData = await stak.connect(owner).getViewData();
      expect(await viewData.tokenAddress).to.equal(token.address);
      expect(await viewData.rewardAddress).to.equal(reward.address);
      expect(await viewData.rewardAtEpoch).to.equal(parseUnits("100", 18));
      expect(await viewData.stakingEndTimestamp).to.equal(endBlockTimestamp);
      expect(await viewData.epochDuration).to.equal(3600);
      expect(await viewData.minReceiveRewardDuration).to.equal(3600);
    });
  });

  describe("Check errors", () => {
    it("0) Deploy contracts", async () => {
      [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
      
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [config.mainnet.USDT_WALLET_ADDRESS],
      });
      USDTWallet = await ethers.getSigner(config.mainnet.USDT_WALLET_ADDRESS as string);
      
      reward = await Reward.connect(owner).deploy();

      await expect(Staking.connect(owner).deploy(token.address, reward.address, 
        parseUnits("500", 18), 1800, 28800, 900)).to.be.revertedWith("Incorrect parametres");
      await expect(Staking.connect(owner).deploy(token.address, reward.address, 
        parseUnits("500", 18), 28800, 900, 1800)).to.be.revertedWith("Incorrect parametres");
      
      await expect(Staking.connect(owner).deploy(token.address, reward.address, 
        parseUnits("500", 18), 28800, 1801, 900)).to.be.revertedWith("Incorrect parametres");
      await expect(Staking.connect(owner).deploy(token.address, reward.address, 
        parseUnits("500", 18), 28800, 1800, 901)).to.be.revertedWith("Incorrect parametres");
      
      stak = await Staking.connect(owner).deploy(token.address, reward.address, parseUnits("500", 18), 28800, 1800, 900);
    });

    it("1) Mint, approve tokens and stake", async function() {
      await reward.connect(owner).mint(stak.address, parseUnits("30000", 18));
      await token.connect(USDTWallet).transfer(addr1.address, parseUnits("1000", 6));
      await token.connect(addr1).approve(stak.address, parseUnits("1000", 6));

      await expect(stak.connect(addr1).stake(0)).to.be.revertedWith("Not enough to deposite");
      stak.connect(addr1).stake(parseUnits("1000", 6));
    });

    it("2) Unstake tokens", async function() {
      await expect(stak.connect(addr1).unstake(0)).to.be.revertedWith("Not enough to unstake");
      await expect(stak.connect(addr1).unstake(parseUnits("2000", 6))).to.be.revertedWith("Too much to unstake");
      stak.connect(addr1).unstake(parseUnits("1000", 6));
    });
  });

});
