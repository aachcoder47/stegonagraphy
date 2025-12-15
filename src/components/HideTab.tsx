import { useState, useRef } from 'react';
import { Lock, Copy, CheckCircle2, AlertCircle, Image as ImageIcon, FileText, Download, Upload } from 'lucide-react';
import { hideMessage, hideMessageInImage } from '../core/service';
import { readFileAsDataURL } from '../core/imageSteganography';

const HideTab: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [secret, setSecret] = useState('');
    const [cover, setCover] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [password, setPassword] = useState('');

    // Result can be string (text mode) or dataURL (image mode)
    const [cloaked, setCloaked] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Metrics
    const secretSize = new Blob([secret]).size;
    const zwcCount = mode === 'text' && cloaked ? cloaked.length - cover.length : 0;

    const handleHide = async () => {
        setError(null);
        setCloaked('');

        if (!secret || !password) {
            setError('Please provide secret text and a password.');
            return;
        }

        if (mode === 'image' && !coverImagePreview) {
            setError('Please upload a cover image.');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'text') {
                const finalCover = cover || 'This is a cover message.';
                const result = await hideMessage(secret, finalCover, password);
                setCloaked(result);
            } else {
                if (!coverImagePreview) return;
                const result = await hideMessageInImage(secret, coverImagePreview, password);
                setCloaked(result);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while hiding the message.');
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
            setCoverImage(file);
            // Read for preview
            readFileAsDataURL(file).then(setCoverImagePreview).catch(() => setError('Failed to read image.'));
            setCloaked(''); // clear previous result
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(cloaked);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadImage = () => {
        if (!cloaked) return;
        const link = document.createElement('a');
        link.href = cloaked;
        link.download = `stego-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-900 p-1 rounded-xl flex gap-1 border border-gray-700">
                    <button
                        onClick={() => { setMode('text'); setCloaked(''); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <FileText size={16} /> Text Mode
                    </button>
                    <button
                        onClick={() => { setMode('image'); setCloaked(''); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${mode === 'image' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <ImageIcon size={16} /> Image Mode
                    </button>
                </div>
            </div>

            {/* Secret Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Secret Message</label>
                <div className="relative">
                    <textarea
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                        placeholder="Enter the secret you want to hide..."
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                        {secretSize} bytes
                    </div>
                </div>
            </div>

            {/* Cover Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    {mode === 'text' ? 'Cover Message (Public)' : 'Cover Image (Public)'}
                </label>

                {mode === 'text' ? (
                    <textarea
                        value={cover}
                        onChange={(e) => setCover(e.target.value)}
                        className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                        placeholder="Enter a boring text to hide the secret in..."
                    />
                ) : (
                    <div
                        className="w-full h-32 border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-900/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        {coverImagePreview ? (
                            <img src={coverImagePreview} alt="Preview" className="h-full object-contain p-2" />
                        ) : (
                            <div className="text-center text-gray-500">
                                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <span className="text-sm">Click to upload cover image</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Encryption Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                        placeholder="Strong password..."
                    />
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleHide}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99]
          ${loading ? 'bg-indigo-800 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg hover:shadow-indigo-500/25'}
        `}
            >
                {loading ? 'Processing...' : 'Cloak Message'}
            </button>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Result Output */}
            {cloaked && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-sm font-medium text-green-400">
                        {mode === 'text' ? 'Cloaked Message (Ready to Copy)' : 'Cloaked Image (Ready to Download)'}
                    </label>

                    {mode === 'text' ? (
                        <div className="relative group">
                            <textarea
                                readOnly
                                value={cloaked}
                                className="w-full h-32 bg-gray-950 border border-green-900/50 rounded-lg p-3 text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-sm font-mono"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-300 transition-colors border border-gray-700 shadow-sm"
                                title="Copy to Clipboard"
                            >
                                {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <div className="absolute bottom-2 right-2 text-xs text-gray-600">
                                + {zwcCount} hidden chars
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-950 border border-green-900/50 rounded-lg p-4 flex flex-col items-center gap-4">
                            <img src={cloaked} alt="Stego Result" className="max-h-64 object-contain rounded border border-gray-800" />
                            <button
                                onClick={downloadImage}
                                className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors shadow-lg shadow-green-900/20"
                            >
                                <Download size={18} /> Download Image
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HideTab;
