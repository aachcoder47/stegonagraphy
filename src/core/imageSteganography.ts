
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

const stringToBinary = (str: string): string => {
    return str.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(16, '0');
    }).join('');
};

const binaryToString = (binary: string): string => {
    // Only process complete 16-bit chunks
    const cleanBinary = binary.slice(0, binary.length - (binary.length % 16));
    const bytes = cleanBinary.match(/.{1,16}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
};

// Embed binary data into image using LSB (Alpha channel safe strategy or RGB)
// We will use RGBA channels sequentially.
// We also need to store the length of the message so we know when to stop reading.
// Strategy: First 32 pixels (128 bits) store the length of the binary string (32-bit integer encoded).
// Then the rest of the pixels store the data.
export const embedInImage = async (image: HTMLImageElement, message: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const binaryMessage = stringToBinary(message);
    const messageLength = binaryMessage.length;
    const binaryLength = messageLength.toString(2).padStart(32, '0'); // 32 bits for length

    const totalBitsNeeded = 32 + messageLength;
    const totalPixelsAvailable = data.length / 4; // Each pixel has 4 channels (R, G, B, A)
    // We can store 3 bits per pixel (R, G, B) to be safe and avoid Alpha issues, 
    // or 4 if we are careful. Let's stick to 3 bits (R, G, B) to be safe with transparency.
    // Actually, simple LSB on R, G, B is standard.

    if (totalBitsNeeded > totalPixelsAvailable * 3) {
        throw new Error('Image is too small to hold this message.');
    }

    let dataIndex = 0;

    // 1. Embed Length (32 bits)
    for (let i = 0; i < 32; i++) {
        // Find next valid channel (skip Alpha which is index % 4 === 3)
        while (dataIndex % 4 === 3) dataIndex++;

        const bit = binaryLength[i];
        if (data[dataIndex] % 2 === 0 && bit === '1') {
            data[dataIndex] += 1;
        } else if (data[dataIndex] % 2 === 1 && bit === '0') {
            data[dataIndex] -= 1;
        }
        dataIndex++;
    }

    // 2. Embed Message
    for (let i = 0; i < messageLength; i++) {
        while (dataIndex % 4 === 3) dataIndex++;

        const bit = binaryMessage[i];
        if (data[dataIndex] % 2 === 0 && bit === '1') {
            data[dataIndex] += 1;
        } else if (data[dataIndex] % 2 === 1 && bit === '0') {
            data[dataIndex] -= 1;
        }
        dataIndex++;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
};

export const extractFromImage = async (image: HTMLImageElement): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let dataIndex = 0;
    let binaryLength = '';

    // 1. Extract Length
    for (let i = 0; i < 32; i++) {
        while (dataIndex % 4 === 3) dataIndex++;
        binaryLength += (data[dataIndex] % 2).toString();
        dataIndex++;
    }
    const messageLength = parseInt(binaryLength, 2);

    if (messageLength <= 0 || messageLength > (data.length * 3)) {
        // Basic sanity check fail
        return '';
    }

    // 2. Extract Message
    let binaryMessage = '';
    for (let i = 0; i < messageLength; i++) {
        while (dataIndex % 4 === 3) dataIndex++;
        binaryMessage += (data[dataIndex] % 2).toString();
        dataIndex++;
    }

    return binaryToString(binaryMessage);
};
