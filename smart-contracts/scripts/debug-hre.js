import hre from "hardhat";

async function main() {
  const connection = await hre.network.connect();
  console.log("Connection keys:", Object.keys(connection));
  if (connection.ethers) {
    console.log("Ethers found on connection");
  } else {
    console.log("Ethers NOT found on connection");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
