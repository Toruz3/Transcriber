import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { AudioRecorder } from './components/AudioRecorder';
import { TranscriptionView } from './components/TranscriptionView';
import { transcribeMedia } from './services/geminiService';
import { AppState, UploadedFile } from './types';
import { MAX_PREVIEW_SIZE } from './constants';
import { Sparkles, Play, RotateCcw, Zap, BrainCircuit, Info, CloudUpload, MonitorPlay } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Gemini 3 Pro supports large thinking context for complex tasks
  const isComplexModel = uploadedFile?.type === 'video';

  // Prevent memory leaks by revoking object URLs
  useEffect(() => {
    return () => {
      if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }
    };
  }, [uploadedFile]);

  const handleFileSelected = (fileData: UploadedFile) => {
    // Revoke previous URL if exists
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(fileData);
    setAppState(AppState.IDLE); 
    setUploadProgress(0);
  };

  const handleReset = () => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setUploadedFile(null);
    setTranscription('');
    setAppState(AppState.IDLE);
    setUploadProgress(0);
    setError(null);
  };

  const startTranscription = async () => {
    if (!uploadedFile) return;

    setAppState(AppState.UPLOADING); 
    setUploadProgress(0);
    setError(null);

    try {
      // 2. Transcribe (includes chunked upload)
      const result = await transcribeMedia(
        uploadedFile.file,
        uploadedFile.mimeType,
        isComplexModel,
        (progress) => setUploadProgress(progress)
      );
      
      setTranscription(result);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during transcription.");
      setAppState(AppState.ERROR);
    }
  };

  const shouldShowVideoPreview = uploadedFile?.type === 'video' && uploadedFile.size < MAX_PREVIEW_SIZE;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-400" />
              HyperScriber Pro
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Video & Audio transcription with Math/LaTeX Intelligence
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Gemini 3 Pro Enabled
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Input Area */}
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-200">Input Source</h2>
                {uploadedFile && (
                  <button 
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>
              
              {!uploadedFile ? (
                <div className="space-y-4">
                  <FileUpload 
                    onFileSelected={handleFileSelected} 
                    disabled={appState === AppState.PROCESSING || appState === AppState.UPLOADING} 
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-900 text-slate-500">Or record instantly</span>
                    </div>
                  </div>
                  <AudioRecorder 
                    onRecordingComplete={handleFileSelected}
                    disabled={appState === AppState.PROCESSING || appState === AppState.UPLOADING}
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="rounded-xl overflow-hidden bg-black border border-slate-800 relative aspect-video group flex items-center justify-center">
                    {uploadedFile.type === 'video' ? (
                      shouldShowVideoPreview ? (
                        <video 
                          src={uploadedFile.previewUrl} 
                          className="w-full h-full object-contain" 
                          controls 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
                          <MonitorPlay className="w-12 h-12 text-slate-600" />
                          <div>
                            <p className="text-slate-300 font-medium">Preview Unavailable</p>
                            <p className="text-slate-500 text-xs mt-1 max-w-[200px]">
                              Video is too large ({(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB) to preview in-browser, but is ready for analysis.
                            </p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
                          <Zap className="w-10 h-10 text-indigo-400" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-mono border border-white/10">
                      {uploadedFile.type.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-indigo-200 text-sm">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      {uploadedFile.type === 'video' 
                        ? 'Gemini 3 Pro Thinking Mode active for complex formula extraction.' 
                        : 'Gemini 3 Flash optimized for fast speech-to-text.'}
                    </span>
                  </div>

                  <button
                    onClick={startTranscription}
                    disabled={appState === AppState.PROCESSING || appState === AppState.UPLOADING}
                    className={`
                      w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden
                      ${appState === AppState.PROCESSING || appState === AppState.UPLOADING
                        ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-500/25'}
                    `}
                  >
                    {/* Progress Bar Background */}
                    {appState === AppState.UPLOADING && (
                      <div 
                        className="absolute inset-0 bg-indigo-900/50 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    )}

                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {appState === AppState.UPLOADING ? (
                        <>
                          <CloudUpload className="w-6 h-6 animate-bounce" />
                          Uploading {uploadProgress}%
                        </>
                      ) : appState === AppState.PROCESSING ? (
                        <>
                          <BrainCircuit className="w-6 h-6 animate-pulse" />
                          Thinking & Transcribing...
                        </>
                      ) : (
                        <>
                          <Play className="w-6 h-6 fill-current" />
                          Start Analysis
                        </>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-900/50 rounded-xl text-red-300 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {/* Guidelines */}
            <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/50">
               <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Capabilities</h3>
               <ul className="space-y-3 text-sm text-slate-500">
                 <li className="flex items-center gap-2">
                   <Zap className="w-4 h-4 text-yellow-500" />
                   <span>Supports large video files (up to 2GB via API limits)</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <span className="font-serif italic text-indigo-400 px-1">E=mc²</span>
                   <span>Automatic LaTeX formatting for formulas</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <BrainCircuit className="w-4 h-4 text-cyan-500" />
                   <span>Thinking mode for high accuracy scientific content</span>
                 </li>
               </ul>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7 h-full">
            {(appState === AppState.PROCESSING || appState === AppState.UPLOADING) ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed animate-pulse">
                <div className="w-24 h-24 relative mb-6">
                   <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                   <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-medium text-slate-300">
                  {appState === AppState.UPLOADING ? 'Uploading Media' : 'Analyzing Content'}
                </h3>
                <p className="text-slate-500 mt-2">
                   {appState === AppState.UPLOADING ? 'Sending chunks to Gemini servers...' : 'Extracting speech and formatting formulas...'}
                </p>
                <div className="mt-8 flex gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-0"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                </div>
              </div>
            ) : transcription ? (
              <TranscriptionView markdown={transcription} />
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                <div className="p-6 bg-slate-800/50 rounded-2xl mb-4 rotate-12">
                  <span className="text-4xl">📝</span>
                </div>
                <p className="text-slate-500 font-medium">Transcription will appear here</p>
                <p className="text-slate-600 text-sm mt-2 max-w-xs text-center">
                  Upload a video with mathematical lectures to see the LaTeX formatting in action.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
