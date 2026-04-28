import axios from 'axios';

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SECRET = process.env.ML_SERVICE_SECRET || 'dev_secret';

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 60000,
  headers: { 'X-Internal-Secret': ML_SECRET }
});

interface LeetCodeAnalysisResult {
  score: number | null;
  breakdown?: {
    easy_solved: number; medium_solved: number; hard_solved: number;
    ranking: number; streak: number; solve_score: number; rank_score: number;
  };
  error?: string;
}

export class LeetCodeService {
  static async analyze(leetcodeUrl: string): Promise<LeetCodeAnalysisResult> {
    try {
      const { data } = await mlClient.post('/leetcode/analyze', { url: leetcodeUrl });
      return data as LeetCodeAnalysisResult;
    } catch (err) {
      console.error('LeetCode analysis failed', err);
      return { score: null };
    }
  }
}
