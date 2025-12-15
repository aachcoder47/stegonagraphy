import { useState } from 'react';
import { Lock, Unlock, AlertTriangle } from 'lucide-react';
import { revealMessage } from '../core/service';

const RevealTab: React.FC = () => {
    const [cloakedText, setCloakedText] = useState('');
    const [password, setPassword] = useState('');
    const [revealed, setRevealed] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReveal = async () => {
        setError(null);
        setRevealed('');

        if (!cloakedText || !password) {
            setError('Please allow paste the cloaked text and enter the password.');
            return;
        }

        setLoading(true);
        try {
            const result = await revealMessage(cloakedText, password);
            // Wait a bit to show loading state (optional UX feel)
            // await new Promise(r => setTimeout(r, 500)); 
            setRevealed(result);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to reveal. Password might be wrong or message tampered.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Cloaked Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Cloaked Message</label>
                <textarea
                    value={cloakedText}
                    onChange={(e) => setCloakedText(e.target.value)}
                    className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm font-mono"
                    placeholder="Paste the text containing hidden message here..."
                />
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
                        <textarea
                            readOnly
                            value={revealed}
                            className="w-full h-40 bg-gray-950 border border-cyan-900/50 rounded-lg p-4 text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 text-base leading-relaxed"
                        />
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
