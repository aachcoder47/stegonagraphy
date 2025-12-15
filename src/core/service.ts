import * as Compression from './compression';
import * as Crypto from './crypto';
import * as Stego from './steganography';
import * as ImageStego from './imageSteganography';

// Helpers
const enc = new TextEncoder();
const dec = new TextDecoder();

export interface StegoResult {
    type: 'text' | 'file';
    content: string | Uint8Array;
}

export const hideMessage = async (secret: string, cover: string, password: string): Promise<string> => {
    // 1. Compress (Text -> Uint8Array)
    const compressed = Compression.compressText(secret);

    // 2. Encrypt (Uint8Array -> Package)
    const encryptedPkg = await Crypto.encrypt(compressed, password);

    // 3. Serialize Package (Package -> String)
    const serialized = `${encryptedPkg.salt}|${encryptedPkg.iv}|${encryptedPkg.hmac}|${encryptedPkg.payload}`;

    // 4. Encode to ZWC (String -> BinaryString -> ZWC)
    const binary = Stego.stringToBinary(serialized);
    const zwcPayload = Stego.binaryToZWC(binary);

    // 5. Embed
    return Stego.embed(cover, zwcPayload);
};

export const revealMessage = async (stegoText: string, password: string): Promise<string> => {
    // 1. Extract ZWCs
    const zwcPayload = Stego.extract(stegoText);
    if (!zwcPayload) {
        throw new Error('No hidden message found (No ZWCs detected).');
    }

    // 2. Decode ZWC to String
    const binary = Stego.zwcToBinary(zwcPayload);
    const serialized = Stego.binaryToString(binary);

    // 3. Deserialize
    const parts = serialized.split('|');
    if (parts.length !== 4) {
        throw new Error('Corrupted message format.');
    }
    const [salt, iv, hmac, payload] = parts;
    const pkg: Crypto.EncryptedPackage = { salt, iv, hmac, payload };

    // 4. Decrypt (Package -> Uint8Array)
    const decryptedBytes = await Crypto.decrypt(pkg, password);

    // 5. Decompress (Uint8Array -> String)
    return Compression.decompressText(decryptedBytes);
};

export const hideMessageInImage = async (secret: string | Uint8Array, coverImageInfo: string, password: string): Promise<string> => {
    // Prefix 1 byte to indicate type: 0 = text, 1 = file
    let payload: Uint8Array;

    if (typeof secret === 'string') {
        const textBytes = Compression.compressText(secret);
        payload = new Uint8Array(textBytes.length + 1);
        payload[0] = 0; // Text header
        payload.set(textBytes, 1);
    } else {
        // File: Just wrap
        payload = new Uint8Array(secret.length + 1);
        payload[0] = 1; // File header
        payload.set(secret, 1);
    }

    // Encrypt
    const encryptedPkg = await Crypto.encrypt(payload, password);

    // Serialize Package to String "salt|iv..."
    const serialized = `${encryptedPkg.salt}|${encryptedPkg.iv}|${encryptedPkg.hmac}|${encryptedPkg.payload}`;

    // Convert serialized string to Uint8Array for image embedding
    const serializedBytes = enc.encode(serialized);

    // Embed in Image
    const img = await ImageStego.loadImage(coverImageInfo);
    return ImageStego.embedInImage(img, serializedBytes);
}

export const revealMessageFromImage = async (stegoImageInfo: string, password: string): Promise<StegoResult> => {
    // 1. Extract from Image
    const img = await ImageStego.loadImage(stegoImageInfo);
    const serializedBytes = await ImageStego.extractFromImage(img);

    if (!serializedBytes) {
        throw new Error('No hidden message found in image.');
    }

    // Convert bytes back to string "salt|iv..."
    const serialized = dec.decode(serializedBytes);

    // 2. Deserialize
    const parts = serialized.split('|');
    if (parts.length !== 4) {
        // If split fail, it might be that extracted bytes are garbage
        throw new Error('Corrupted or invalid hidden data.');
    }
    const [salt, iv, hmac, payload] = parts;
    const pkg: Crypto.EncryptedPackage = { salt, iv, hmac, payload };

    // 3. Decrypt
    const decryptedBytes = await Crypto.decrypt(pkg, password);

    // 4. Check Type Header
    const typeHeader = decryptedBytes[0];
    const contentBytes = decryptedBytes.slice(1);

    if (typeHeader === 0) {
        // Text
        return {
            type: 'text',
            content: Compression.decompressText(contentBytes)
        };
    } else if (typeHeader === 1) {
        // File
        return {
            type: 'file',
            content: contentBytes
        };
    } else {
        throw new Error('Unknown data type in hidden message.');
    }
}
