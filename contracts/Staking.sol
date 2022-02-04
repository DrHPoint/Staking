//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.1;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Staking is Ownable {
    uint256 public tps;
    uint256 private precision = 10 ** 18;
    uint256 private timestamp;
    uint256 public rewardAtEpoch;
    uint256 public epoch;
    uint256 public duration; //the minimum period of time for which the reward is received
    uint256 private total;
    address public tokenAddress;
    address public rewardAddress;
    mapping (address => Account) public accounts;

    constructor(address _tokenAddress, address _rewardAddress, uint256 _rewardAtEpoch, uint256 _epoch, uint256 _duration) {
        rewardAtEpoch = _rewardAtEpoch;
        epoch = _epoch;
        tokenAddress = _tokenAddress;
        rewardAddress = _rewardAddress;
        duration = _duration;
        timestamp = block.timestamp;
    }

    struct Account {
        uint256 tokens;
        uint256 missedReward;
        uint256 savedReward;
    }

    function claimRewards() public {
        update();
        uint256 amount = (tps * accounts[msg.sender].tokens 
        - accounts[msg.sender].missedReward + accounts[msg.sender].savedReward) / precision;
        ERC20(rewardAddress).transfer(msg.sender, amount);
        accounts[msg.sender].missedReward += amount * precision;
    }

    function claimTokens(uint256 _amount) public {
        require(_amount > 0, "Not enough to deposit");
        require(accounts[msg.sender].tokens >= _amount, "Too much amount");
        require(ERC20(tokenAddress).transfer(msg.sender, _amount));
        update();
        accounts[msg.sender].savedReward += tps * accounts[msg.sender].tokens - accounts[msg.sender].missedReward;
        accounts[msg.sender].tokens -= _amount;
        accounts[msg.sender].missedReward = tps * accounts[msg.sender].tokens;
        total -= _amount;
    }

    function deposit (uint256 _amount) external {
        require(_amount > 0, "Not enough to deposite");
        require(ERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount));
        update();
        accounts[msg.sender].tokens += _amount;
        accounts[msg.sender].missedReward += _amount * tps;
        if (accounts[msg.sender].savedReward > 0)
        {
            accounts[msg.sender].missedReward -= accounts[msg.sender].savedReward;
            accounts[msg.sender].savedReward = 0;
        }
        total += _amount;
    }

    function update() internal {
        uint256 count = (block.timestamp - timestamp) / duration;
        timestamp += duration * count;
        if (total > 0)
            tps = tps + (rewardAtEpoch * duration * precision / (total * epoch)) * count;
    }

    function setParametres(uint256 _reward, uint256 _epoch, uint256 _duration) external onlyOwner{
        update();
        epoch = _epoch;
        rewardAtEpoch = _reward;
        duration = _duration;
    }

    function availableReward(address _account) external view returns(uint256 amount) {
        uint256 count = (block.timestamp - timestamp) / duration;
        uint256 currentTPS = tps + (rewardAtEpoch * duration * precision / (total * epoch)) * count;
        amount = (currentTPS * accounts[_account].tokens 
        - accounts[_account].missedReward + accounts[_account].savedReward) / precision;
    }
}
