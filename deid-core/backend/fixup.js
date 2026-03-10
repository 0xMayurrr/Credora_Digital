require('dotenv').config();
const { ethers } = require('ethers');
const mongoose = require('mongoose');

const contractABI = [
    "function checkIssuer(address issuer) external view returns (bool)",
    "function authorizeIssuer(address issuer) external"
];

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);

    // We assume the newest account was an accidental 'issuer' sign up
    // Let's set the newest account back to 'user'
    await mongoose.connection.collection('users').updateOne(
        { walletAddress: "0xb5b7160af23186828ebdda1480e4efebf8981422" },
        { $set: { role: "user" } }
    );
    console.log("Updated 0xb5b7160af23186828ebdda1480e4efebf8981422 back to 'user' role.");

    const users = await mongoose.connection.collection('users').find({ role: "issuer" }).toArray();
    console.log(`Found ${users.length} authorized issuers in MongoDB.`);

    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);

    for (const u of users) {
        try {
            const isAuth = await contract.checkIssuer(u.walletAddress);
            if (!isAuth) {
                console.log(`Authorizing issuer on blockchain: ${u.walletAddress}`);
                const tx = await contract.authorizeIssuer(u.walletAddress);
                await tx.wait();
                console.log(`Successfully authorized ${u.walletAddress}`);
            } else {
                console.log(`Issuer ${u.walletAddress} already authorized.`);
            }
        } catch (e) {
            console.error(`Failed to authorize ${u.walletAddress}:`, e.message);
        }
    }

    process.exit(0);
}
fix().catch(console.error);
