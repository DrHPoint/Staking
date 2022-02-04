//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.1;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Staking is Ownable {
    uint256 public tps;
    uint256 private precision = 10 ** 18;
    uint256 private lastEdit;
    uint256 public reward;
    uint256 public duration;
    uint256 public minDuration;
    uint256 private total;
    address public tokenAddress;
    address public rewardAddress;
    mapping (address => Account) public accounts;

    constructor(address _tokenAddress, address _rewardAddress, uint256 _reward, uint256 _duration, uint256 _minDuration) {
        reward = _reward;
        duration = _duration;
        tokenAddress = _tokenAddress;
        rewardAddress = _rewardAddress;
        minDuration = _minDuration;
        lastEdit = block.timestamp;
    }

    struct Account {
        uint256 tokens;
        uint256 misReward;
        uint256 avaReward;
    }

    function claimRewards() public {
        uint256 amount = availableReward();
        ERC20(rewardAddress).transfer(msg.sender, amount);
        accounts[msg.sender].misReward += amount * precision;
    }

    function claimTokens(uint256 _amount) public {
        require(_amount > 0, "Not enough to deposit");
        require(accounts[msg.sender].tokens >= _amount, "Too much amount");
        require(ERC20(tokenAddress).transfer(msg.sender, _amount));
        update();
        accounts[msg.sender].avaReward += tps * _amount - accounts[msg.sender].misReward;
        accounts[msg.sender].misReward = 0;
        accounts[msg.sender].tokens -= _amount;
        total -= _amount;
    }

    function deposit (uint256 _amount) external {
        require(_amount > 0, "Not enough to deposite");
        require(ERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount));
        update();
        accounts[msg.sender].tokens += _amount;
        accounts[msg.sender].misReward += _amount * tps;
        total += _amount;
    }

    function update() internal {
        uint256 count = (block.timestamp - lastEdit) / minDuration;
        lastEdit += minDuration * count;
        if (total > 0)
            tps = tps + (reward * minDuration * precision / (total * duration)) * count;
    }

    function setParametres(uint256 _reward, uint256 _duration, uint256 _minDuration) external onlyOwner{
        update();
        duration = _duration;
        reward = _reward;
        minDuration = _minDuration;
    }

    function availableReward() public returns(uint256 amount) {
        update();
        amount = (tps * accounts[msg.sender].tokens 
        - accounts[msg.sender].misReward + accounts[msg.sender].avaReward) / precision;
    }
}
