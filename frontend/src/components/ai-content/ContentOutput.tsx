"use client";

import { useState } from "react";

interface Props {
  result: string;
  loading: boolean;
  language: string;
  contentType: string;
  platform: string;
  tone: string;
  onRegenerate: () => void;
}

export default function ContentOutput({ result, loading, language, contentType, platform, tone, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 min-h-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-200">Generated Content</h3>
        {result && (
          <div className="flex gap-2">
            <button type="button" onClick={handleCopy}
              className="text-xs bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 px-3 py-1.5 rounded-lg transition-all">
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button type="button"
              className="text-xs bg-green-600/20 hover:bg-green-600/40 border border-green-500/30 text-green-300 px-3 py-1.5 rounded-lg transition-all">
              🚀 Publish
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center animate-pulse text-2xl">🤖</div>
          <div className="text-sm text-gray-400">AI is generating your {language} content...</div>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      ) : result ? (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="text-xs bg-violet-500/15 border border-violet-500/30 text-violet-300 px-2 py-1 rounded-lg">{contentType}</span>
            <span className="text-xs bg-pink-500/15 border border-pink-500/30 text-pink-300 px-2 py-1 rounded-lg">{language}</span>
            <span className="text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-1 rounded-lg">{platform}</span>
            <span className="text-xs bg-green-500/15 border border-green-500/30 text-green-300 px-2 py-1 rounded-lg">{tone}</span>
          </div>
          <div className="bg-[#0a0a14] border border-white/10 rounded-xl p-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={onRegenerate} className="text-xs text-gray-400 hover:text-white transition-colors">🔄 Regenerate</button>
            <span className="text-gray-600">·</span>
            <button type="button" className="text-xs text-gray-400 hover:text-white transition-colors">✏️ Edit</button>
            <span className="text-gray-600">·</span>
            <button type="button" className="text-xs text-gray-400 hover:text-white transition-colors">💾 Save</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <div className="text-5xl opacity-30">🤖</div>
          <div className="text-sm text-gray-500">
            Fill in the form and click<br />
            <strong className="text-gray-400">Generate Content</strong> to get started
          </div>
        </div>
      )}
    </div>
  );
}