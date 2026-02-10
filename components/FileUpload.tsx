import React, { useCallback, useState } from 'react';
import { Upload, FileVideo, AlertCircle } from 'lucide-react';
import { UploadedFile } from '../types';
import { MAX_PREVIEW_SIZE } from '../constants';

interface FileUploadProps {
  onFileSelected: (fileData: UploadedFile) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    
    // Check if video or audio
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      setError("Please upload a valid video or audio file.");
      return;
    }

    // Only create a preview URL if the file is small enough to avoid OOM
    // For large files (e.g. 2GB), creating a blob URL can crash the browser
    const previewUrl = file.size <= MAX_PREVIEW_SIZE ? URL.createObjectURL(file) : '';

    // Directly pass the file object without reading into memory (supports 2GB+)
    onFileSelected({
      file,
      previewUrl,
      type: file.type.startsWith('video/') ? 'video' : 'audio',
      mimeType: file.type,
      size: file.size
    });
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div 
      className={`relative w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out
        ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400 hover:bg-slate-800'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleFileInput}
        accept="video/*,audio/*"
        disabled={disabled}
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">
          Upload Video or Audio
        </h3>
        <p className="text-slate-400 max-w-sm mb-4">
          Drag & drop or click to browse. Supports large files (up to 2GB) for analysis.
        </p>
        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        <div className="mt-4 flex gap-4 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1"><FileVideo className="w-3 h-3" /> MP4, MOV, WEBM</span>
        </div>
      </div>
    </div>
  );
};