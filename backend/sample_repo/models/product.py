"""
Product Model
Defines product data structures and inventory management.
"""
from utils.validators import validate_price
from utils.helpers import generate_id


class Product:
    """Represents a product in the catalog."""

    def __init__(self, name, price, category, stock=0):
        self.product_id = generate_id()
        self.name = name
        self.price = price
        self.category = category
        self.stock = stock
        self.is_available = stock > 0

    def update_stock(self, quantity):
        """Update product stock level."""
        self.stock += quantity
        self.is_available = self.stock > 0
        return self.stock

    def apply_discount(self, percentage):
        """Apply a discount to the product price."""
        if 0 < percentage <= 100:
            self.price = self.price * (1 - percentage / 100)
        return self.price

    def to_dict(self):
        return {
            "product_id": self.product_id,
            "name": self.name,
            "price": self.price,
            "category": self.category,
            "stock": self.stock,
            "is_available": self.is_available,
        }


class ProductCatalog:
    """Manages the product catalog with search and filtering."""

    def __init__(self):
        self.products = {}

    def add_product(self, product):
        self.products[product.product_id] = product

    def search(self, query):
        """Search products by name or category."""
        results = []
        query_lower = query.lower()
        for product in self.products.values():
            if query_lower in product.name.lower() or query_lower in product.category.lower():
                results.append(product)
        return results

    def get_by_category(self, category):
        return [p for p in self.products.values() if p.category == category]

    def get_available(self):
        return [p for p in self.products.values() if p.is_available]
