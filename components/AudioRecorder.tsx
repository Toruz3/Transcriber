import React, { useState, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import { UploadedFile } from '../types';
import { MAX_PREVIEW_SIZE } from '../constants';

interface AudioRecorderProps {
  onRecordingComplete: (fileData: UploadedFile) => void;
  disabled: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        
        // Safety check, though audio recordings are rarely > 100MB
        const previewUrl = file.size <= MAX_PREVIEW_SIZE ? URL.createObjectURL(file) : '';

        onRecordingComplete({
          file,
          previewUrl,
          type: 'audio',
          mimeType: 'audio/webm',
          size: file.size
        });
        setIsRecording(false);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-xl w-full font-medium transition-all
        ${isRecording 
          ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
          : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:border-slate-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {isRecording ? (
        <>
          <Square className="w-5 h-5 fill-current" />
          <span>Stop Recording</span>
          <span className="relative flex h-3 w-3 ml-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
          <span>Record Audio Note</span>
        </>
      )}
    </button>
  );
};