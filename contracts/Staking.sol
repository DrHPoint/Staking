//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.1;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Staking is ERC20, Ownable {
    uint256 public tps;
    uint256 private const = 10 ** 18;
    uint256 private lastEdit;
    uint256 public perReward;
    uint256 public per;
    uint256 private total;
    address public tokenAddress;
    mapping (address => Account) public accounts;

    constructor(address _tokenAddress, uint256 _perReward, uint256 _per) ERC20("Stak", "STK") {
        perReward = _perReward;
        per = _per;
        tokenAddress = _tokenAddress;
    }

    modifier forCheck(uint256 _amount) {
        require(_amount > 0, "Not enough to deposit");
        _;
    }

    struct Account {
        uint256 tokens;
        uint256 misReward;
        uint256 avaReward;
    }

    function claimRewards(uint256 _amount) public forCheck(_amount) {
        update();
        uint256 amount = (tps * accounts[msg.sender].tokens 
        - accounts[msg.sender].misReward + accounts[msg.sender].avaReward) / const;
        require(_amount <= amount, "Not enough rewards");
        transfer(msg.sender, amount);
        accounts[msg.sender].misReward += amount * const;
    }

    function claimTokens(uint256 _amount) public forCheck(_amount) {
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
        uint256 count = (block.timestamp - lastEdit) / per;
        lastEdit += per * count;
        _mint(msg.sender, count * perReward);
        if (total > 0)
            tps = tps + (perReward * const / total) * count;
    }

    function setPer(uint256 _per) external onlyOwner {
        per = _per;
    }

    function setPerReward(uint256 _perReward) external onlyOwner {
        perReward = _perReward;
    }
}
