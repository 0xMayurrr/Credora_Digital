const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("🚀 Deploying contracts with account:", deployer.address);

    // 1. Deploy RoleManager
    const RoleManager = await hre.ethers.getContractFactory("RoleManager");
    const roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();
    const roleManagerAddress = await roleManager.getAddress();
    console.log("✅ RoleManager deployed to:", roleManagerAddress);

    // 2. Deploy RevocationRegistry
    const RevocationRegistry = await hre.ethers.getContractFactory("RevocationRegistry");
    const revocationRegistry = await RevocationRegistry.deploy(roleManagerAddress);
    await revocationRegistry.waitForDeployment();
    const revocationRegistryAddress = await revocationRegistry.getAddress();
    console.log("✅ RevocationRegistry deployed to:", revocationRegistryAddress);

    // 3. Deploy CertificateLifecycle
    const CertificateLifecycle = await hre.ethers.getContractFactory("CertificateLifecycle");
    const certificateLifecycle = await CertificateLifecycle.deploy(roleManagerAddress, revocationRegistryAddress);
    await certificateLifecycle.waitForDeployment();
    const lifecycleAddress = await certificateLifecycle.getAddress();
    console.log("✅ CertificateLifecycle deployed to:", lifecycleAddress);

    console.log("\n--- DEPLOYMENT SUMMARY ---");
    console.log("Copy these to your .env files:");
    console.log(`VITE_LIFECYCLE_CONTRACT_ADDRESS=${lifecycleAddress}`);
    console.log(`LIFECYCLE_CONTRACT_ADDRESS=${lifecycleAddress}`);
    console.log(`ROLE_MANAGER_ADDRESS=${roleManagerAddress}`);
    console.log("--------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
