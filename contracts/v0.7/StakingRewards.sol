// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./common/PausableWithAdmin.sol";

interface IGUTUtils {
    function getMemberInfo(address _user)
        external
        view
        returns (
            uint256,
            uint256,
            uint256
        );
}

contract StakingRewards is ReentrancyGuard, PausableWithAdmin {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    IERC20 public rewardsToken;
    IERC20 public stakingToken;
    IGUTUtils public gutUtils;
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public rewardsDuration = 7 days;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    bool public boosted;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    uint256 private constant DEFAULT_BOOSTED_RATE = 100;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _admin,
        address _rewardsToken,
        address _stakingToken,
        address _gutUtils,
        bool _boosted
    ) {
        rewardsToken = IERC20(_rewardsToken);
        stakingToken = IERC20(_stakingToken);
        gutUtils = IGUTUtils(_gutUtils);
        boosted = _boosted;
        _setupAdmin(_admin);
    }

    /* ========== VIEWS ========== */

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable().sub(lastUpdateTime).mul(rewardRate).mul(1e18).div(_totalSupply)
            );
    }

    function earned(address account) public view returns (uint256) {
        uint256 boostedBalance = _balances[account].mul(getBoostRate(account)).div(DEFAULT_BOOSTED_RATE);
        return
            boostedBalance.mul(rewardPerToken().sub(userRewardPerTokenPaid[account])).div(1e18).add(rewards[account]);
    }

    function getRewardForDuration() external view returns (uint256) {
        return rewardRate.mul(rewardsDuration);
    }

    function getBoostRate(address account) public view returns (uint256) {
        if (boosted == false) {
            return DEFAULT_BOOSTED_RATE;
        }
        (, , uint256 boostRate) = gutUtils.getMemberInfo(account);
        if (boostRate < DEFAULT_BOOSTED_RATE) {
            boostRate = DEFAULT_BOOSTED_RATE;
        }
        return boostRate;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function stake(uint256 amount, bool claimRewardToken) external nonReentrant whenNotPaused updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);

        if (claimRewardToken) {
            _getReward();
        }
    }

    function withdraw(uint256 amount, bool claimRewardToken) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);

        if (claimRewardToken) {
            _getReward();
        }
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        _getReward();
    }

    function exit() external {
        withdraw(_balances[msg.sender], false);
        getReward();
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    function notifyRewardAmount(uint256 reward) external onlyAdmin updateReward(address(0)) {
        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(rewardsDuration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(rewardsDuration);
        }

        // Ensure the provided reward amount is not more than the balance in the contract.
        // This keeps the reward rate in the right range, preventing overflows due to
        // very high values of rewardRate in the earned and rewardsPerToken functions;
        // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
        uint256 balance = rewardsToken.balanceOf(address(this));
        require(rewardRate <= balance.div(rewardsDuration), "Provided reward too high");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp.add(rewardsDuration);
        emit RewardAdded(reward);
    }

    // End rewards emission earlier
    function updatePeriodFinish(uint256 timestamp) external onlyAdmin updateReward(address(0)) {
        periodFinish = timestamp;
    }

    // Set boosted
    function updateBoosted(bool flag) external onlyAdmin {
        boosted = flag;
    }

    // Added to support recovering LP Rewards from other systems such as BAL to be distributed to holders
    function recoverERC20(address tokenAddress, uint256 tokenAmount) external onlyAdmin {
        require(tokenAddress != address(stakingToken), "Cannot withdraw the staking token");
        IERC20(tokenAddress).safeTransfer(msg.sender, tokenAmount);
        emit Recovered(tokenAddress, tokenAmount);
    }

    function setRewardsDuration(uint256 _rewardsDuration) external onlyAdmin {
        require(
            block.timestamp > periodFinish,
            "Previous rewards period must be complete before changing the duration for the new period"
        );
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    function setGUTUtils(address _gutUtils) external onlyAdmin {
        gutUtils = IGUTUtils(_gutUtils);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _getReward() private {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /* ========== MODIFIERS ========== */

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    /* ========== EVENTS ========== */

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);
    event Recovered(address token, uint256 amount);
}
