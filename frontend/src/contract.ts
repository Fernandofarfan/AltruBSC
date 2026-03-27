export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const USDT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const REWARD_NFT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export const CONTRACT_ABI = [
  "function registerNGO(address _wallet, string calldata _name) external",
  "function createCause(string calldata _name, uint256 _goalAmount, address _verifiedNGO) external",
  "function donateToCause(uint256 _causeId) external payable",
  "function donateTokenToCause(uint256 _causeId, address _token, uint256 _amount) external",
  "function withdraw(uint256 _causeId, address _token) external",
  "function setRewardNFT(address _rewardNFT) external",
  "function addCauseUpdate(uint256 _causeId, string memory _updateText) external",
  "function getCauseUpdates(uint256 _causeId) external view returns (string[] memory)",
  "function causeCount() external view returns (uint256)",
  "function causes(uint256) external view returns (uint256 id, string name, uint256 goalAmount, address verifiedNGO, uint256 raised, bool isClosed)",
  "function causeBalances(uint256, address) external view returns (uint256)",
  "function donors(address) external view returns (uint256 totalDonated, uint256 donationCount)",
  "function totalDonations(address) external view returns (uint256)",
  "event DonationReceived(uint256 indexed causeId, address indexed donor, address token, uint256 amount)",
  "event FundsWithdrawn(uint256 indexed causeId, address indexed admin, address token, uint256 amount)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

export const NFT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)"
];
