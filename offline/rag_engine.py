import json
import re
import string
import sys
import logging
from difflib import SequenceMatcher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',
    handlers=[logging.StreamHandler(sys.stderr)]
)

class SentenceRAGEngine:
    def __init__(self, chunk_file='chat_with_pdf/sentence_chunks.jsonl'):
        self.chunk_file = chunk_file
        self.chunks = self.load_chunks()
        self.last_topic = None
        self.last_query = None

    def load_chunks(self):
        chunks = []
        try:
            with open(self.chunk_file, 'r', encoding='utf-8') as f:
                for line in f:
                    chunks.append(json.loads(line.strip()))
            logging.info(f"Loaded {len(chunks)} sentence chunks from {self.chunk_file}")
        except Exception as e:
            logging.error(f"Failed to load chunks from {self.chunk_file}: {e}")
        return chunks

    def tokenize(self, text):
        return set(text.lower().translate(str.maketrans('', '', string.punctuation)).split())

    def score_chunk(self, question_tokens, chunk):
        content_tokens = self.tokenize(chunk['content'])
        topic_tokens = self.tokenize(chunk['topic'])
        section_tokens = self.tokenize(chunk['section'])

        content_score = len(question_tokens & content_tokens) * 2.0
        topic_score = len(question_tokens & topic_tokens) * 1.5
        section_score = len(question_tokens & section_tokens) * 1.0

        content_fuzzy = SequenceMatcher(None, ' '.join(question_tokens), ' '.join(content_tokens)).ratio() * 1.0
        topic_fuzzy = SequenceMatcher(None, ' '.join(question_tokens), ' '.join(topic_tokens)).ratio() * 0.5

        total_score = content_score + topic_score + section_score + content_fuzzy + topic_fuzzy

        if self.last_topic and chunk['topic'] == self.last_topic:
            total_score *= 1.2

        return total_score

    def get_best_matching_topic(self, question):
        question_tokens = self.tokenize(question)
        best_topic = None
        best_score = 0
        seen_topics = set()

        for chunk in self.chunks:
            topic = chunk.get("topic", "Unknown")
            if topic in seen_topics:
                continue
            seen_topics.add(topic)

            topic_tokens = self.tokenize(topic)
            token_overlap = len(question_tokens & topic_tokens) * 1.5
            fuzzy_ratio = SequenceMatcher(None, question.lower(), topic.lower()).ratio() * 3.0
            total_score = token_overlap + fuzzy_ratio

            if total_score > best_score:
                best_score = total_score
                best_topic = topic

        return best_topic

    def retrieve_relevant_chunks(self, question, top_k=5):
        question_tokens = self.tokenize(question)
        best_topic = self.get_best_matching_topic(question)
        if not best_topic:
            return []

        scored = []
        for chunk in self.chunks:
            if chunk.get("topic") != best_topic:
                continue
            score = self.score_chunk(question_tokens, chunk)
            if score > 0:
                scored.append((score, chunk))

        scored.sort(reverse=True, key=lambda x: x[0])
        return [chunk for _, chunk in scored[:top_k]]

    def get_sentences_by_topic_section(self, topic, section, max_sentences=5):
        matching_contents = [
            chunk['content'].strip()
            for chunk in self.chunks
            if chunk['topic'] == topic and chunk['section'] == section
        ]
        combined_text = ' '.join(matching_contents)
        sentences = re.split(r'(?<=[.!?]) +', combined_text)
        return ' '.join(sentences[:max_sentences])

    def get_answer(self, question):
        logging.info(f"User asked: {question}")
        results = self.retrieve_relevant_chunks(question)

        if not results:
            return "I'm sorry, I couldn't find any relevant information."

        self.last_topic = results[0]['topic']
        self.last_query = question

        used_topic_sections = set()
        response_parts = []

        for i, chunk in enumerate(results):
            topic = chunk['topic']
            section = chunk['section']
            key = (topic, section)
            if key in used_topic_sections:
                continue
            used_topic_sections.add(key)

            # First chunk: top match → 10 sentences; rest → 5 sentences
            sentence_limit = 10 if i == 0 else 5
            section_text = self.get_sentences_by_topic_section(topic, section, max_sentences=sentence_limit)
            if section_text:
                response_parts.append(f"{topic} – {section}:")
                response_parts.append(section_text)
                response_parts.append("")  # blank line

        return '\n'.join(response_parts)

if __name__ == "__main__":
    engine = SentenceRAGEngine()
    while True:
        user_input = input("\nAsk a question (or type 'exit'): ")
        if user_input.strip().lower() == 'exit':
            break
        answer = engine.get_answer(user_input)
        print("\nAnswer:\n")
        print(answer)