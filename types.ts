export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING', // Thinking/Generating
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface TranscriptionResult {
  text: string;
  usage?: {
    totalTokens: number;
  };
}

export type FileType = 'video' | 'audio';

export interface UploadedFile {
  file: File;
  previewUrl: string;
  type: FileType;
  mimeType: string;
  size: number;
}
