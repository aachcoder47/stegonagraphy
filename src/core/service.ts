import * as Compression from './compression';
import * as Crypto from './crypto';
import * as Stego from './steganography';
import * as ImageStego from './imageSteganography';

export const hideMessage = async (secret: string, cover: string, password: string): Promise<string> => {
    console.log('Starting Hide Process...');

    // 1. Compress
    console.log('1. Compressing...');
    const compressed = Compression.compress(secret);

    // 2. Encrypt
    console.log('2. Encrypting...');
    const encryptedPkg = await Crypto.encrypt(compressed, password);

    // 3. Serialize Package
    // Format: "salt|iv|hmac|payload"
    const serialized = `${encryptedPkg.salt}|${encryptedPkg.iv}|${encryptedPkg.hmac}|${encryptedPkg.payload}`;

    // 4. Encode to ZWC
    console.log('3. Encoding to ZWC...');
    const binary = Stego.stringToBinary(serialized);
    const zwcPayload = Stego.binaryToZWC(binary);

    // 5. Embed
    console.log('4. Embedding...');
    return Stego.embed(cover, zwcPayload);
};

export const revealMessage = async (stegoText: string, password: string): Promise<string> => {
    console.log('Starting Reveal Process...');

    // 1. Extract ZWCs
    console.log('1. Extracting...');
    const zwcPayload = Stego.extract(stegoText);
    if (!zwcPayload) {
        throw new Error('No hidden message found (No ZWCs detected).');
    }

    // 2. Decode ZWC to String
    console.log('2. Decoding ZWC...');
    const binary = Stego.zwcToBinary(zwcPayload);
    const serialized = Stego.binaryToString(binary);

    // 3. Deserialize
    const parts = serialized.split('|');
    if (parts.length !== 4) {
        throw new Error('Corrupted message format.');
    }
    const [salt, iv, hmac, payload] = parts;
    const pkg: Crypto.EncryptedPackage = { salt, iv, hmac, payload };

    // 4. Decrypt
    console.log('3. Decrypting...');
    const compressed = await Crypto.decrypt(pkg, password);

    // 5. Decompress
    console.log('4. Decompressing...');
    return Compression.decompress(compressed);
};

export const hideMessageInImage = async (secret: string, coverImageInfo: string, password: string): Promise<string> => {
    console.log('Starting Image Hide Process...');

    // 1. Compress
    const compressed = Compression.compress(secret);

    // 2. Encrypt
    const encryptedPkg = await Crypto.encrypt(compressed, password);

    // 3. Serialize Package
    const serialized = `${encryptedPkg.salt}|${encryptedPkg.iv}|${encryptedPkg.hmac}|${encryptedPkg.payload}`;

    // 4. Embed in Image
    const img = await ImageStego.loadImage(coverImageInfo);
    return ImageStego.embedInImage(img, serialized);
}

export const revealMessageFromImage = async (stegoImageInfo: string, password: string): Promise<string> => {
    console.log('Starting Image Reveal Process...');

    // 1. Extract from Image
    const img = await ImageStego.loadImage(stegoImageInfo);
    const serialized = await ImageStego.extractFromImage(img);

    if (!serialized) {
        throw new Error('No hidden message found in image.');
    }

    // 2. Deserialize
    const parts = serialized.split('|');
    if (parts.length !== 4) {
        throw new Error('Corrupted or invalid hidden data.');
    }
    const [salt, iv, hmac, payload] = parts;
    const pkg: Crypto.EncryptedPackage = { salt, iv, hmac, payload };

    // 3. Decrypt
    const compressed = await Crypto.decrypt(pkg, password);

    // 4. Decompress
    return Compression.decompress(compressed);
}
