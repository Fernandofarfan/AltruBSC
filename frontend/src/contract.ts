export const CONTRACT_ADDRESS = "0x68B1D87F95878fE05B998F19b66F4baba5De1aed";
export const USDT_ADDRESS = "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c";
export const REWARD_NFT_ADDRESS = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";

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
  "function causes(uint256) external view returns (uint256 id, string name, uint256 goalAmount, address verifiedNGO, bool isClosed)",
  "function causeBalances(uint256, address) external view returns (uint256)",
  "event DonationReceived(uint256 indexed causeId, address indexed donor, address token, uint256 amount)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export const NFT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)"
];
