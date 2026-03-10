const fs = require('fs');
const path = require('path');

const contracts = [
  'CredentialRegistry',
  'CertificateLifecycle',
  'RoleManager',
  'RevocationRegistry'
];

const abiDir = path.join(__dirname, '../../../veripass-wallet/src/abis');

// Create abis dir if it doesn't exist
if (!fs.existsSync(abiDir)) {
  fs.mkdirSync(abiDir, { recursive: true });
}

let allCopied = true;
contracts.forEach(name => {
  const src = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
  const dest = path.join(abiDir, `${name}.json`);

  if (!fs.existsSync(src)) {
    console.error(`❌ Artifact not found: ${src}`);
    console.error(`   Run 'npx hardhat compile' first.`);
    allCopied = false;
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(src, 'utf8'));
  // Only copy the ABI array, not the full artifact
  fs.writeFileSync(dest, JSON.stringify({ abi: artifact.abi }, null, 2));
  console.log(`✅ Copied ABI: ${name} (${artifact.abi.length} functions/events)`);
});

if (allCopied) {
  console.log('\n🎉 All ABIs copied to veripass-wallet/src/abis/');
  console.log('   Next: Update VITE_* addresses in veripass-wallet/.env');
}
