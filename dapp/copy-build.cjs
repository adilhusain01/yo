const fs = require('fs');
const path = require('path');

// Ensure build directory exists for deployment
const targetDir = path.join(__dirname, 'build');
const taasDir = path.join(targetDir, 'Taas');

if (!fs.existsSync(taasDir)) {
  fs.mkdirSync(taasDir, { recursive: true });
  console.log('Created build directory structure');
} else {
  console.log('Build directory already exists');
}

// Check if our TypeScript wrapper files exist
const escrowFile = path.join(taasDir, 'Taas_EscrowRegistry.ts');
const taasFile = path.join(taasDir, 'Taas_Taas.ts');

if (!fs.existsSync(escrowFile) || !fs.existsSync(taasFile)) {
  console.log('TypeScript wrapper files missing - please ensure they exist before building');
} else {
  console.log('TypeScript wrapper files found');
}