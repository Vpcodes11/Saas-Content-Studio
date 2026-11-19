import mammoth from 'mammoth';
import { extractText } from 'unpdf';

export interface DocumentExtractResult {
  filename: string;
  fileType: 'pdf' | 'docx' | 'md' | 'txt' | 'other';
  title: string;
  textContent: string;
  wordCount: number;
}

export async function extractDocumentContent(
  filename: string,
  buffer: Buffer
): Promise<DocumentExtractResult> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  let textContent = '';
  let fileType: DocumentExtractResult['fileType'] = 'other';

  if (ext === 'pdf') {
    fileType = 'pdf';
    try {
      const uint8 = new Uint8Array(buffer);
      const parsed = await extractText(uint8);
      // unpdf returns { text: string[], totalPages: number }
      textContent = Array.isArray(parsed.text) ? parsed.text.join('\n\n') : String(parsed.text || '');
    } catch (err: any) {
      throw new Error(`Failed parsing PDF "${filename}": ${err.message}`);
    }
  } else if (ext === 'docx') {
    fileType = 'docx';
    try {
      const parsed = await mammoth.extractRawText({ buffer });
      textContent = parsed.value || '';
    } catch (err: any) {
      throw new Error(`Failed parsing DOCX "${filename}": ${err.message}`);
    }
  } else if (ext === 'md' || ext === 'markdown') {
    fileType = 'md';
    textContent = buffer.toString('utf-8');
  } else if (ext === 'txt') {
    fileType = 'txt';
    textContent = buffer.toString('utf-8');
  } else {
    // Default fallback to UTF-8 text
    textContent = buffer.toString('utf-8');
  }

  const cleanText = textContent.trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

  return {
    filename,
    fileType,
    title: filename.replace(/\.[^/.]+$/, ''),
    textContent: cleanText,
    wordCount,
  };
}
