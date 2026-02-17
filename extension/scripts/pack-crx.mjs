import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash, createSign } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dist = resolve(root, "dist");
const keyPath = resolve(root, "key.pem");
const crxPath = resolve(root, "agentation.crx");

// --- Minimal protobuf encoder (no dependencies) ---

function encodeVarint(value) {
  const bytes = [];
  do {
    let byte = value & 0x7f;
    value >>>= 7;
    if (value > 0) byte |= 0x80;
    bytes.push(byte);
  } while (value > 0);
  return Buffer.from(bytes);
}

function encodeBytes(fieldNumber, data) {
  const key = encodeVarint((fieldNumber << 3) | 2);
  const len = encodeVarint(data.length);
  return Buffer.concat([key, len, data]);
}

// --- Main ---

// Generate signing key if it doesn't exist
if (!existsSync(keyPath)) {
  console.log("Generating new signing key...");
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: "inherit" });
}

// Create a zip of dist/ contents
const zipPath = resolve(root, ".tmp-ext.zip");
execSync(`cd "${dist}" && zip -r "${zipPath}" .`, { stdio: "inherit" });
const zipContents = readFileSync(zipPath);

// Read the private key and extract DER-encoded public key
const privateKey = readFileSync(keyPath);
const pubKeyDer = execSync(
  `openssl rsa -pubout -outform DER -in "${keyPath}"`,
);

// Compute crx_id (first 16 bytes of SHA-256 of the public key)
const crxId = createHash("sha256").update(pubKeyDer).digest().subarray(0, 16);

// Build SignedData protobuf: message SignedData { bytes crx_id = 1; }
const signedHeaderData = encodeBytes(1, crxId);

// Build the data-to-sign:
//   "CRX3 SignedData\x00" + uint32le(signedHeaderData.length) + signedHeaderData + zip
const prefix = Buffer.from("CRX3 SignedData\x00");
const shdLen = Buffer.alloc(4);
shdLen.writeUInt32LE(signedHeaderData.length, 0);

const signInput = Buffer.concat([prefix, shdLen, signedHeaderData, zipContents]);

// Sign with SHA-256 + RSA PKCS#1 v1.5
const signer = createSign("SHA256");
signer.update(signInput);
const signature = signer.sign(privateKey);

// Build AsymmetricKeyProof: message { bytes public_key = 1; bytes signature = 2; }
const keyProof = Buffer.concat([
  encodeBytes(1, pubKeyDer),
  encodeBytes(2, signature),
]);

// Build CrxFileHeader:
//   repeated AsymmetricKeyProof sha256_with_rsa = 2;
//   bytes signed_header_data = 10000;
const header = Buffer.concat([
  encodeBytes(2, keyProof),
  encodeBytes(10000, signedHeaderData),
]);

// CRX3 binary format:
//   magic: "Cr24" (4 bytes)
//   version: 3 (uint32 LE)
//   header_length: uint32 LE
//   header (protobuf)
//   zip contents
const magic = Buffer.from("Cr24");
const version = Buffer.alloc(4);
version.writeUInt32LE(3, 0);
const headerLen = Buffer.alloc(4);
headerLen.writeUInt32LE(header.length, 0);

const crx = Buffer.concat([magic, version, headerLen, header, zipContents]);

writeFileSync(crxPath, crx);
execSync(`rm "${zipPath}"`);

console.log(`Packed ${crxPath} (${(crx.length / 1024).toFixed(0)}K)`);
