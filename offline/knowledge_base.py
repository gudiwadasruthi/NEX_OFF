# knowledge_base.py
from rag_engine import SentenceRAGEngine

class KnowledgeBase:
    def __init__(self):
        self.rag_engine = SentenceRAGEngine()

    def get_answer(self, query):
        return self.rag_engine.get_answer(query) 