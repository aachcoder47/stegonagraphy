
// Helper to read file as Data URL (for preview/processing)
export const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Helper to load image object
export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

const byteToBinary = (byte: number): string => {
    return byte.toString(2).padStart(8, '0');
};

const binaryToByte = (binary: string): number => {
    return parseInt(binary, 2);
};

// Embed binary data into image using LSB
// Stores length (32 bits) + data.
export const embedInImage = async (image: HTMLImageElement, message: Uint8Array): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate bits needed
    const messageBitsLength = message.length * 8;
    const binaryLength = messageBitsLength.toString(2).padStart(32, '0');

    const totalBitsNeeded = 32 + messageBitsLength;
    const totalPixelsAvailable = data.length / 4;

    // We use R, G, B channels (3 bits per pixel)
    if (totalBitsNeeded > totalPixelsAvailable * 3) {
        throw new Error(`Image is too small. Need ${Math.ceil(totalBitsNeeded / 3)} pixels, have ${totalPixelsAvailable}.`);
    }

    let dataIndex = 0;

    // Helper to get next valid channel index (skips Alpha)
    const nextChannel = () => {
        while (dataIndex % 4 === 3) dataIndex++; // Skip Alpha
        return dataIndex++;
    };

    // 1. Embed Length (32 bits)
    for (let i = 0; i < 32; i++) {
        const idx = nextChannel();
        const bit = binaryLength[i];
        if (data[idx] % 2 === 0 && bit === '1') {
            data[idx]++;
        } else if (data[idx] % 2 === 1 && bit === '0') {
            data[idx]--;
        }
    }

    // 2. Embed Message (Byte by Byte)
    for (let i = 0; i < message.length; i++) {
        const byte = message[i]; // 0-255
        const binaryByte = byteToBinary(byte); // "00000000"

        for (let b = 0; b < 8; b++) {
            const idx = nextChannel();
            const bit = binaryByte[b];

            if (data[idx] % 2 === 0 && bit === '1') {
                data[idx]++;
            } else if (data[idx] % 2 === 1 && bit === '0') {
                data[idx]--;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

export const extractFromImage = async (image: HTMLImageElement): Promise<Uint8Array | null> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let dataIndex = 0;
    const nextChannel = () => {
        while (dataIndex % 4 === 3) dataIndex++;
        return dataIndex++;
    };

    // 1. Extract Length
    let binaryLength = '';
    for (let i = 0; i < 32; i++) {
        const idx = nextChannel();
        binaryLength += (data[idx] % 2).toString();
    }
    const messageBitsLength = parseInt(binaryLength, 2);

    if (messageBitsLength <= 0 || messageBitsLength > (data.length * 3)) {
        return null;
    }

    // 2. Extract Message
    const byteLength = Math.floor(messageBitsLength / 8);
    const result = new Uint8Array(byteLength);

    for (let i = 0; i < byteLength; i++) {
        let binaryByte = '';
        for (let b = 0; b < 8; b++) {
            const idx = nextChannel();
            binaryByte += (data[idx] % 2).toString();
        }
        result[i] = binaryToByte(binaryByte);
    }

    return result;
};
