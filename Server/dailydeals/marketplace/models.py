from django.db import models
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from deals_app.models import User


# ================= USER PROFILE =================
class UserProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="marketplace_profile"
    )

    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)
    address = models.CharField(max_length=255)

    profile_image = models.ImageField(
        upload_to="marketplace/users/", blank=True, null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  #  added

    def __str__(self):
        return f"{self.user} Profile"

    class Meta:
        indexes = [
            models.Index(fields=["city"]),
            models.Index(fields=["-created_at"]),
        ]


# ================= CATEGORY =================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True, db_index=True)

    icon = models.ImageField(upload_to="marketplace/categories/", blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug or slugify(self.name) != self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1

            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


# ================= PRODUCT =================
class Product(models.Model):
    CONDITION_CHOICES = [
        ("new", "New"),
        ("used", "Used"),
    ]

    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="marketplace_products",
        db_index=True,
    )

    title = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, blank=True, db_index=True)

    description = models.TextField()

    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_negotiable = models.BooleanField(default=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products",
        db_index=True,
    )

    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)

    city = models.CharField(max_length=100, db_index=True)

    is_active = models.BooleanField(default=True, db_index=True)
    view_count = models.PositiveIntegerField(default=0, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.price < 0:
            raise ValidationError("Price cannot be negative")

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1

            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        self.full_clean()  #  enforce validation
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["title"]),
            models.Index(fields=["category"]),
            models.Index(fields=["price"]),
            models.Index(fields=["city"]),
            models.Index(fields=["view_count"]),
            models.Index(fields=["-created_at"]),
        ]


# ================= PRODUCT IMAGES =================
class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )

    image = models.ImageField(upload_to="marketplace/products/")

    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.product.images.count() >= 5:
            raise ValidationError("Maximum 5 images allowed per product")

    def save(self, *args, **kwargs):
        self.full_clean()  #  ensure validation
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.title} Image"

    class Meta:
        ordering = ["-created_at"]


# ================= CART =================
class Cart(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="cart_items", db_index=True
    )

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="in_carts", db_index=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="unique_cart_item")
        ]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"{self.user} → {self.product}"


# ================= PRODUCT REQUEST =================
class ProductRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="requests", db_index=True
    )
    buyer = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="product_requests", db_index=True
    )
    seller = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_requests", db_index=True
    )

    message = models.TextField(blank=True)

    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="pending", db_index=True
    )
    is_read = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "buyer"], name="unique_product_request"
            )
        ]
        indexes = [
            models.Index(fields=["buyer"]),
            models.Index(fields=["seller"]),
            models.Index(fields=["status"]),
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["seller", "is_read"]),  #  optimized notifications
            models.Index(fields=["buyer", "is_read"]),
        ]

    def clean(self):
        if self.product.seller == self.buyer:
            raise ValidationError("You cannot request your own product")

        if self.seller != self.product.seller:
            raise ValidationError("Seller must match product seller")

    def save(self, *args, **kwargs):
        if not self.seller:
            self.seller = self.product.seller

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.buyer} → {self.product} ({self.status})"
