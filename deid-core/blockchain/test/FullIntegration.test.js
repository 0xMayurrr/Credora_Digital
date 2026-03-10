const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("🔐 Full Blockchain Integration Test — Credora", function () {
  let roleManager, credentialRegistry, certLifecycle, revocationRegistry;
  let admin, officer, approver, citizen;

  before(async () => {
    [admin, officer, approver, citizen] = await ethers.getSigners();

    // 1. RoleManager (must be first — all other contracts depend on it)
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // 2. RevocationRegistry
    const RevocationRegistry = await ethers.getContractFactory("RevocationRegistry");
    revocationRegistry = await RevocationRegistry.deploy(roleManager.target);
    await revocationRegistry.waitForDeployment();

    // 3. CredentialRegistry (EIP-712 aware)
    const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
    credentialRegistry = await CredentialRegistry.deploy(roleManager.target);
    await credentialRegistry.waitForDeployment();

    // 4. CertificateLifecycle
    const CertLifecycle = await ethers.getContractFactory("CertificateLifecycle");
    certLifecycle = await CertLifecycle.deploy(roleManager.target, revocationRegistry.target);
    await certLifecycle.waitForDeployment();
  });

  // ─── Role Management ────────────────────────────────────────────────────────

  it("✅ [RoleManager] Should assign roles on-chain", async () => {
    await roleManager.connect(admin).assignRole(officer.address, 1);   // ISSUER_OFFICER
    await roleManager.connect(admin).assignRole(approver.address, 2);  // APPROVER
    await roleManager.connect(admin).assignRole(citizen.address, 0);   // CITIZEN

    expect(await roleManager.getRole(officer.address)).to.equal(1n);
    expect(await roleManager.getRole(approver.address)).to.equal(2n);
    expect(await roleManager.getRole(citizen.address)).to.equal(0n);
    expect(await roleManager.getRole(admin.address)).to.equal(3n);     // ADMIN by default
  });

  it("✅ [RoleManager] Should reject role assignment from non-admin", async () => {
    await expect(
      roleManager.connect(citizen).assignRole(citizen.address, 3)
    ).to.be.reverted;
  });

  // ─── Credential Issuance (EIP-712) ──────────────────────────────────────────

  let issuedCredentialId;

  it("✅ [CredentialRegistry] Should issue credential with EIP-712 signature", async () => {
    const domain = {
      name: "CredoraRegistry",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: credentialRegistry.target,
    };
    const types = {
      Credential: [
        { name: "subject",         type: "address" },
        { name: "credentialType",  type: "string"  },
        { name: "metadataURI",     type: "string"  },
        { name: "expirationDate",  type: "uint256" },
      ],
    };
    const value = {
      subject:         citizen.address,
      credentialType:  "UniversityDegree",
      metadataURI:     "ipfs://QmTest123ABC",
      expirationDate:  0,
    };

    // Officer signs from their own wallet
    const sig = await officer.signTypedData(domain, types, value);

    const tx = await credentialRegistry.connect(officer).issueCredential(
      citizen.address, "UniversityDegree", "ipfs://QmTest123ABC", 0, sig
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    // Parse event to get credentialId
    const event = receipt.logs
      .map(log => { try { return credentialRegistry.interface.parseLog(log); } catch { return null; } })
      .find(e => e?.name === "CredentialIssued");
    issuedCredentialId = event?.args?.credentialId;
    expect(issuedCredentialId).to.not.be.undefined;
  });

  it("✅ [CredentialRegistry] Should reject issuance from non-officer", async () => {
    const sig = await citizen.signTypedData(
      { name: "CredoraRegistry", version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: credentialRegistry.target },
      { Credential: [
        { name: "subject", type: "address" }, { name: "credentialType", type: "string" },
        { name: "metadataURI", type: "string" }, { name: "expirationDate", type: "uint256" }
      ]},
      { subject: citizen.address, credentialType: "Fake", metadataURI: "ipfs://fake", expirationDate: 0 }
    );
    await expect(
      credentialRegistry.connect(citizen).issueCredential(citizen.address, "Fake", "ipfs://fake", 0, sig)
    ).to.be.reverted;
  });

  it("✅ [CredentialRegistry] Should verify credential on-chain", async () => {
    const result = await credentialRegistry.verifyCredential(issuedCredentialId);
    expect(result.isValid).to.equal(true);
    expect(result.isRevoked).to.equal(false);
    expect(result.issuer.toLowerCase()).to.equal(officer.address.toLowerCase());
    expect(result.subject.toLowerCase()).to.equal(citizen.address.toLowerCase());
  });

  // ─── Certificate Lifecycle ───────────────────────────────────────────────────

  let certDocHash;

  it("✅ [CertLifecycle] Should follow full state machine: DRAFT → ISSUED", async () => {
    const docHash = ethers.keccak256(
      ethers.toUtf8Bytes("degree-cert-" + Date.now())
    );
    certDocHash = docHash;

    // OFFICER creates draft
    await certLifecycle.connect(officer).createDraft(
      docHash, citizen.address, "ipfs://QmCert123", 1, [approver.address]
    );
    let cert = await certLifecycle.getCertificate(docHash);
    expect(cert.state).to.equal(0n); // DRAFT

    // OFFICER submits for review
    await certLifecycle.connect(officer).submitForReview(docHash);
    cert = await certLifecycle.getCertificate(docHash);
    expect(cert.state).to.equal(1n); // UNDER_REVIEW

    // APPROVER approves
    await certLifecycle.connect(approver).approveCertificate(docHash);
    cert = await certLifecycle.getCertificate(docHash);
    expect(cert.state).to.equal(2n); // APPROVED

    // APPROVER signs
    await certLifecycle.connect(approver).signCertificate(docHash);
    cert = await certLifecycle.getCertificate(docHash);
    expect(cert.state).to.equal(3n); // SIGNED

    // OFFICER issues final cert
    await certLifecycle.connect(officer).issueCertificate(docHash);
    cert = await certLifecycle.getCertificate(docHash);
    expect(cert.state).to.equal(4n); // ISSUED
  });

  it("✅ [CertLifecycle] Should reject invalid state transition", async () => {
    const docHash = ethers.keccak256(ethers.toUtf8Bytes("bad-transition-" + Date.now()));
    await certLifecycle.connect(officer).createDraft(
      docHash, citizen.address, "ipfs://test", 1, [approver.address]
    );
    // Can't approve without review
    await expect(
      certLifecycle.connect(approver).approveCertificate(docHash)
    ).to.be.reverted;
  });

  // ─── Revocation ──────────────────────────────────────────────────────────────

  it("✅ [RevocationRegistry] Should revoke and reflect in verification", async () => {
    const docHashBytes = issuedCredentialId;
    await revocationRegistry.connect(admin).revoke(docHashBytes, "Document fraud detected");

    expect(await revocationRegistry.isRevoked(docHashBytes)).to.equal(true);

    const details = await revocationRegistry.getRevocationDetails(docHashBytes);
    expect(details.reason).to.equal("Document fraud detected");
    expect(details.revokedBy.toLowerCase()).to.equal(admin.address.toLowerCase());
    expect(Number(details.timestamp)).to.be.greaterThan(0);
  });

  it("✅ [RevocationRegistry] Should reject revocation from non-admin", async () => {
    const randomHash = ethers.keccak256(ethers.toUtf8Bytes("random"));
    await expect(
      revocationRegistry.connect(citizen).revoke(randomHash, "hack attempt")
    ).to.be.reverted;
  });
});
