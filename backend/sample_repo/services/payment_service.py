"""
Payment Service
Handles payment processing, refunds, and transaction history.
"""
from models.product import Product
from models.user import User
from services.auth_service import AuthService
from utils.helpers import setup_logging, generate_id
from utils.validators import validate_price


class PaymentService:
    """Manages payment processing and transactions."""

    def __init__(self, db, auth_service):
        self.db = db
        self.auth_service = auth_service
        self.logger = setup_logging("payment_service")

    def initialize(self):
        """Initialize payment service."""
        self.logger.info("Payment service initialized")

    def process_payment(self, token, amount, payment_method, items):
        """Process a payment for an order.

        This is a complex function that handles the full payment flow:
        1. Validate user authentication
        2. Validate payment details
        3. Check item availability
        4. Process the payment
        5. Update inventory
        6. Create transaction record
        """
        # Step 1: Authenticate
        user = self.auth_service.get_current_user(token)
        if not user:
            return {"success": False, "error": "Authentication required"}

        # Step 2: Validate amount
        if not validate_price(amount):
            return {"success": False, "error": "Invalid payment amount"}

        # Step 3: Check inventory
        for item in items:
            product = self.db.find_one("products", {"product_id": item["product_id"]})
            if not product or product["stock"] < item["quantity"]:
                return {"success": False, "error": f"Item {item['product_id']} unavailable"}

        # Step 4: Process payment (simplified)
        transaction_id = generate_id()

        # Step 5: Update inventory
        for item in items:
            self.db.update(
                "products",
                {"product_id": item["product_id"]},
                {"$inc": {"stock": -item["quantity"]}},
            )

        # Step 6: Create transaction record
        transaction = {
            "transaction_id": transaction_id,
            "user_id": user["user_id"],
            "amount": amount,
            "payment_method": payment_method,
            "items": items,
            "status": "completed",
        }
        self.db.insert("transactions", transaction)

        self.logger.info(f"Payment processed: {transaction_id}")
        return {"success": True, "transaction_id": transaction_id}

    def refund(self, token, transaction_id):
        """Process a refund for a transaction."""
        if not self.auth_service.check_permission(token, "manage_users"):
            user = self.auth_service.get_current_user(token)
            transaction = self.db.find_one("transactions", {"transaction_id": transaction_id})
            if not transaction or transaction["user_id"] != user["user_id"]:
                return {"success": False, "error": "Unauthorized"}

        transaction = self.db.find_one("transactions", {"transaction_id": transaction_id})
        if not transaction:
            return {"success": False, "error": "Transaction not found"}

        # Restore inventory
        for item in transaction["items"]:
            self.db.update(
                "products",
                {"product_id": item["product_id"]},
                {"$inc": {"stock": item["quantity"]}},
            )

        self.db.update(
            "transactions",
            {"transaction_id": transaction_id},
            {"status": "refunded"},
        )

        self.logger.info(f"Refund processed: {transaction_id}")
        return {"success": True}

    def get_transaction_history(self, token, limit=50):
        """Get transaction history for authenticated user."""
        user = self.auth_service.get_current_user(token)
        if not user:
            return []
        return self.db.find("transactions", {"user_id": user["user_id"]}, limit=limit)
