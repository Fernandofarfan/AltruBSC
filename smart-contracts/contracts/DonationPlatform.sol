// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract DonationPlatform {
    using SafeERC20 for IERC20;

    address public owner;

    struct NGO {
        bool isVerified;
        string name;
        address walletAddress;
    }

    struct Cause {
        uint256 id;
        string name;
        uint256 goalAmount;
        address verifiedNGO;
        uint256 raised;
        bool isClosed;
    }

    struct Donor {
        uint256 totalDonated;
        uint256 donationCount;
    }

    mapping(address => NGO) public verifiedNGOs;
    mapping(uint256 => Cause) public causes;
    uint256 public causeCount;

    mapping(address => Donor) public donors;
    mapping(address => uint256) public totalDonations; // user => total BNB (equivalent)
    address public rewardNFT;
    uint256 public constant REWARD_THRESHOLD = 0.5 ether;

    // Tracking user contributions: user address => cause ID => token address (address(0) for Native) => amount
    mapping(address => mapping(uint256 => mapping(address => uint256))) public userContributions;
    
    // Track cause balances: cause ID => token address => balance
    mapping(uint256 => mapping(address => uint256)) public causeBalances;

    // Proof of Impact: causeId => array of update strings (IPFS/URIs)
    mapping(uint256 => string[]) public causeUpdates;

    event NGORegistered(address indexed wallet, string name);
    event CauseCreated(uint256 indexed id, string name, uint256 goalAmount, address verifiedNGO);
    event DonationReceived(uint256 indexed causeId, address indexed donor, address token, uint256 amount);
    event FundsWithdrawn(uint256 indexed causeId, address indexed admin, address token, uint256 amount);
    event RewardMinted(address indexed donor, uint256 tokenId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner callable");
        _;
    }

    modifier onlyVerifiedNGO(address _ngo) {
        require(verifiedNGOs[_ngo].isVerified, "NGO not verified");
        _;
    }

    modifier onlyCauseAdmin(uint256 _causeId) {
        require(causes[_causeId].verifiedNGO == msg.sender, "Only cause admin callable");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerNGO(address _wallet, string calldata _name) external onlyOwner {
        require(!verifiedNGOs[_wallet].isVerified, "NGO already verified");
        verifiedNGOs[_wallet] = NGO({
            isVerified: true,
            name: _name,
            walletAddress: _wallet
        });
        emit NGORegistered(_wallet, _name);
    }

    function createCause(string calldata _name, uint256 _goalAmount, address _verifiedNGO) external onlyOwner onlyVerifiedNGO(_verifiedNGO) {
        causeCount++;
        causes[causeCount] = Cause({
            id: causeCount,
            name: _name,
            goalAmount: _goalAmount,
            verifiedNGO: _verifiedNGO,
            isClosed: false,
            raised: 0 // Initialize new field
        });
        emit CauseCreated(causeCount, _name, _goalAmount, _verifiedNGO);
    }

    function donateToCause(uint256 _causeId) external payable {
        require(_causeId > 0 && _causeId <= causeCount, "Invalid cause"); // Modified message
        require(!causes[_causeId].isClosed, "Cause closed"); // Modified message
        require(msg.value > 0, "Donation must be greater than 0");

        causes[_causeId].raised += msg.value; // Update raised amount
        userContributions[msg.sender][_causeId][address(0)] += msg.value;
        causeBalances[_causeId][address(0)] += msg.value;
        
        totalDonations[msg.sender] += msg.value; // Track total donations
        donors[msg.sender].totalDonated += msg.value;
        donors[msg.sender].donationCount += 1;
        _checkAndMintReward(msg.sender); // Check for reward

        emit DonationReceived(_causeId, msg.sender, address(0), msg.value); // Modified event emission
    }

    function donateTokenToCause(uint256 _causeId, address _token, uint256 _amount) external {
        require(_causeId > 0 && _causeId <= causeCount, "Invalid cause"); // Modified message
        require(!causes[_causeId].isClosed, "Cause closed"); // Modified message
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Donation must be greater than 0");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount); // Changed to transferFrom as per instruction

        causes[_causeId].raised += _amount; // Update raised amount (Simplified for demo: 1 token = 1 unit)
        userContributions[msg.sender][_causeId][_token] += _amount;
        causeBalances[_causeId][_token] += _amount;

        // Mock tracking for tokens (assuming USDT/stablecoin)
        totalDonations[msg.sender] += _amount; // Track total donations
        donors[msg.sender].totalDonated += _amount;
        donors[msg.sender].donationCount += 1;
        _checkAndMintReward(msg.sender); // Check for reward

        emit DonationReceived(_causeId, msg.sender, _token, _amount); // Modified event emission
    }

    function addCauseUpdate(uint256 _causeId, string memory _updateText) external onlyCauseAdmin(_causeId) {
        causeUpdates[_causeId].push(_updateText);
    }

    function getCauseUpdates(uint256 _causeId) external view returns (string[] memory) {
        return causeUpdates[_causeId];
    }

    function setRewardNFT(address _rewardNFT) external onlyOwner {
        rewardNFT = _rewardNFT;
    }

    function _checkAndMintReward(address _donor) internal {
        if (rewardNFT != address(0) && totalDonations[_donor] >= REWARD_THRESHOLD) {
            // Check if already has one (simplification for hackathon)
            try IAltruNFT(rewardNFT).mintReward(_donor, "ipfs://altru-impact-badge") returns (uint256 tokenId) {
                emit RewardMinted(_donor, tokenId);
            } catch {}
        }
    }

    function withdraw(uint256 _causeId, address _token) external onlyCauseAdmin(_causeId) {
        uint256 amount = causeBalances[_causeId][_token];
        require(amount > 0, "No balance to withdraw");
        
        causeBalances[_causeId][_token] = 0;
        
        if (_token == address(0)) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Withdrawal failed");
        } else {
            IERC20(_token).safeTransfer(msg.sender, amount);
        }
        
        emit FundsWithdrawn(_causeId, msg.sender, _token, amount);
    }
}

interface IAltruNFT {
    function mintReward(address to, string memory uri) external returns (uint256);
}
