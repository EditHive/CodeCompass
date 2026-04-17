"""
Database Connection
Manages database connections and provides CRUD operations.
"""
from utils.helpers import setup_logging


class DatabaseConnection:
    """Database connection manager with CRUD operations."""

    def __init__(self, config):
        self.config = config
        self.logger = setup_logging("database")
        self.is_connected = False
        self._data = {}  # In-memory store for demo

    def connect(self):
        """Establish database connection."""
        self.logger.info(f"Connecting to database: {self.config.get('host', 'localhost')}")
        self.is_connected = True
        self.logger.info("Database connected successfully")

    def disconnect(self):
        """Close database connection."""
        self.is_connected = False
        self.logger.info("Database disconnected")

    def insert(self, collection, document):
        """Insert a document into a collection."""
        if collection not in self._data:
            self._data[collection] = []
        self._data[collection].append(document)
        return len(self._data[collection]) - 1

    def find_one(self, collection, query):
        """Find a single document matching the query."""
        if collection not in self._data:
            return None
        for doc in self._data[collection]:
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def find(self, collection, query, limit=100):
        """Find all documents matching the query."""
        if collection not in self._data:
            return []
        results = []
        for doc in self._data[collection]:
            if all(doc.get(k) == v for k, v in query.items()):
                results.append(doc)
                if len(results) >= limit:
                    break
        return results

    def update(self, collection, query, update_data):
        """Update documents matching the query."""
        if collection not in self._data:
            return 0
        count = 0
        for doc in self._data[collection]:
            if all(doc.get(k) == v for k, v in query.items()):
                if "$inc" in update_data:
                    for k, v in update_data["$inc"].items():
                        doc[k] = doc.get(k, 0) + v
                else:
                    doc.update(update_data)
                count += 1
        return count

    def delete(self, collection, query):
        """Delete documents matching the query."""
        if collection not in self._data:
            return 0
        before = len(self._data[collection])
        self._data[collection] = [
            doc for doc in self._data[collection]
            if not all(doc.get(k) == v for k, v in query.items())
        ]
        return before - len(self._data[collection])
