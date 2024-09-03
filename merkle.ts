import fs from 'fs';
import csv from 'csv-parser';
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// Define the interface for the CSV row
interface AirdropEntry {
  address: string;
  amount: string;
}

// Function to hash address and amount
function hashData(address: string, amount: string): Buffer {
  return keccak256(address + amount);
}

// Read CSV and generate Merkle Tree
function generateMerkleTree() {
  const addresses: string[] = [];
  const amounts: string[] = [];
  const leaves: Buffer[] = [];

  fs.createReadStream('airdrop.csv')
    .pipe(csv())
    .on('data', (row: AirdropEntry) => {
      const address = row.address;
      const amount = row.amount;
      const leaf = hashData(address, amount);
      leaves.push(leaf);
      addresses.push(address);
      amounts.push(amount);
    })
    .on('end', () => {
      const merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const merkleRoot = merkleTree.getRoot().toString('hex');
      console.log('Merkle Root:', merkleRoot);

      // Save the Merkle tree and root for further use
      const output = {
        merkleRoot: merkleRoot,
        addresses: addresses,
        amounts: amounts,
        leaves: leaves.map(leaf => leaf.toString('hex')),
      };

      fs.writeFileSync('merkleTree.json', JSON.stringify(output, null, 2));
    });
}

generateMerkleTree();
