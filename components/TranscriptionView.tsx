import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, Download, BrainCircuit } from 'lucide-react';

interface TranscriptionViewProps {
  markdown: string;
}

export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ markdown }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-200">Transcription Result</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Download .md"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-slate-900/30">
        <div className="prose prose-invert prose-slate max-w-none prose-headings:text-indigo-300 prose-strong:text-indigo-200 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              // Custom components to ensure Tailwind styles apply correctly
              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
              h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6 border-b border-slate-800 pb-2" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5" {...props} />,
              code: ({node, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <code className={`${className} bg-slate-950 rounded px-1 py-0.5`} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-slate-800/50 text-indigo-200 rounded px-1.5 py-0.5 text-sm" {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
