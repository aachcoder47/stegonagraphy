import { useState } from 'react';
import { Shield, Eye, EyeOff, Github } from 'lucide-react';
import HideTab from './components/HideTab';
import RevealTab from './components/RevealTab';

function App() {
  const [activeTab, setActiveTab] = useState<'hide' | 'reveal'>('hide');

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">

      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-xl shadow-indigo-500/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2 tracking-tight">
            StegCloak <span className="text-indigo-500">Clone</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Bank-grade client-side encryption hidden within invisible characters.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab('hide')}
              className={`flex-1 py-4 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 relative
                ${activeTab === 'hide' ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
              `}
            >
              <EyeOff className="w-4 h-4" />
              Hide
              {activeTab === 'hide' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('reveal')}
              className={`flex-1 py-4 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 relative
                ${activeTab === 'reveal' ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
              `}
            >
              <Eye className="w-4 h-4" />
              Reveal
              {activeTab === 'reveal' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 md:p-8">
            {activeTab === 'hide' ? (
              <HideTab />
            ) : (
              <RevealTab />
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600 flex items-center justify-center gap-4">
          <a href="#" className="hover:text-gray-400 transition-colors flex items-center gap-2 group">
            <Github className="w-4 h-4 opacity-50 group-hover:opacity-100" />
            Open Source
          </a>
          <span>•</span>
          <span>Zero Server Data</span>
          <span>•</span>
          <span>AES-256 + HMAC</span>
        </div>
      </div>
    </div>
  );
}

export default App;
