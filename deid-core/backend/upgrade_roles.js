require('dotenv').config();
const { ethers } = require('ethers');
const mongoose = require('mongoose');

// ABI for RoleManager (only the methods we need for this script)
const roleManagerABI = [
    "function assignRole(address user, uint8 newRole) external",
    "function roles(address) view returns (uint8)"
];

async function upgrade() {
    try {
        console.log("🚀 Starting System Upgrade...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB.");

        const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.SERVER_WALLET_PRIVATE_KEY, provider);
        
        // Use the newly deployed RoleManager address
        const ROLE_MANAGER_ADDRESS = process.env.ROLE_MANAGER_ADDRESS; 
        if (!ROLE_MANAGER_ADDRESS) throw new Error("Please set ROLE_MANAGER_ADDRESS in .env");

        const roleContract = new ethers.Contract(ROLE_MANAGER_ADDRESS, roleManagerABI, adminWallet);

        // Role mapping based on the Solidity Enum: CITIZEN(0), ISSUER_OFFICER(1), APPROVER(2), ADMIN(3)
        const roleMapping = {
            'user': 0,
            'CITIZEN': 0,
            'issuer': 1,
            'ISSUER_OFFICER': 1,
            'APPROVER': 2,
            'ADMIN': 3
        };

        const users = await mongoose.connection.collection('users').find({}).toArray();
        console.log(`Processing ${users.length} users...`);

        for (const u of users) {
            const targetRoleValue = roleMapping[u.role] ?? 0;
            console.log(`\nUser: ${u.walletAddress} (${u.role}) -> Enum Value: ${targetRoleValue}`);

            try {
                // Check current role on-chain to avoid redundant transactions
                const currentRole = await roleContract.roles(u.walletAddress);
                
                if (Number(currentRole) !== targetRoleValue) {
                    console.log(`Setting role on blockchain...`);
                    const tx = await roleContract.assignRole(u.walletAddress, targetRoleValue);
                    await tx.wait();
                    console.log(`✅ Role successfully set on blockchain.`);
                } else {
                    console.log(`✅ Role already correctly set on blockchain.`);
                }
            } catch (err) {
                console.error(`❌ Failed for ${u.walletAddress}: ${err.message}`);
            }
        }

        console.log("\n✅ All users processed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Critical upgrade error:", err);
        process.exit(1);
    }
}

upgrade();
