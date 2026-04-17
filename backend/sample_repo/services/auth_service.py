"""
Authentication Service
Handles user authentication, registration, and session management.
"""
from models.user import User, UserProfile
from utils.helpers import hash_password, generate_token, setup_logging
from utils.validators import validate_email, validate_password


class AuthService:
    """Manages authentication and authorization."""

    def __init__(self, db):
        self.db = db
        self.logger = setup_logging("auth_service")
        self.active_sessions = {}

    def initialize(self):
        """Initialize auth service."""
        self.logger.info("Auth service initialized")

    def register(self, username, email, password):
        """Register a new user account."""
        errors = User.validate_registration(email, password)
        if errors:
            return {"success": False, "errors": errors}

        existing = self.db.find_one("users", {"email": email})
        if existing:
            return {"success": False, "errors": ["Email already registered"]}

        password_hash = hash_password(password)
        user = User(
            user_id=None,
            username=username,
            email=email,
            password_hash=password_hash,
        )
        user_id = self.db.insert("users", user.to_dict())
        user.user_id = user_id

        self.logger.info(f"User registered: {username}")
        return {"success": True, "user": user.to_dict()}

    def login(self, email, password):
        """Authenticate user and create session."""
        user_data = self.db.find_one("users", {"email": email})
        if not user_data:
            return {"success": False, "error": "User not found"}

        password_hash = hash_password(password)
        if user_data["password_hash"] != password_hash:
            return {"success": False, "error": "Invalid password"}

        token = generate_token()
        self.active_sessions[token] = user_data["user_id"]
        self.logger.info(f"User logged in: {email}")
        return {"success": True, "token": token}

    def logout(self, token):
        """End user session."""
        if token in self.active_sessions:
            del self.active_sessions[token]
            return True
        return False

    def get_current_user(self, token):
        """Get user from session token."""
        user_id = self.active_sessions.get(token)
        if not user_id:
            return None
        return self.db.find_one("users", {"user_id": user_id})

    def check_permission(self, token, permission):
        """Check if authenticated user has permission."""
        user_data = self.get_current_user(token)
        if not user_data:
            return False
        user = User(**user_data)
        return user.has_permission(permission)
