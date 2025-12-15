import { useState } from 'react';
import { Lock, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { hideMessage } from '../core/service';

const HideTab: React.FC = () => {
    const [secret, setSecret] = useState('');
    const [cover, setCover] = useState('');
    const [password, setPassword] = useState('');
    const [cloaked, setCloaked] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Metrics
    const secretSize = new Blob([secret]).size;
    const zwcCount = cloaked ? cloaked.length - cover.length : 0;

    const handleHide = async () => {
        setError(null);
        setCloaked('');

        if (!secret || !password) {
            setError('Please provide secret text and a password.');
            return;
        }

        setLoading(true);
        try {
            // Use cover text if provided, else use a default space/invisible holder
            // Actually prompt implies "cover message" is an input.
            const finalCover = cover || 'This is a cover message.';

            const result = await hideMessage(secret, finalCover, password);
            setCloaked(result);
        } catch (err: any) {
            setError(err.message || 'An error occurred while hiding the message.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(cloaked);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-300">Cover Message (Public)</label>
                <textarea
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    className="w-full h-24 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm"
                    placeholder="Enter a boring text to hide the secret in..."
                />
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
                    <label className="block text-sm font-medium text-green-400">Cloaked Message (Ready to Copy)</label>
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
                </div>
            )}
        </div>
    );
};

export default HideTab;
