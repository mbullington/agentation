import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");
const keyPath = resolve(root, "key.pem");
const crxPath = resolve(root, "agentation.crx");

// Generate signing key if it doesn't exist
if (!existsSync(keyPath)) {
  console.log("Generating new signing key...");
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: "inherit" });
}

// Create a zip of dist/ contents
const zipPath = resolve(root, ".tmp-ext.zip");
execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: "inherit" });
const zipContents = readFileSync(zipPath);

// Extract DER-encoded public key
const pubKeyDer = execSync(
  `openssl rsa -pubout -outform DER -in "${keyPath}"`,
);

// Sign the zip with the private key
const signature = execSync(
  `openssl dgst -sha1 -sign "${keyPath}" "${zipPath}"`,
);

// Build the CRX3-format file
// CRX format: magic (4) + version (4) + header_length (4) + header + zip
// For CRX2 (simpler, widely supported for sideloading):
//   magic: "Cr24"
//   version: 2
//   public_key_length: 4 bytes LE
//   signature_length: 4 bytes LE
//   public_key
//   signature
//   zip contents

const magic = Buffer.from("Cr24");
const version = Buffer.alloc(4);
version.writeUInt32LE(2, 0);

const pubKeyLen = Buffer.alloc(4);
pubKeyLen.writeUInt32LE(pubKeyDer.length, 0);

const sigLen = Buffer.alloc(4);
sigLen.writeUInt32LE(signature.length, 0);

const crx = Buffer.concat([
  magic,
  version,
  pubKeyLen,
  sigLen,
  pubKeyDer,
  signature,
  zipContents,
]);

writeFileSync(crxPath, crx);

// Clean up temp zip
execSync(`rm "${zipPath}"`);

console.log(`Packed ${crxPath}`);
