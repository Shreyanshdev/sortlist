import axios from 'axios';

const ML_BASE = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SECRET = process.env.ML_SERVICE_SECRET || 'dev_secret';

const mlClient = axios.create({
  baseURL: ML_BASE,
  timeout: 60000,
  headers: { 'X-Internal-Secret': ML_SECRET }
});

interface GitHubAnalysisResult {
  score: number | null;
  breakdown?: { relevance: number; activity: number; quality: number };
  meta?: { top_languages: string[]; public_repos: number; followers: number };
  error?: string;
}

export class GitHubService {
  static async analyze(githubUrl: string, criteria: any[]): Promise<GitHubAnalysisResult> {
    try {
      const { data } = await mlClient.post('/github/analyze', { url: githubUrl, criteria });
      return data as GitHubAnalysisResult;
    } catch (err) {
      console.error('GitHub analysis failed', err);
      return { score: null };
    }
  }
}
