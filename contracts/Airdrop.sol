// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title A Merkle Tree based token airdrop contract
contract MerkleAirdrop {
    address private owner;
    IERC20 public token;
    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;

    event AirdropClaimed(address indexed claimant, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /// @dev Initializes the contract with the token address and the Merkle root for proofs
    constructor(address _token, bytes32 _merkleRoot) {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
        owner = msg.sender;
    }

    /// @dev Allows a user to claim their airdrop if they have a valid proof
    /// @param amount The amount of tokens the user is claiming
    /// @param merkleProof The Merkle proof verifying the claim
    function claimTokens(uint256 amount, bytes32[] calldata merkleProof) external {
        require(!claimed[msg.sender], "Airdrop already claimed.");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof.");

        claimed[msg.sender] = true;
        require(token.transfer(msg.sender, amount), "Token transfer failed.");

        emit AirdropClaimed(msg.sender, amount);
    }

    /// @dev Updates the Merkle root, only callable by the contract owner
    /// @param _merkleRoot The new Merkle root
    function updateMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /// @dev Withdraws remaining tokens from the contract, only callable by the contract owner
    function withdrawRemainingTokens() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens left to withdraw.");
        require(token.transfer(owner, balance), "Token transfer failed.");
    }

    /// @dev Transfers ownership of the contract to a new account (`newOwner`)
    /// @param newOwner The address of the new owner
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
