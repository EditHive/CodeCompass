"""
API Routes
Defines all HTTP endpoints for the application.
"""
from services.auth_service import AuthService
from services.payment_service import PaymentService
from models.product import ProductCatalog
from utils.helpers import setup_logging

logger = setup_logging("routes")


def register_routes(app):
    """Register all API routes with the application."""
    setup_auth_routes(app)
    setup_product_routes(app)
    setup_payment_routes(app)
    logger.info("All routes registered")


def setup_auth_routes(app):
    """Authentication endpoints."""
    def handle_register(request):
        return app.auth_service.register(
            request["username"], request["email"], request["password"]
        )

    def handle_login(request):
        return app.auth_service.login(request["email"], request["password"])

    def handle_logout(request):
        return app.auth_service.logout(request["token"])


def setup_product_routes(app):
    """Product catalog endpoints."""
    catalog = ProductCatalog()

    def handle_search(request):
        return catalog.search(request["query"])

    def handle_get_products(request):
        category = request.get("category")
        if category:
            return catalog.get_by_category(category)
        return catalog.get_available()


def setup_payment_routes(app):
    """Payment processing endpoints."""
    def handle_payment(request):
        return app.payment_service.process_payment(
            request["token"],
            request["amount"],
            request["payment_method"],
            request["items"],
        )

    def handle_refund(request):
        return app.payment_service.refund(
            request["token"], request["transaction_id"]
        )

    def handle_history(request):
        return app.payment_service.get_transaction_history(request["token"])
