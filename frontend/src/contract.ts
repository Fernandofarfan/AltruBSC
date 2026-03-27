export const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
export const USDT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

export const CONTRACT_ABI = [
  "function registerNGO(address _wallet, string calldata _name) external",
  "function createCause(string calldata _name, uint256 _goalAmount, address _verifiedNGO) external",
  "function donateToCause(uint256 _causeId) external payable",
  "function donateTokenToCause(uint256 _causeId, address _token, uint256 _amount) external",
  "function withdraw(uint256 _causeId, address _token) external",
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
