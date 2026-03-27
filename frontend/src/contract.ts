export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
export const CONTRACT_ABI = [
  "function registerNGO(address _wallet, string calldata _name) external",
  "function createCause(string calldata _name, uint256 _goalAmount, address _verifiedNGO) external",
  "function donateToCause(uint256 _causeId) external payable",
  "function getCauses() external view returns (tuple(uint256 id, string name, uint256 goalAmount, address verifiedNGO, bool isClosed)[])",
  "function causeCount() external view returns (uint256)",
  "function causes(uint256) external view returns (uint256 id, string name, uint256 goalAmount, address verifiedNGO, bool isClosed)",
  "function causeBalances(uint256, address) external view returns (uint256)"
];
