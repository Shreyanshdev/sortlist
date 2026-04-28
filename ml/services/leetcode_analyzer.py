import httpx
import math
import re
import asyncio
from datetime import datetime
from typing import Optional, Dict

LEETCODE_GQL = "https://leetcode.com/graphql"

PROFILE_QUERY = """
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    submitStats {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    profile {
      ranking
      reputation
      starRating
    }
    userCalendar {
      streak
      totalActiveDays
    }
  }
}
"""

class LeetCodeAnalyzer:

    def __init__(self):
        self._cache = {}

    def extract_username(self, url: str) -> Optional[str]:
        match = re.search(r'leetcode\.com/(?:u/)?([A-Za-z0-9_-]+)(?:/|$)', url)
        return match.group(1) if match else None

    async def analyze(self, lc_url: str) -> Dict:
        username = self.extract_username(lc_url)
        if not username:
            return {'score': None, 'error': 'Invalid LeetCode URL'}

        # ── Caching Logic ──────────────────────────────────────────────────
        now_ts = datetime.now().timestamp()
        if username in self._cache:
            entry = self._cache[username]
            if now_ts - entry['ts'] < 86400:  # 24 hour cache
                print(f"[LeetCode] Using cached result for {username}")
                return entry['data']

        try:
            # Respect LeetCode by adding a small delay to avoid aggressive scraping patterns
            await asyncio.sleep(0.5)

            async with httpx.AsyncClient(timeout=12.0) as client:
                resp = await client.post(
                    LEETCODE_GQL,
                    json={"query": PROFILE_QUERY, "variables": {"username": username}},
                    headers={
                        "Content-Type": "application/json",
                        "Referer": "https://leetcode.com",
                        "Origin":  "https://leetcode.com"
                    }
                )

                if resp.status_code != 200:
                    return {'score': None, 'error': f'LeetCode returned {resp.status_code}'}

                data = resp.json()

                if 'errors' in data:
                    return {'score': None, 'error': data['errors'][0].get('message', 'GraphQL error')}

                user = data.get('data', {}).get('matchedUser')
                if not user:
                    return {'score': None, 'error': f'User {username} not found or profile is private'}

        except httpx.TimeoutException:
            return {'score': None, 'error': 'LeetCode API timeout'}
        except httpx.ConnectError:
            return {'score': None, 'error': 'LeetCode API connection failed — service may be unreachable'}
        except Exception as e:
            # Catch-all: DNS errors, SSL, JSON decode, anything unexpected
            print(f"[LeetCode] Unexpected error for {username}: {e}")
            return {'score': None, 'error': f'LeetCode analysis failed: {str(e)}'}

        result = self._compute_score(user, username)
        
        # Save to cache
        self._cache[username] = {'ts': now_ts, 'data': result}
        return result

    def _compute_score(self, user: Dict, username: str) -> Dict:
        stats = user.get('submitStats', {}).get('acSubmissionNum', [])
        counts = {entry['difficulty']: entry['count'] for entry in stats}

        easy   = counts.get('Easy',   0)
        medium = counts.get('Medium', 0)
        hard   = counts.get('Hard',   0)

        raw_points  = easy * 1 + medium * 3 + hard * 5
        solve_score = min(math.log1p(raw_points) / math.log1p(500), 1.0)

        ranking    = user.get('profile', {}).get('ranking', 999999) or 999999
        rank_score = max(0.0, 1.0 - ranking / 500000)

        calendar     = user.get('userCalendar') or {}
        streak       = calendar.get('streak', 0) or 0
        streak_score = min(streak / 30, 1.0)

        final = 0.70 * solve_score + 0.20 * rank_score + 0.10 * streak_score

        return {
            'score': round(final, 4),
            'breakdown': {
                'easy_solved':   easy,
                'medium_solved': medium,
                'hard_solved':   hard,
                'raw_points':    raw_points,
                'solve_score':   round(solve_score, 4),
                'ranking':       ranking,
                'rank_score':    round(rank_score, 4),
                'streak':        streak,
                'streak_score':  round(streak_score, 4)
            },
            'meta': { 'username': username }
        }

leetcode_analyzer = LeetCodeAnalyzer()
