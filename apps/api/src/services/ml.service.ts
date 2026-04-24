import axios from 'axios';

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SECRET = process.env.ML_SERVICE_SECRET || 'dev_secret';

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 120000,
  headers: { 'X-Internal-Secret': ML_SECRET }
});

export class MLService {

  /**
   * Parse a resume by sending the file bytes (base64) directly.
   * The backend downloads the file from Cloudinary and forwards it.
   */
  static async parseResume(fileBase64: string, ext: 'pdf' | 'docx') {
    const { data } = await mlClient.post('/parse', {
      file_base64: fileBase64,
      file_type: ext
    });
    return data as {
      rawText: string;
      sections: Record<string, string>;
      sentences: string[];
    };
  }

  static async scoreResume(payload: {
    s3Key: string;
    parsedSections: Record<string, string>;
    sentences: string[];
    criteria: Array<{ id: string; label: string; weight: number; description?: string }>;
    githubScore: number | null;
    leetcodeScore: number | null;
  }) {
    const { data } = await mlClient.post('/score', payload);
    return data as {
      resume_score: number;
      final_score: number;
      criteria_scores: Record<string, {
        score: number;
        rawSimilarity: number;
        matchedSentence: string;
        matchedSection: string;
        confidence: number;
        weight: number;
      }>;
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      explanation: string;
    };
  }

  static async precomputeCriteriaEmbeddings(
    criteria: Array<{ id: string; label: string; description?: string }>
  ) {
    mlClient.post('/embed/batch', {
      texts: criteria.map(c => c.description ?? c.label)
    }).catch((err: any) => console.warn('Criteria precompute failed:', err.message));
  }
}
