//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**  
* @title A Stacking contract.
* @author Pavel E. Hrushchev (DrHPoint).
* @notice You can use this contract for working with stacking.
* @dev All function calls are currently implemented without side effects. 
*/
contract Staking is AccessControl {
    
    /** 
    * @notice Shows that the user stake some tokens to contract.
    * @param _user is the address of user.
    * @param _amount is an amount of tokens which stakes to contract.
    */
    event Stake(address _user, uint256 _amount);
    
    /** 
    * @notice Shows that the user unstake some tokens from contract.
    * @param _user is the address of user.
    * @param _amount is an amount of tokens which unstakes from contract.
    */
    event Unstake(address _user, uint256 _amount);
    
    /** 
    * @notice Shows that the user claim some reward tokens from contract.
    * @param _user is the address of user.
    * @param _amount is an amount of reward tokens which claim from contract.
    */
    event Claim(address _user, uint256 _amount);

    /** 
    * @notice Shows that the admin set new parametres of reward on contract.
    * @param _reward is an amount of reward tokens 
    that will be paid to all of user in some epoch.
    * @param _epoch is the length of time for which the reward is distributed.
    */
    event SetParametres(uint256 _reward, uint256 _epoch);
    
    struct Account {
        uint256 amountStake; //the number of tokens that the user has staked 
        uint256 missedReward; //the number of reward tokens that the user missed
        uint256 accumulate; //the number of reward tokens that the user accumulated after unstake
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    uint256 public tps;
    uint256 public rewardAtEpoch; 
    uint256 public epoch;
    
    address public tokenAddress;
    address public rewardAddress;
    
    uint256 private precision = 1e18;
    uint256 private timestamp;
    uint256 private duration; //the minimum period of time for which the reward is received
    uint256 private total;

    mapping (address => Account) public accounts;

    constructor(address _tokenAddress, address _rewardAddress, uint256 _rewardAtEpoch, uint256 _epoch, uint256 _duration) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        rewardAtEpoch = _rewardAtEpoch;
        epoch = _epoch;
        tokenAddress = _tokenAddress;
        rewardAddress = _rewardAddress;
        duration = _duration;
        timestamp = block.timestamp;
    }

    /** 
    * @notice With this function user can stake some amount of token to contract.
    * @dev It is worth paying attention to the fact that if the tokens were unstaked before, 
    these tokens will be deducted from the parameter "missedReward". 
    * @param _amount is an amount of tokens which stakes to contract.
    */
    function stake(uint256 _amount) external {
        require(_amount > 0, "Not enough to deposite");
        require(ERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount));
        update();
        accounts[msg.sender].amountStake += _amount;
        accounts[msg.sender].missedReward += _amount * tps;
        if (accounts[msg.sender].accumulate > 0)
        {
            accounts[msg.sender].missedReward -= accounts[msg.sender].accumulate;
            accounts[msg.sender].accumulate = 0;
        }
        total += _amount;
    }

    /** 
    * @notice With this function user can unstake some amount of token from contract.
    * @dev It is worth paying attention to the fact that the accumulated rewards 
    are stored in the parameter "accumulate". 
    * @param _amount is an amount of tokens which stakes to contract.
    */
    function unstake(uint256 _amount) external {
        require(_amount > 0, "Not enough to unstake");
        require(accounts[msg.sender].amountStake >= _amount, "Too much to unstake");
        require(ERC20(tokenAddress).transfer(msg.sender, _amount));
        update();
        accounts[msg.sender].accumulate += tps * accounts[msg.sender].amountStake - accounts[msg.sender].missedReward;
        accounts[msg.sender].amountStake -= _amount;
        accounts[msg.sender].missedReward = tps * accounts[msg.sender].amountStake;
        total -= _amount;
    }

    ///@notice With this function user can claim some amount of reward tokens from contract.
    function claim() external {
        update();
        uint256 amount = (tps * accounts[msg.sender].amountStake 
        - accounts[msg.sender].missedReward + accounts[msg.sender].accumulate) / precision;
        ERC20(rewardAddress).transfer(msg.sender, amount);
        accounts[msg.sender].missedReward += amount * precision;
    }

    /** 
    * @notice With this function user can previously see how many reward tokens 
    can be claimed of user with certain address.
    * @param _account is the address of some user.
    * @return amount - An amount of reward tokens that can be claimed.
    */
    function availableReward(address _account) external view returns(uint256 amount) {
        uint256 amountOfDuration = (block.timestamp - timestamp) / duration;
        uint256 currentTPS = tps + (rewardAtEpoch * duration * precision / (total * epoch)) * amountOfDuration;
        amount = (currentTPS * accounts[_account].amountStake 
        - accounts[_account].missedReward + accounts[_account].accumulate) / precision;
    }

    /** 
    * @notice With this function admin can set new parameters of rewarding users to contract.
    * @dev This function can only be called by users with the ADMIN_ROLE role. 
    * @param _reward is an amount of reward tokens that will be paid to all of user in new epoch.
    * @param _epoch is the length of time for which the reward is distributed.
    * @param _duration the minimum period of time for which the reward is received.
    */
    function setParametres(uint256 _reward, uint256 _epoch, uint256 _duration) external onlyRole(ADMIN_ROLE) {
        update();
        epoch = _epoch;
        rewardAtEpoch = _reward;
        duration = _duration;
    }

    /** 
    * @notice This function update value of tps.
    * @dev This function is public in case of emergency.
    */
    function update() public {
        uint256 amountOfDuration = (block.timestamp - timestamp) / duration;
        timestamp += duration * amountOfDuration;
        if (total > 0)
            tps = tps + (rewardAtEpoch * duration * precision / (total * epoch)) * amountOfDuration;
    }
}
