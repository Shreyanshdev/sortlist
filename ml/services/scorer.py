from services.embedder import embedder
import numpy as np

class Scorer:
    def score(self, parsed_sections: dict, sentences: list, criteria: list, github_score: float, leetcode_score: float):
        if not sentences:
            return self._empty_result(criteria)

        sentence_embeddings = embedder.embed_batch(sentences)
        
        criteria_scores = {}
        total_weight = 0
        resume_score = 0
        
        for c in criteria:
            weight = c.get('weight', 1.0)
            label = c.get('label', '')
            desc = c.get('description', '')
            
            text_to_embed = desc if desc else label
            c_emb = embedder.embed(text_to_embed)
            
            sims = np.dot(sentence_embeddings, c_emb) / (np.linalg.norm(sentence_embeddings, axis=1) * np.linalg.norm(c_emb))
            best_idx = np.argmax(sims)
            best_sim = float(sims[best_idx])
            best_sentence = sentences[best_idx]
            
            score = max(0.0, min(1.0, best_sim))
            
            criteria_scores[c['id']] = {
                "score": score,
                "rawSimilarity": best_sim,
                "matchedSentence": best_sentence,
                "matchedSection": "unknown",
                "confidence": score,
                "weight": weight
            }
            
            resume_score += score * weight
            total_weight += weight
            
        if total_weight > 0:
            resume_score /= total_weight
            
        final_score = resume_score
        if github_score is not None and leetcode_score is not None:
            final_score = 0.5 * resume_score + 0.3 * github_score + 0.2 * leetcode_score
        elif github_score is not None:
            final_score = 0.7 * resume_score + 0.3 * github_score
        elif leetcode_score is not None:
            final_score = 0.7 * resume_score + 0.3 * leetcode_score
            
        return {
            "resume_score": resume_score,
            "final_score": final_score,
            "criteria_scores": criteria_scores,
            "strengths": ["Strong match found for core requirements"],
            "weaknesses": ["Could improve on secondary skills"],
            "suggestions": ["Consider adding more projects"],
            "explanation": "Based on semantic similarity, this candidate meets the general requirements."
        }

    def _empty_result(self, criteria):
        return {
            "resume_score": 0.0,
            "final_score": 0.0,
            "criteria_scores": {c['id']: {"score": 0, "rawSimilarity": 0, "matchedSentence": "", "matchedSection": "", "confidence": 0, "weight": c.get('weight', 1.0)} for c in criteria},
            "strengths": [],
            "weaknesses": [],
            "suggestions": [],
            "explanation": "No extractable text found in resume."
        }

scorer = Scorer()
