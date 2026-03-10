const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateLifecycle & RoleManager Workflow", function () {
    let RoleManager, roleManager;
    let RevocationRegistry, revocationRegistry;
    let CertificateLifecycle, certificateLifecycle;

    let admin, officer, approver1, approver2, citizen, maliciousUser;

    beforeEach(async function () {
        [admin, officer, approver1, approver2, citizen, maliciousUser] = await ethers.getSigners();

        // Deploy RoleManager
        RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();

        // Assign Roles
        // Enums: CITIZEN (0), ISSUER_OFFICER (1), APPROVER (2), ADMIN (3)
        await roleManager.assignRole(officer.address, 1);
        await roleManager.assignRole(approver1.address, 2);
        await roleManager.assignRole(approver2.address, 2);
        await roleManager.assignRole(citizen.address, 0);

        // Deploy RevocationRegistry
        RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
        revocationRegistry = await RevocationRegistry.deploy(await roleManager.getAddress());

        // Deploy CertificateLifecycle
        CertificateLifecycle = await ethers.getContractFactory("CertificateLifecycle");
        certificateLifecycle = await CertificateLifecycle.deploy(
            await roleManager.getAddress(),
            await revocationRegistry.getAddress()
        );
    });

    it("should allow ISSUER_OFFICER to create draft", async function () {
        const docHash = ethers.id("test-doc-1");
        const metadataURI = "ipfs://test";

        await expect(certificateLifecycle.connect(officer).createDraft(
            docHash, citizen.address, metadataURI, 2, [approver1.address, approver2.address]
        )).to.emit(certificateLifecycle, "CertificateStateChanged");

        const cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(0);
    });

    it("should process standard multi-sig approval lifecycle", async function () {
        const docHash = ethers.id("test-doc-2");
        const metadataURI = "ipfs://test-2";

        await certificateLifecycle.connect(officer).createDraft(
            docHash, citizen.address, metadataURI, 2, [approver1.address, approver2.address]
        );

        await certificateLifecycle.connect(officer).submitForReview(docHash);

        let cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(1); // UNDER_REVIEW

        await certificateLifecycle.connect(approver1).approveCertificate(docHash);
        await expect(certificateLifecycle.connect(approver1).approveCertificate(docHash))
            .to.be.revertedWith("CertificateLifecycle: Already approved");

        cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(1); // Still UNDER_REVIEW because needs 2 approvals

        await certificateLifecycle.connect(approver2).approveCertificate(docHash);

        cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(2); // APPROVED

        await certificateLifecycle.connect(approver1).signCertificate(docHash);

        cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(3); // SIGNED

        await certificateLifecycle.connect(officer).issueCertificate(docHash);

        cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(4); // ISSUED
    });

    it("should enforce role constraints", async function () {
        const docHash = ethers.id("test-doc-3");

        await expect(certificateLifecycle.connect(maliciousUser).createDraft(
            docHash, citizen.address, "ipfs", 1, [approver1.address]
        )).to.be.revertedWith("CertificateLifecycle: Must be ISSUER_OFFICER");
    });

    it("should successfully revoke a certificate", async function () {
        const docHash = ethers.id("test-doc-revoke");
        await certificateLifecycle.connect(officer).createDraft(
            docHash, citizen.address, "ipfs", 1, [approver1.address]
        );

        // Revoke
        await revocationRegistry.connect(admin).revokeCertificate(docHash, "Fraud");
        await expect(certificateLifecycle.connect(officer).submitForReview(docHash))
            .to.be.revertedWith("CertificateLifecycle: Certificate is revoked");

        // Because submitForReview reverted, state rollback happens. Must sync to commit changes permanently
        await certificateLifecycle.connect(officer).syncRevocation(docHash);

        const cert = await certificateLifecycle.getCertificate(docHash);
        expect(cert.state).to.equal(5); // REVOKED
    });
});
