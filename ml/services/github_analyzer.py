import httpx
import math
import re
from datetime import datetime, timezone
from typing import Optional, Dict, List
import asyncio
import os
import numpy as np

from services.embedder import embedder

GITHUB_API = "https://api.github.com"

class GitHubAnalyzer:

    def __init__(self, token: Optional[str] = None):
        self.headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
        self._cache = {}

    def extract_username(self, url: str) -> Optional[str]:
        match = re.search(r'github\.com/([A-Za-z0-9_.-]+)(?:/|$)', url)
        return match.group(1) if match else None

    async def analyze(self, github_url: str, job_criteria: List[Dict]) -> Dict:
        username = self.extract_username(github_url)
        if not username:
            return {'score': None, 'error': 'Invalid GitHub URL'}

        # ── Caching Logic ──────────────────────────────────────────────────
        now_ts = datetime.now().timestamp()
        if username in self._cache:
            entry = self._cache[username]
            if now_ts - entry['ts'] < 3600:  # 1 hour cache
                print(f"[GitHub] Using cached result for {username}")
                return entry['data']

        try:
            async with httpx.AsyncClient(timeout=10.0, headers=self.headers) as client:
                user_resp, repos_resp = await asyncio.gather(
                    client.get(f"{GITHUB_API}/users/{username}"),
                    client.get(f"{GITHUB_API}/users/{username}/repos",
                               params={"sort": "updated", "per_page": 30, "type": "owner"})
                )

                if user_resp.status_code == 404:
                    return {'score': None, 'error': f'GitHub user not found: {username}'}
                if user_resp.status_code == 403:
                    limit_reset = user_resp.headers.get("X-RateLimit-Reset")
                    print(f"[GitHub] Rate limit hit. Resets at {limit_reset}")
                    return {'score': None, 'error': 'GitHub API rate limit hit'}

                user_data = user_resp.json()
                repos     = repos_resp.json() if repos_resp.status_code == 200 else []

        except httpx.TimeoutException:
            return {'score': None, 'error': 'GitHub API timeout'}
        except Exception as e:
            print(f"[GitHub] Error fetching {username}: {str(e)}")
            return {'score': None, 'error': str(e)}

        relevance = self._compute_relevance(repos, job_criteria)
        activity  = self._compute_activity(repos)
        quality   = self._compute_quality(repos)

        final = 0.5 * relevance + 0.3 * activity + 0.2 * quality
        
        result = {
            'score': round(min(final, 1.0), 4),
            'breakdown': {
                'relevance': round(relevance, 4),
                'activity':  round(activity, 4),
                'quality':   round(quality, 4)
            },
            'meta': {
                'username':     username,
                'public_repos': user_data.get('public_repos', 0),
                'followers':    user_data.get('followers', 0),
                'top_languages': self._top_languages(repos)[:5]
            }
        }

        # Save to cache
        self._cache[username] = {'ts': now_ts, 'data': result}
        return result

    def _compute_relevance(self, repos: List[Dict], criteria: List[Dict]) -> float:
        if not repos or not criteria:
            return 0.0

        repo_texts = [
            f"{r.get('name','')} {r.get('description','')} {' '.join(r.get('topics',[]))}"
            for r in repos
        ]
        repo_texts = [t.strip() for t in repo_texts if t.strip()]
        if not repo_texts:
            return 0.0

        repo_embeddings = embedder.embed_batch(repo_texts)
        scores = []
        for c in criteria:
            crit_emb = embedder.embed(c.get('description') or c['label'])
            sims = [float(np.dot(crit_emb, re) / (np.linalg.norm(crit_emb) * np.linalg.norm(re) or 1)) for re in repo_embeddings]
            scores.append(max(sims) if sims else 0.0)

        return sum(scores) / len(scores)

    def _compute_activity(self, repos: List[Dict]) -> float:
        if not repos: return 0.0
        now = datetime.now(timezone.utc)
        scores = []
        for r in repos[:10]:
            upd = r.get('updated_at')
            if not upd: continue
            days = (now - datetime.fromisoformat(upd.replace('Z','+00:00'))).days
            if   days < 30:  scores.append(1.0)
            elif days < 90:  scores.append(0.7)
            elif days < 180: scores.append(0.4)
            elif days < 365: scores.append(0.2)
            else:            scores.append(0.0)
        return sum(scores) / len(scores) if scores else 0.0

    def _compute_quality(self, repos: List[Dict]) -> float:
        if not repos: return 0.0
        stars = sum(r.get('stargazers_count', 0) for r in repos)
        forks = sum(r.get('forks_count', 0) for r in repos)
        count = len(repos)
        return (
            0.5 * min(math.log1p(stars) / math.log1p(100), 1.0) +
            0.3 * min(math.log1p(forks) / math.log1p(50),  1.0) +
            0.2 * min(count / 20, 1.0)
        )

    def _top_languages(self, repos: List[Dict]) -> List[str]:
        from collections import Counter
        langs = [r.get('language') for r in repos if r.get('language')]
        return [l for l, _ in Counter(langs).most_common()]

github_analyzer = GitHubAnalyzer(token=os.getenv('GITHUB_TOKEN'))
