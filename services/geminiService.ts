import { GoogleGenAI } from "@google/genai";
import { TRANSCRIPTION_PROMPT, GEMINI_PRO_MODEL, GEMINI_FLASH_MODEL, UPLOAD_CHUNK_SIZE } from "../constants";

/**
 * Uploads a file to Gemini using the Resumable Upload protocol with Chunking.
 * Uses the 'X-Goog-Upload-Command' protocol (Unified Upload) which is native to this API.
 */
async function uploadToGemini(
  file: File, 
  apiKey: string, 
  onProgress: (percent: number) => void
): Promise<string> {
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
  const contentType = file.type || 'application/octet-stream';

  // 1. Initial Resumable Request (Start)
  const initRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': file.size.toString(),
      'X-Goog-Upload-Header-Content-Type': contentType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: file.name } }),
  });

  if (!initRes.ok) throw new Error(`Failed to initialize upload: ${initRes.statusText}`);

  let resumableUrl = initRes.headers.get('x-goog-upload-url');
  if (!resumableUrl) throw new Error("No upload URL received from Gemini API");

  // Fix: If the URL is relative, prepend the host. This fixes the 404 error.
  if (resumableUrl.startsWith('/')) {
    resumableUrl = `https://generativelanguage.googleapis.com${resumableUrl}`;
  }

  // Ensure API key is present in the resumable URL
  if (!resumableUrl.includes('key=')) {
    const separator = resumableUrl.includes('?') ? '&' : '?';
    resumableUrl += `${separator}key=${apiKey}`;
  }

  // 2. Upload in Chunks using X-Goog-Upload-Command
  let offset = 0;
  
  while (offset < file.size) {
    const chunkEnd = Math.min(offset + UPLOAD_CHUNK_SIZE, file.size);
    const chunk = file.slice(offset, chunkEnd);
    const isLastChunk = chunkEnd === file.size;

    // Use X-Goog-Upload-Command for robust chunk handling
    const command = isLastChunk ? 'upload, finalize' : 'upload';
    
    const headers: Record<string, string> = {
      'Content-Type': contentType, 
      'X-Goog-Upload-Offset': offset.toString(),
      'X-Goog-Upload-Command': command,
    };

    const uploadRes = await fetch(resumableUrl, {
      method: 'POST', // Use POST for Unified Resumable Protocol commands
      headers,
      body: chunk,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      throw new Error(`Upload failed at offset ${offset}: ${uploadRes.status} ${uploadRes.statusText} - ${errorText}`);
    }

    // Update progress
    offset = chunkEnd;
    const progress = Math.min(Math.round((offset / file.size) * 100), 99);
    onProgress(progress);

    // If finished, get the file URI
    if (isLastChunk) {
        const uploadData = await uploadRes.json();
        const fileUri = uploadData.file.uri;
        const fileName = uploadData.file.name;
        
        // 3. Poll for ACTIVE state
        let state = uploadData.file.state;
        while (state === 'PROCESSING') {
            // Wait 2 seconds before checking again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
            const checkData = await checkRes.json();
            state = checkData.state;
            
            if (state === 'FAILED') throw new Error("File processing failed on Gemini servers.");
        }
        
        return fileUri;
    }
  }

  throw new Error("Upload loop finished without returning URI");
}

export const transcribeMedia = async (
  file: File,
  mimeType: string,
  isComplex: boolean = true,
  onProgress: (percent: number) => void
): Promise<string> => {
  // Use API key from environment variable as required
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is not configured (process.env.API_KEY is missing)");
  }

  const safeMimeType = mimeType || file.type || 'application/octet-stream';

  // Step 1: Upload file to Gemini Storage with Progress
  // This supports large files (2GB+) by using chunked upload
  const fileUri = await uploadToGemini(file, apiKey, onProgress);

  // Set progress to 100% (Upload done, now thinking)
  onProgress(100);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use Pro with Thinking for Video/Complex tasks (formulas), Flash for simple audio
  const modelId = isComplex ? GEMINI_PRO_MODEL : GEMINI_FLASH_MODEL;

  const config: any = {
    systemInstruction: "You are an expert transcriber with deep knowledge of mathematical notation.",
  };

  // Enable Thinking for the Pro model to ensure high accuracy on formulas and long context
  // Only valid for Gemini 2.5 and 3 series
  if (isComplex) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            fileData: {
              mimeType: safeMimeType,
              fileUri: fileUri,
            },
          },
          {
            text: TRANSCRIPTION_PROMPT,
          },
        ],
      },
      config: config,
    });

    return response.text || "No transcription generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to transcribe media.");
  }
};