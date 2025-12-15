
import LZString from 'lz-string';

// TextEncoder/Decoder for string<->bytes
// const enc = new TextEncoder();
// const dec = new TextDecoder();

export const compressText = (text: string): Uint8Array => {
    // Compress text using LZString to reduce size (stego space is expensive)
    const compressed = LZString.compressToUTF16(text);
    // Convert the compressed 16-bit string into Uint16Array format, then to Uint8Array for encryption
    // Actually, UTF16 string to Uint8Array via TextEncoder might mess up the specific storage?
    // LZString produces valid UTF-16 strings. TextEncoder encodes to UTF-8.
    // Ideally we want to preserve the bits.
    // Better: use LZString.compressToUint8Array if avail, or just:
    // Simple approach: Text -> UTF8 Bytes. (Gzip would be better but LzString is what we have).
    // Let's just standard encode the Text -> UTF8 -> Gzip?
    // The current implementation used LZString.compressToUTF16.
    // To match previous logic:
    // str -> compressToUTF16 -> string.
    // string -> UTF16 bytes -> Uint8Array.

    // Let's simplify: 
    // Just UTF-8 encode the raw text? No, compression is vital for stego.
    // Let's use LZString.compressToUint8Array() if the library supports it, 
    // but the import shows default. Let's assume it might not.
    // Let's stick effectively to: 
    // Text -> LZString (UTF16 String) -> Uint8Array (little endian representation of chars).

    const buf = new Uint8Array(compressed.length * 2);
    const view = new Uint16Array(buf.buffer);
    for (let i = 0; i < compressed.length; i++) {
        view[i] = compressed.charCodeAt(i);
    }
    return buf;
};

export const decompressText = (data: Uint8Array): string => {
    // Uint8Array -> Uint16Array -> String -> Decompress
    const view = new Uint16Array(data.buffer);
    let compressed = '';
    // Chunk processing to avoid stack overflow on large strings
    for (let i = 0; i < view.length; i++) {
        compressed += String.fromCharCode(view[i]);
    }
    const decompressed = LZString.decompressFromUTF16(compressed);
    if (decompressed === null) {
        throw new Error('Decompression failed');
    }
    return decompressed;
};

