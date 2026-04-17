"""
User Model
Defines user data structures and validation logic.
"""
from utils.validators import validate_email, validate_password


class User:
    """Represents a user in the system."""

    def __init__(self, user_id, username, email, password_hash, role="customer"):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.is_active = True

    @staticmethod
    def validate_registration(email, password):
        """Validate user registration data."""
        errors = []
        if not validate_email(email):
            errors.append("Invalid email format")
        if not validate_password(password):
            errors.append("Password does not meet requirements")
        return errors

    def to_dict(self):
        """Convert user to dictionary representation."""
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_active": self.is_active,
        }

    def has_permission(self, permission):
        """Check if user has a specific permission."""
        role_permissions = {
            "admin": ["read", "write", "delete", "manage_users"],
            "customer": ["read", "write"],
            "guest": ["read"],
        }
        return permission in role_permissions.get(self.role, [])


class UserProfile:
    """Extended user profile information."""

    def __init__(self, user, address=None, phone=None):
        self.user = user
        self.address = address
        self.phone = phone
        self.order_history = []

    def add_order(self, order):
        """Add an order to user's history."""
        self.order_history.append(order)

    def get_total_spent(self):
        """Calculate total amount spent by user."""
        return sum(order.total for order in self.order_history)
