import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

describe("MerkleAirdrop", function () {
    let token: Contract;
    let airdrop: Contract;
    let owner: Signer;
    let addr1: Signer, addr2: Signer, addr3: Signer;
    let merkleTree: MerkleTree;
    let merkleRoot: Buffer;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("ERC20Mock");
        token = await Token.deploy("Test Token", "TT", await owner.getAddress(), 1000);
        await token.deployed();

        const leaves = [addr1, addr2, addr3].map((addr, index) =>
            keccak256(ethers.utils.solidityPack(["address", "uint256"], [addr.getAddress(), (index + 1) * 100]))
        );

        merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        merkleRoot = merkleTree.getRoot();

        const Airdrop = await ethers.getContractFactory("MerkleAirdrop");
        airdrop = await Airdrop.deploy(token.address, merkleRoot);
        await airdrop.deployed();

        await token.transfer(airdrop.address, 600);
    });

    it("Should allow valid airdrop claims", async function () {
        const proof = merkleTree.getHexProof(keccak256(ethers.utils.solidityPack(["address", "uint256"], [await addr1.getAddress(), 100])));
        await airdrop.connect(addr1).claimTokens(100, proof);
        expect(await token.balanceOf(await addr1.getAddress())).to.equal(100);
    });

    it("Should reject invalid airdrop claims", async function () {
        const invalidProof: string[] = [];
        await expect(airdrop.connect(addr1).claimTokens(100, invalidProof))
            .to.be.revertedWith("Invalid proof.");
    });

    it("Should prevent double claims", async function () {
        const proof = merkleTree.getHexProof(keccak256(ethers.utils.solidityPack(["address", "uint256"], [await addr1.getAddress(), 100])));
        await airdrop.connect(addr1).claimTokens(100, proof);
        await expect(airdrop.connect(addr1).claimTokens(100, proof))
            .to.be.revertedWith("Airdrop already claimed.");
    });

    it("Should allow the owner to withdraw remaining tokens", async function () {
        await airdrop.withdrawRemainingTokens();
        expect(await token.balanceOf(await owner.getAddress())).to.equal(900);
    });
});
