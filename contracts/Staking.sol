//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title A Stacking contract.
 * @author Pavel E. Hrushchev (DrHPoint).
 * @notice You can use this contract for working with stacking.
 * @dev All function calls are currently implemented without side effects.
 */
contract Staking is AccessControl {
    
    using SafeERC20 for IERC20;
    
    /**
     * @notice Shows that the user stake some tokens to contract.
     * @param user is the address of user.
     * @param amount is an amount of tokens which stakes to contract.
     */
    event Stake(address user, uint256 amount);

    /**
     * @notice Shows that the user unstake some tokens from contract.
     * @param user is the address of user.
     * @param amount is an amount of tokens which unstakes from contract.
     */
    event Unstake(address user, uint256 amount);

    /**
     * @notice Shows that the user claim some reward tokens from contract.
     * @param user is the address of user.
     * @param amount is an amount of reward tokens which claim from contract.
     */
    event Claim(address user, uint256 amount);

    /** 
    * @notice Shows that the admin set new parametres of reward on contract.
    * @param reward is an amount of reward tokens 
    that will be paid to all of user in some epoch.
    * @param epochDuration is the length of time for which the reward is distributed.
    */
    event SetParametres(uint256 reward, uint256 epochDuration);

    struct Account {
        uint256 amountStake; //the number of tokens that the user has staked
        uint256 missedTPS; //the number of reward tokens that the user missed
        uint256 accumulate; //the number of reward tokens that the user accumulated after unstake
    }

    struct ViewData{
        address tokenAddress;
        address rewardAddress;
        uint256 rewardAtEpoch;
        uint256 epochDuration;
        uint256 minReceiveRewardDuration;
    }

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public tps;
    uint256 public rewardAtEpoch;
    uint256 public epochDuration;

    address public tokenAddress;
    address public rewardAddress;

    uint256 private precision = 1e18;
    uint256 private lastTimeEditedTPS;
    uint256 private minReceiveRewardDuration; //the minimum period of time for which the reward is received
    uint256 private totalAmountStake;

    mapping(address => Account) public accounts;

    constructor(
        address _tokenAddress,
        address _rewardAddress,
        uint256 _rewardAtEpoch,
        uint256 _epochDuration,
        uint256 _minReceiveRewardDuration
    ) checkEpoch(
        _epochDuration,
        _minReceiveRewardDuration
    ) {
        require (_epochDuration >= _minReceiveRewardDuration);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        rewardAtEpoch = _rewardAtEpoch;
        epochDuration = _epochDuration;
        tokenAddress = _tokenAddress;
        rewardAddress = _rewardAddress;
        minReceiveRewardDuration = _minReceiveRewardDuration;
        lastTimeEditedTPS = block.timestamp;
    }

    modifier checkEpoch(
        uint256 _epochDuration,
        uint256 _minReceiveRewardDuration
    ) {
        require (_epochDuration >= _minReceiveRewardDuration, "Incorrect parametres");
        _;
    }

    /** 
    * @notice With this function user can stake some amount of token to contract.
    * @dev It is worth paying attention to the fact that if the tokens were unstaked before, 
    these tokens will be deducted from the parameter "missedReward". 
    * @param _amount is an amount of tokens which stakes to contract.
    */
    function stake(uint256 _amount) external {
        require(_amount > 0, "Not enough to deposite");
        IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        update();
        accounts[msg.sender].accumulate += accounts[msg.sender].amountStake * (tps - accounts[msg.sender].missedTPS);
        accounts[msg.sender].amountStake += _amount;
        accounts[msg.sender].missedTPS = tps;
        // if (accounts[msg.sender].accumulate > 0)
        // {
        //     accounts[msg.sender].missedReward -= accounts[msg.sender].accumulate;
        //     accounts[msg.sender].accumulate = 0;
        // }
        totalAmountStake += _amount;
        emit Stake(msg.sender, _amount);
    }

    /** 
    * @notice With this function user can unstake some amount of token from contract.
    * @dev It is worth paying attention to the fact that the accumulated rewards 
    are stored in the parameter "accumulate". 
    * @param _amount is an amount of tokens which stakes to contract.
    */
    function unstake(uint256 _amount) external {
        require(_amount > 0, "Not enough to unstake");
        require(
            accounts[msg.sender].amountStake >= _amount,
            "Too much to unstake"
        );
        IERC20(tokenAddress).safeTransfer(msg.sender, _amount);
        update();
        accounts[msg.sender].accumulate += accounts[msg.sender].amountStake * (tps - accounts[msg.sender].missedTPS);
        accounts[msg.sender].amountStake -= _amount;
        accounts[msg.sender].missedTPS = tps;
        totalAmountStake -= _amount;
        emit Unstake(msg.sender, _amount);
    }

    ///@notice With this function user can claim some amount of reward tokens from contract.
    function claim() external {
        update();
        Account storage account = accounts[msg.sender];
        uint256 amount = (account.amountStake * (tps - account.missedTPS) +
            account.accumulate) / precision;
        IERC20(rewardAddress).safeTransfer(msg.sender, amount);
        account.missedTPS = tps;
        emit Claim(msg.sender, amount);
    }

    /**
     * @notice With this function admin can set new parameters of rewarding users to contract.
     * @dev This function can only be called by users with the ADMIN_ROLE role.
     * @param _reward is an amount of reward tokens that will be paid to all of user in new epoch.
     * @param _epochDuration is the length of time for which the reward is distributed.
     * @param _minReceiveRewardDuration the minimum period of time for which the reward is received.
     */
    function setParametres(
        uint256 _reward,
        uint256 _epochDuration,
        uint256 _minReceiveRewardDuration
    ) external onlyRole(ADMIN_ROLE) checkEpoch(
        _epochDuration,
        _minReceiveRewardDuration
    ) {
        update();
        epochDuration = _epochDuration;
        rewardAtEpoch = _reward;
        minReceiveRewardDuration = _minReceiveRewardDuration;
        emit SetParametres(_reward, _epochDuration);
    }

    /** 
    * @notice With this function user can see information 
    about contract, including tokens addresses,
    amount of reward tokens, that will be paid to all of user in some epoch,
    duration of epoch and the minimum period of time for which the reward is received.
    * @return viewData - structure with information about contract.
    */
    function getViewData()
        external
        view
        onlyRole(ADMIN_ROLE)
        returns (ViewData memory viewData)
    {
        viewData = (ViewData(
            tokenAddress,
            rewardAddress,
            rewardAtEpoch,
            epochDuration,
            minReceiveRewardDuration
        ));
    }

    /** 
    * @notice With this function user can see information 
    of user with certain address, including amount of staked tokens,
    missed rewards and how many reward tokens can be claimed.
    * @param _account is the address of some user.
    * @return account - structure with information about user.
    */
    function getAccount(address _account)
        external
        view
        returns (Account memory account)
    {
        account = (Account(
            accounts[_account].amountStake,
            accounts[_account].missedTPS * accounts[_account].amountStake,
            availableReward(_account)
        ));
    }

    /**
     * @notice This function update value of tps.
     * @dev This function is public in case of emergency.
     */
    function update() public {
        uint256 amountOfDuration = (block.timestamp - lastTimeEditedTPS) /
            minReceiveRewardDuration;
        lastTimeEditedTPS += minReceiveRewardDuration * amountOfDuration;
        if (totalAmountStake > 0)
            tps =
                tps +
                ((rewardAtEpoch * minReceiveRewardDuration * precision) /
                    (totalAmountStake * epochDuration)) *
                amountOfDuration;
    }

    /** 
    * @notice With this function contract can previously see how many reward tokens 
    can be claimed of user with certain address.
    * @param _account is the address of some user.
    * @return amount - An amount of reward tokens that can be claimed.
    */
    function availableReward(address _account)
        internal
        view
        returns (uint256 amount)
    {
        uint256 amountOfDuration = (block.timestamp - lastTimeEditedTPS) /
            minReceiveRewardDuration;
        uint256 currentTPS = tps +
            ((rewardAtEpoch * minReceiveRewardDuration * precision) /
                (totalAmountStake * epochDuration)) *
            amountOfDuration;
        amount =
            ((currentTPS - accounts[_account].missedTPS) *
                accounts[_account].amountStake +
                accounts[_account].accumulate) /
            precision;
    }
}
