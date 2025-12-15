import { useState, useRef } from 'react';
import { Lock, Unlock, AlertTriangle, Image as ImageIcon, FileText, Upload, Download } from 'lucide-react';
import { revealMessage, revealMessageFromImage, type StegoResult } from '../core/service';
import { readFileAsDataURL } from '../core/imageSteganography';

const RevealTab: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [cloakedText, setCloakedText] = useState('');
    // const [stegoImage, setStegoImage] = useState<File | null>(null); // Removed
    const [stegoImagePreview, setStegoImagePreview] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    const [revealed, setRevealed] = useState<StegoResult | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReveal = async () => {
        setError(null);
        setRevealed(null);

        if (mode === 'text' && !cloakedText) {
            setError('Please provide the cloaked text.');
            return;
        }
        if (mode === 'image' && !stegoImagePreview) {
            setError('Please upload the stego image.');
            return;
        }

        if (!password) {
            setError('Please enter the password.');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'text') {
                const resultStr = await revealMessage(cloakedText, password);
                setRevealed({ type: 'text', content: resultStr });
            } else {
                if (!stegoImagePreview) return;
                const result = await revealMessageFromImage(stegoImagePreview, password);
                setRevealed(result);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to reveal. Password might be wrong or message tampered.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file.');
                return;
            }
            // setStegoImage(file); // Removed
            readFileAsDataURL(file).then(setStegoImagePreview).catch(() => setError('Failed to read image.'));
            setRevealed(null);
        }
    };

    const downloadRevealedFile = () => {
        if (!revealed || revealed.type !== 'file' || !(revealed.content instanceof Uint8Array)) return;

        const blob = new Blob([revealed.content as any], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `secret-file-${Date.now()}.bin`; // We don't have original filename, maybe adding it to metadata later would be good.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-900 p-1 rounded-xl flex gap-1 border border-gray-700">
                    <button
                        onClick={() => { setMode('text'); setRevealed(null); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${mode === 'text' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <FileText size={16} /> Text Mode
                    </button>
                    <button
                        onClick={() => { setMode('image'); setRevealed(null); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${mode === 'image' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <ImageIcon size={16} /> Image Mode
                    </button>
                </div>
            </div>

            {/* Cloaked Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    {mode === 'text' ? 'Cloaked Message' : 'Stego Image'}
                </label>

                {mode === 'text' ? (
                    <textarea
                        value={cloakedText}
                        onChange={(e) => setCloakedText(e.target.value)}
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm font-mono"
                        placeholder="Paste the text containing hidden message here..."
                    />
                ) : (
                    <div
                        className="w-full h-32 border-2 border-dashed border-gray-700 hover:border-cyan-500 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-900/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        {stegoImagePreview ? (
                            <img src={stegoImagePreview} alt="Preview" className="h-full object-contain p-2" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <span className="text-sm">Click to upload image with hidden message</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Decryption Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
                        placeholder="Enter password..."
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleReveal}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99]
          ${loading ? 'bg-cyan-800 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/25'}
        `}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        Processing...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <Unlock className="w-4 h-4" /> Reveal Secret
                    </span>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-950/50 border border-red-900 rounded-lg flex items-start gap-3 text-red-200 text-sm animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Decryption Failed</p>
                        <p className="opacity-80">{error}</p>
                    </div>
                </div>
            )}

            {/* Result Output */}
            {revealed && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-sm font-medium text-cyan-400">Revealed Secret</label>
                    <div className="relative">
                        {revealed.type === 'text' && typeof revealed.content === 'string' ? (
                            <textarea
                                readOnly
                                value={revealed.content}
                                className="w-full h-40 bg-gray-950 border border-cyan-900/50 rounded-lg p-4 text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-base leading-relaxed"
                            />
                        ) : (
                            <div className="bg-gray-950 border border-cyan-900/50 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
                                <p className="text-gray-300">Hidden file found</p>
                                <button
                                    onClick={downloadRevealedFile}
                                    className="flex items-center gap-2 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
                                >
                                    <Download size={18} /> Download Rescued File
                                </button>
                                <p className="text-xs text-gray-500">File size: {revealed.content.length} bytes</p>
                            </div>
                        )}

                        <div className="absolute top-0 right-0 p-2">
                            <span className="text-xs px-2 py-1 bg-cyan-900/30 text-cyan-500 rounded-full border border-cyan-900/50">Verified</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevealTab;
