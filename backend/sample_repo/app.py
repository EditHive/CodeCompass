"""
E-Commerce Application Entry Point
Main application module that initializes and runs the web server.
"""
from api.routes import register_routes
from database.connection import DatabaseConnection
from services.auth_service import AuthService
from services.payment_service import PaymentService
from utils.helpers import setup_logging, load_config


class Application:
    """Main application class that bootstraps the entire system."""

    def __init__(self):
        self.config = load_config()
        self.logger = setup_logging("app")
        self.db = DatabaseConnection(self.config["database"])
        self.auth_service = AuthService(self.db)
        self.payment_service = PaymentService(self.db, self.auth_service)

    def initialize(self):
        """Initialize all application components."""
        self.logger.info("Starting application initialization...")
        self.db.connect()
        self.auth_service.initialize()
        self.payment_service.initialize()
        register_routes(self)
        self.logger.info("Application initialized successfully")

    def run(self, host="0.0.0.0", port=8080):
        """Start the application server."""
        self.initialize()
        self.logger.info(f"Server running on {host}:{port}")

    def shutdown(self):
        """Gracefully shut down the application."""
        self.logger.info("Shutting down application...")
        self.db.disconnect()
        self.logger.info("Application shut down complete")


def create_app():
    """Factory function to create and configure the application."""
    app = Application()
    return app


if __name__ == "__main__":
    app = create_app()
    app.run()
