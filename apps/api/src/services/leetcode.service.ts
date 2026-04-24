import axios from 'axios';

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SECRET = process.env.ML_SERVICE_SECRET || 'dev_secret';

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 60000,
  headers: { 'X-Internal-Secret': ML_SECRET }
});

export class LeetCodeService {
  static async analyze(leetcodeUrl: string) {
    try {
      const { data } = await mlClient.post('/leetcode/analyze', { url: leetcodeUrl });
      return data as { score: number | null; error?: string };
    } catch (err) {
      console.error('LeetCode analysis failed', err);
      return { score: null };
    }
  }
}
