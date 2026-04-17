"""
Semantic Search Engine
Provides intent-based code search using text embeddings.
Uses a simple TF-IDF approach when sentence-transformers is not available,
with optional upgrade to transformer-based embeddings.
"""
import re
import math
from typing import Dict, List, Any, Optional
from collections import Counter


class SemanticSearch:
    """Searches code using natural language queries."""

    def __init__(self):
        self.documents = []  # List of {id, text, metadata}
        self.vocab = {}
        self.idf = {}
        self.doc_vectors = []
        self._model = None
        self._use_transformers = False

    def index_codebase(self, file_analyses: dict):
        """Index all code elements for search."""
        self.documents = []

        for rel_path, analysis in file_analyses.items():
            # Index the file itself
            file_text = self._build_file_text(analysis)
            self.documents.append({
                "id": rel_path,
                "text": file_text,
                "type": "file",
                "path": rel_path,
                "metadata": {
                    "language": analysis.language,
                    "loc": analysis.lines_of_code,
                    "docstring": analysis.docstring or "",
                },
            })

            # Index each function
            for func in analysis.functions:
                func_text = self._build_function_text(func, rel_path)
                func_id = f"{rel_path}::{func.name}"
                self.documents.append({
                    "id": func_id,
                    "text": func_text,
                    "type": "function",
                    "path": rel_path,
                    "metadata": {
                        "name": func.name,
                        "file": rel_path,
                        "line": func.line_start,
                        "docstring": func.docstring or "",
                        "params": func.params,
                    },
                })

            # Index each class
            for cls in analysis.classes:
                cls_text = self._build_class_text(cls, rel_path)
                cls_id = f"{rel_path}::{cls.name}"
                self.documents.append({
                    "id": cls_id,
                    "text": cls_text,
                    "type": "class",
                    "path": rel_path,
                    "metadata": {
                        "name": cls.name,
                        "file": rel_path,
                        "line": cls.line_start,
                        "docstring": cls.docstring or "",
                        "methods": cls.methods,
                    },
                })

        # Build TF-IDF index
        self._build_tfidf_index()

    def search(self, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search for code elements matching the natural language query."""
        if not self.documents:
            return []

        # Expand query with synonyms
        expanded_query = self._expand_query(query)

        # TF-IDF search
        query_tokens = self._tokenize(expanded_query)
        query_vector = self._get_tfidf_vector(query_tokens)

        results = []
        for i, doc in enumerate(self.documents):
            if i < len(self.doc_vectors):
                score = self._cosine_similarity(query_vector, self.doc_vectors[i])
                if score > 0.01:
                    results.append({
                        "id": doc["id"],
                        "type": doc["type"],
                        "path": doc["path"],
                        "score": round(score, 4),
                        "metadata": doc["metadata"],
                        "explanation": self._explain_match(query, doc),
                    })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def _build_file_text(self, analysis) -> str:
        """Build searchable text representation of a file."""
        parts = [
            analysis.relative_path,
            analysis.docstring or "",
            " ".join(f.name for f in analysis.functions),
            " ".join(c.name for c in analysis.classes),
            " ".join(imp.module for imp in analysis.imports),
        ]
        # Add function docstrings
        for func in analysis.functions:
            if func.docstring:
                parts.append(func.docstring)
        return " ".join(parts)

    def _build_function_text(self, func, file_path: str) -> str:
        """Build searchable text for a function."""
        parts = [
            func.name,
            self._camel_to_words(func.name),
            func.docstring or "",
            file_path,
            " ".join(func.params),
            " ".join(func.calls),
        ]
        return " ".join(parts)

    def _build_class_text(self, cls, file_path: str) -> str:
        """Build searchable text for a class."""
        parts = [
            cls.name,
            self._camel_to_words(cls.name),
            cls.docstring or "",
            file_path,
            " ".join(cls.methods),
            " ".join(cls.bases),
        ]
        return " ".join(parts)

    def _build_tfidf_index(self):
        """Build TF-IDF index for all documents."""
        # Tokenize all documents
        all_tokens = []
        for doc in self.documents:
            tokens = self._tokenize(doc["text"])
            all_tokens.append(tokens)

        # Build vocabulary
        vocab_set = set()
        for tokens in all_tokens:
            vocab_set.update(tokens)
        self.vocab = {word: i for i, word in enumerate(sorted(vocab_set))}

        # Calculate IDF
        n_docs = len(self.documents)
        doc_freq = Counter()
        for tokens in all_tokens:
            unique_tokens = set(tokens)
            for token in unique_tokens:
                doc_freq[token] += 1

        self.idf = {}
        for token, freq in doc_freq.items():
            self.idf[token] = math.log((n_docs + 1) / (freq + 1)) + 1

        # Build document vectors
        self.doc_vectors = []
        for tokens in all_tokens:
            vector = self._get_tfidf_vector(tokens)
            self.doc_vectors.append(vector)

    def _tokenize(self, text: str) -> List[str]:
        """Tokenize text into words."""
        text = text.lower()
        # Split camelCase and snake_case
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
        text = text.replace('_', ' ').replace('.', ' ').replace('/', ' ')
        tokens = re.findall(r'[a-z0-9]+', text)
        # Remove stop words
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'in', 'of', 'to',
                      'and', 'or', 'for', 'with', 'on', 'at', 'by', 'it', 'this',
                      'that', 'from', 'as', 'be', 'has', 'have', 'its', 'py'}
        return [t for t in tokens if t not in stop_words and len(t) > 1]

    def _get_tfidf_vector(self, tokens: List[str]) -> Dict[str, float]:
        """Calculate TF-IDF vector for a set of tokens."""
        tf = Counter(tokens)
        max_tf = max(tf.values()) if tf else 1
        vector = {}
        for token, count in tf.items():
            if token in self.idf:
                vector[token] = (count / max_tf) * self.idf[token]
        return vector

    def _cosine_similarity(self, vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
        """Calculate cosine similarity between two sparse vectors."""
        common = set(vec1.keys()) & set(vec2.keys())
        if not common:
            return 0.0

        dot_product = sum(vec1[k] * vec2[k] for k in common)
        norm1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
        norm2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

        if norm1 == 0 or norm2 == 0:
            return 0.0
        return dot_product / (norm1 * norm2)

    def _expand_query(self, query: str) -> str:
        """Expand query with common programming synonyms."""
        synonyms = {
            "auth": "authentication login session token password",
            "authentication": "auth login session token password",
            "login": "auth authentication session sign in",
            "database": "db connection query sql data store",
            "db": "database connection query storage",
            "api": "endpoint route handler request response",
            "payment": "charge transaction billing money purchase",
            "user": "account profile member customer",
            "validate": "check verify validation sanitize",
            "error": "exception handling catch try failure",
            "config": "configuration settings environment setup",
            "init": "initialize initialization setup bootstrap start",
            "test": "testing unit integration spec",
        }

        expanded = query
        for key, expansion in synonyms.items():
            if key in query.lower():
                expanded += " " + expansion

        return expanded

    def _explain_match(self, query: str, doc: dict) -> str:
        """Explain why a document matched the query."""
        doc_type = doc["type"]
        metadata = doc["metadata"]

        if doc_type == "file":
            return f"File '{doc['path']}' contains relevant code. {metadata.get('docstring', '')[:100]}"
        elif doc_type == "function":
            name = metadata.get("name", "")
            docstring = metadata.get("docstring", "")
            return f"Function '{name}' in {doc['path']}. {docstring[:100]}" if docstring else f"Function '{name}' in {doc['path']} matches your query."
        elif doc_type == "class":
            name = metadata.get("name", "")
            return f"Class '{name}' in {doc['path']} with methods: {', '.join(metadata.get('methods', [])[:5])}"
        return "Matches query terms."

    def _camel_to_words(self, name: str) -> str:
        """Convert camelCase/PascalCase to space-separated words."""
        result = re.sub(r'([A-Z])', r' \1', name)
        return result.lower().strip()
