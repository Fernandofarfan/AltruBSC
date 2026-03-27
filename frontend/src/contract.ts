export const CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";
export const USDT_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
export const REWARD_NFT_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

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

export const NFT_ABI = [
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)"
];
