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
        bool isClosed;
    }

    mapping(address => NGO) public verifiedNGOs;
    mapping(uint256 => Cause) public causes;
    uint256 public causeCount;

    // Tracking user contributions: user address => cause ID => token address (address(0) for Native) => amount
    mapping(address => mapping(uint256 => mapping(address => uint256))) public userContributions;
    
    // Track cause balances: cause ID => token address => balance
    mapping(uint256 => mapping(address => uint256)) public causeBalances;

    event NGORegistered(address indexed wallet, string name);
    event CauseCreated(uint256 indexed id, string name, uint256 goalAmount, address verifiedNGO);
    event DonationReceived(address indexed donor, uint256 indexed causeId, address token, uint256 amount);
    event FundsWithdrawn(uint256 indexed causeId, address indexed admin, address token, uint256 amount);

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
            isClosed: false
        });
        emit CauseCreated(causeCount, _name, _goalAmount, _verifiedNGO);
    }

    function donateToCause(uint256 _causeId) external payable {
        require(_causeId > 0 && _causeId <= causeCount, "Invalid cause ID");
        require(!causes[_causeId].isClosed, "Cause is closed");
        require(msg.value > 0, "Donation must be greater than 0");

        userContributions[msg.sender][_causeId][address(0)] += msg.value;
        causeBalances[_causeId][address(0)] += msg.value;

        emit DonationReceived(msg.sender, _causeId, address(0), msg.value);
    }

    function donateTokenToCause(uint256 _causeId, address _token, uint256 _amount) external {
        require(_causeId > 0 && _causeId <= causeCount, "Invalid cause ID");
        require(!causes[_causeId].isClosed, "Cause is closed");
        require(_token != address(0), "Invalid token address");
        require(_amount > 0, "Donation must be greater than 0");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        userContributions[msg.sender][_causeId][_token] += _amount;
        causeBalances[_causeId][_token] += _amount;

        emit DonationReceived(msg.sender, _causeId, _token, _amount);
    }

    function withdraw(uint256 _causeId, address _token) external onlyCauseAdmin(_causeId) {
        uint256 balance = causeBalances[_causeId][_token];
        require(balance > 0, "No funds to withdraw");

        causeBalances[_causeId][_token] = 0;

        if (_token == address(0)) {
            (bool success, ) = msg.sender.call{value: balance}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(_token).safeTransfer(msg.sender, balance);
        }

        emit FundsWithdrawn(_causeId, msg.sender, _token, balance);
    }
}
