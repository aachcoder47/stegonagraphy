// Zero-Width Characters (Radix-4)
const ZWC_MAP = ['\u200B', '\u200C', '\u200D', '\u2060'];
// \u200B: Zero Width Space
// \u200C: Zero Width Non-Joiner
// \u200D: Zero Width Joiner
// \u2060: Word Joiner

export const stringToBinary = (str: string): string => {
    return str.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(16, '0');
    }).join('');
};

export const binaryToString = (binary: string): string => {
    const bytes = binary.match(/.{1,16}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
};

export const binaryToZWC = (binary: string): string => {
    // Process 2 bits at a time
    let zwc = '';
    // Ensure length is even, pad with 0 if needed (shouldn't be for 16-bit chars but good safety)
    if (binary.length % 2 !== 0) binary += '0';

    for (let i = 0; i < binary.length; i += 2) {
        const twoBits = binary.substr(i, 2);
        const index = parseInt(twoBits, 2);
        zwc += ZWC_MAP[index];
    }
    return zwc;
};

export const zwcToBinary = (zwcStr: string): string => {
    let binary = '';
    for (let i = 0; i < zwcStr.length; i++) {
        const char = zwcStr[i];
        const index = ZWC_MAP.indexOf(char);
        if (index !== -1) {
            binary += index.toString(2).padStart(2, '0');
        }
    }
    return binary;
};

export const embed = (coverText: string, payload: string): string => {
    // Simple strategy: append to end, or insert after first word.
    // The prompt suggests: "insert the entire payload into a single, major whitespace".
    // Let's insert it after the first word to be less suspicious than at the very start/end,
    // or just append if no spaces.

    if (!coverText) return payload; // Fallback if empty cover

    const match = coverText.match(/\s/);
    if (match && match.index !== undefined) {
        const insertPos = match.index + 1; // After the first whitespace char
        return coverText.slice(0, insertPos) + payload + coverText.slice(insertPos);
    }

    // If no whitespace, just append
    return coverText + payload;
};

export const extract = (stegoText: string): string => {
    // Filter out only our ZWCs
    return stegoText.split('').filter(char => ZWC_MAP.includes(char)).join('');
};
