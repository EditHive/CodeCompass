"""
Helper Utilities
Common utility functions used across the application.
"""
import hashlib
import uuid
import logging


def setup_logging(name):
    """Configure and return a logger instance."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def hash_password(password):
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_token():
    """Generate a unique authentication token."""
    return str(uuid.uuid4())


def generate_id():
    """Generate a unique identifier."""
    return str(uuid.uuid4())[:8]


def load_config():
    """Load application configuration."""
    return {
        "database": {
            "host": "localhost",
            "port": 27017,
            "name": "ecommerce",
        },
        "server": {
            "host": "0.0.0.0",
            "port": 8080,
        },
        "auth": {
            "token_expiry": 3600,
            "max_attempts": 5,
        },
    }


def format_currency(amount):
    """Format a number as currency."""
    return f"${amount:,.2f}"


def paginate(items, page=1, per_page=20):
    """Paginate a list of items."""
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "items": items[start:end],
        "total": len(items),
        "page": page,
        "per_page": per_page,
        "pages": (len(items) + per_page - 1) // per_page,
    }
