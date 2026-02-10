// Modelli Gemini disponibili (aggiornati)
export const GEMINI_PRO_MODEL = 'gemini-2.0-flash-thinking-exp-01-21';
export const GEMINI_FLASH_MODEL = 'gemini-2.0-flash-exp';

export const MAX_FILE_SIZE_WARNING = 2 * 1024 * 1024 * 1024; // 2GB
export const MAX_PREVIEW_SIZE = 50 * 1024 * 1024; // 50MB per evitare OOM
export const UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks per l'upload

// Prompt ottimizzato per trascrizione verbatim e LaTeX
export const TRANSCRIPTION_PROMPT = `
You are a professional transcriber and mathematician. 
Your task is to provide a verbatim, word-for-word transcription of the provided media.

Rules:
1. Transcribe every word exactly as spoken.
2. If the speaker writes or mentions mathematical formulas, physics equations, or scientific notation, you MUST write them using valid LaTeX syntax enclosed in '$' for inline math or '$$' for block math.
3. Example: "The energy is equals to m c squared" should be transcribed as "The energy is $E=mc^2$".
4. Do not summarize. Do not leave out details.
5. Structure the output with appropriate paragraph breaks for readability.
`;