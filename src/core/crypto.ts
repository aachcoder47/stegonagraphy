
// Basic config
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const KEY_LENGTH = 256;

// Convert ArrayBuffer or Uint8Array to Base64
const bufferToBase64 = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
};

// Convert Base64 to Uint8Array (easier to work with than ArrayBuffer sometimes)
const base64ToBuffer = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Generate a random salt
const generateSalt = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

// Derive key from password and salt
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-CTR", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
};

// Generate HMAC key from password/salt (for integrity check)
// We use a different derivation or just derive a second key. 
// For simplicity and strength, we can derive a larger key and split it, 
// or run PBKDF2 again with a different salt/info. 
// A simpler robust approach: Use the SAME PBKDF2 derivation but ask for more bits 
// or just derive a separate key for HMAC using a modified salt.
const deriveHmacKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Flip the last byte of salt for HMAC key difference
  const hmacSalt = new Uint8Array(salt);
  hmacSalt[hmacSalt.length - 1] ^= 0xFF;

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: hmacSalt, // Different salt for HMAC key
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign", "verify"]
  );
};

export interface EncryptedPackage {
  payload: string; // Base64
  iv: string;      // Base64
  salt: string;    // Base64
  hmac: string;    // Base64
}

export const encrypt = async (data: Uint8Array, password: string): Promise<EncryptedPackage> => {
  const salt = generateSalt();
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);
  const hmacKey = await deriveHmacKey(password, salt);

  // Data is already Uint8Array, no need to encode
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-CTR", counter: iv, length: 64 },
    key,
    data
  );

  // Sign the encrypted payload
  const hmacBuf = await window.crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encryptedBuf
  );

  return {
    payload: bufferToBase64(encryptedBuf),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    hmac: bufferToBase64(hmacBuf),
  };
};

export const decrypt = async (pkg: EncryptedPackage, password: string): Promise<Uint8Array> => {
  const salt = base64ToBuffer(pkg.salt); // Now returns Uint8Array
  const iv = base64ToBuffer(pkg.iv); // Now returns Uint8Array
  const encryptedBuf = base64ToBuffer(pkg.payload); // Now returns Uint8Array
  const hmacBuf = base64ToBuffer(pkg.hmac); // Now returns Uint8Array

  const hmacKey = await deriveHmacKey(password, salt);

  const isValid = await window.crypto.subtle.verify(
    "HMAC",
    hmacKey,
    hmacBuf as any,
    encryptedBuf as any
  );

  if (!isValid) {
    throw new Error("Integrity check failed: Message likely tampered with or wrong password.");
  }

  const key = await deriveKey(password, salt);

  const decryptedBuf = await window.crypto.subtle.decrypt(
    { name: "AES-CTR", counter: iv as any, length: 64 },
    key,
    encryptedBuf as any
  );

  return new Uint8Array(decryptedBuf);
};

