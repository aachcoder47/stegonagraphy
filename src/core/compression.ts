import LZString from 'lz-string';

export const compress = (text: string): string => {
    return LZString.compressToUTF16(text);
};

export const decompress = (compressed: string): string => {
    const decompressed = LZString.decompressFromUTF16(compressed);
    if (decompressed === null) {
        throw new Error('Decompression failed');
    }
    return decompressed;
};
