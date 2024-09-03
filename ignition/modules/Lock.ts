import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Assuming these constants are relevant for the Airdrop deployment
const DEFAULT_TOKEN_ADDRESS = "0x001AaBE36BBA3C25796bB9B19AE21950a4e6B87E"; // Replace with actual token address
const DEFAULT_MERKLE_ROOT = "0xYourMerkleRootHere"; // Replace with actual Merkle root

const AirdropModule = buildModule("AirdropModule", (m) => {
  // Parameters that can be customized during deployment
  const tokenAddress = m.getParameter("tokenAddress", DEFAULT_TOKEN_ADDRESS);
  const merkleRoot = m.getParameter("merkleRoot", DEFAULT_MERKLE_ROOT);

  // Deploy the MerkleAirdrop contract with the specified parameters
  const airdrop = m.contract("MerkleAirdrop", [tokenAddress, merkleRoot]);

  return { airdrop };
});

export default AirdropModule;
