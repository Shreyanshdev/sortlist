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
        scored_criteria = []  # Track for explanation generation
        
        for c in criteria:
            weight = c.get('weight', 1.0)
            label = c.get('label', '')
            desc = c.get('description', '')
            
            text_to_embed = desc if desc else label
            c_emb = embedder.embed(text_to_embed)
            
            norms = np.linalg.norm(sentence_embeddings, axis=1) * np.linalg.norm(c_emb)
            # Avoid division by zero
            norms = np.where(norms == 0, 1e-10, norms)
            sims = np.dot(sentence_embeddings, c_emb) / norms
            best_idx = int(np.argmax(sims))
            best_sim = float(sims[best_idx])
            best_sentence = sentences[best_idx]
            
            score = max(0.0, min(1.0, best_sim))
            
            criteria_scores[c['id']] = {
                "score": score,
                "rawSimilarity": best_sim,
                "matchedSentence": best_sentence,
                "matchedSection": self._find_section(best_sentence, parsed_sections),
                "confidence": score,
                "weight": weight
            }
            
            scored_criteria.append({
                "label": label,
                "score": score,
                "weight": weight,
                "matchedSentence": best_sentence
            })
            
            resume_score += score * weight
            total_weight += weight
            
        if total_weight > 0:
            resume_score /= total_weight
            
        final_score = resume_score
        weight_breakdown = "Resume: 100%"
        if github_score is not None and leetcode_score is not None:
            final_score = 0.5 * resume_score + 0.3 * github_score + 0.2 * leetcode_score
            weight_breakdown = "Resume: 50% + GitHub: 30% + LeetCode: 20%"
        elif github_score is not None:
            final_score = 0.7 * resume_score + 0.3 * github_score
            weight_breakdown = "Resume: 70% + GitHub: 30%"
        elif leetcode_score is not None:
            final_score = 0.7 * resume_score + 0.3 * leetcode_score
            weight_breakdown = "Resume: 70% + LeetCode: 30%"

        # Generate real per-candidate explanations
        strengths, weaknesses, suggestions = self._generate_feedback(scored_criteria)
        explanation = self._generate_explanation(scored_criteria, resume_score, github_score, leetcode_score, final_score, weight_breakdown)
            
        return {
            "resume_score": resume_score,
            "final_score": final_score,
            "criteria_scores": criteria_scores,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "suggestions": suggestions,
            "explanation": explanation
        }

    def _find_section(self, sentence: str, sections: dict) -> str:
        """Find which resume section a sentence belongs to."""
        for section_name, section_text in sections.items():
            if sentence.strip() in section_text:
                return section_name
        return "general"

    def _generate_feedback(self, scored_criteria: list):
        """Generate real strengths, weaknesses, and suggestions from per-criteria scores."""
        # Sort by score descending
        sorted_criteria = sorted(scored_criteria, key=lambda x: x['score'], reverse=True)
        
        strengths = []
        weaknesses = []
        suggestions = []
        
        for c in sorted_criteria:
            label = c['label']
            score = c['score']
            matched = c['matchedSentence']
            
            if score >= 0.65:
                # Truncate matched sentence for display
                snippet = matched[:80] + "..." if len(matched) > 80 else matched
                strengths.append(f"{label} — strong match ({int(score*100)}%): \"{snippet}\"")
            elif score >= 0.40:
                weaknesses.append(f"{label} — partial match ({int(score*100)}%), could be stronger")
                suggestions.append(f"Strengthen your {label} by adding specific examples or quantifiable achievements")
            else:
                weaknesses.append(f"{label} — weak match ({int(score*100)}%), not clearly demonstrated")
                suggestions.append(f"Add concrete experience or projects demonstrating {label}")
        
        # Ensure we always have at least something
        if not strengths:
            strengths.append("Resume was parsed successfully but no strong criteria matches were found")
        if not suggestions:
            suggestions.append("Consider tailoring your resume to highlight the specific skills this role requires")
            
        return strengths[:5], weaknesses[:5], suggestions[:5]

    def _generate_explanation(self, scored_criteria, resume_score, github_score, leetcode_score, final_score, weight_breakdown):
        """Generate a natural-language explanation of the composite score."""
        parts = []
        parts.append(f"Composite score: {final_score:.0%} (Weighting: {weight_breakdown}).")
        parts.append(f"Resume semantic score: {resume_score:.0%}.")
        
        if github_score is not None:
            parts.append(f"GitHub activity score: {github_score:.0%}.")
        if leetcode_score is not None:
            parts.append(f"LeetCode score: {leetcode_score:.0%}.")
        
        # Summarize top criteria
        top = sorted(scored_criteria, key=lambda x: x['score'] * x['weight'], reverse=True)
        if top:
            best = top[0]
            parts.append(f"Strongest criterion: \"{best['label']}\" at {best['score']:.0%}.")
        if len(top) > 1:
            worst = top[-1]
            if worst['score'] < 0.5:
                parts.append(f"Weakest criterion: \"{worst['label']}\" at {worst['score']:.0%}.")
        
        return " ".join(parts)

    def _empty_result(self, criteria):
        return {
            "resume_score": 0.0,
            "final_score": 0.0,
            "criteria_scores": {c['id']: {"score": 0, "rawSimilarity": 0, "matchedSentence": "", "matchedSection": "", "confidence": 0, "weight": c.get('weight', 1.0)} for c in criteria},
            "strengths": [],
            "weaknesses": ["No extractable text found in the resume"],
            "suggestions": ["Please ensure your resume is a valid PDF or DOCX with selectable text, not a scanned image"],
            "explanation": "No extractable text found in resume. The file may be image-based or corrupted."
        }

scorer = Scorer()

