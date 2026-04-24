import fitz  # PyMuPDF
import docx
import io
import re

class Parser:
    def parse(self, file_bytes: bytes, ext: str):
        if ext == 'pdf':
            text = self._parse_pdf(file_bytes)
        elif ext == 'docx':
            text = self._parse_docx(file_bytes)
        else:
            raise ValueError(f"Unsupported extension: {ext}")
            
        sections = self._extract_sections(text)
        sentences = self._split_into_sentences(text)
        
        return {
            "rawText": text,
            "sections": sections,
            "sentences": sentences
        }
        
    def _parse_pdf(self, file_bytes: bytes) -> str:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text

    def _parse_docx(self, file_bytes: bytes) -> str:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([p.text for p in doc.paragraphs])
        return text
        
    def _extract_sections(self, text: str) -> dict:
        # A simple regex-based heuristic section extractor
        sections = {
            "summary": "",
            "skills": "",
            "experience": "",
            "education": "",
            "projects": "",
            "certifications": "",
            "other": ""
        }
        
        current_section = "other"
        lines = text.split('\n')
        
        for line in lines:
            line_clean = line.strip().lower()
            if not line_clean:
                continue
                
            if re.match(r'^(summary|profile|about me)', line_clean):
                current_section = "summary"
            elif re.match(r'^(skills|technologies|core competencies)', line_clean):
                current_section = "skills"
            elif re.match(r'^(experience|employment|work history|professional experience)', line_clean):
                current_section = "experience"
            elif re.match(r'^(education|academic background)', line_clean):
                current_section = "education"
            elif re.match(r'^(projects|personal projects)', line_clean):
                current_section = "projects"
            elif re.match(r'^(certifications|licenses)', line_clean):
                current_section = "certifications"
            else:
                sections[current_section] += line + "\n"
                
        return sections

    def _split_into_sentences(self, text: str) -> list:
        # Simple heuristic split on punctuation
        sentences = re.split(r'(?<=[.!?]) +', text.replace('\n', ' '))
        return [s.strip() for s in sentences if len(s.strip()) > 5]

parser = Parser()
