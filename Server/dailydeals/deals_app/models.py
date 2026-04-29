from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import RegexValidator
from django.core.cache import cache
from django.db.models import Q, F
import re


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Phone number is required")
        phone = phone.strip().replace(" ", "")
        if not re.match(r"^\d{8,15}$", phone):
            raise ValueError("Invalid phone number")
        if password and len(password) < 6:
            raise ValueError("Password must be at least 6 characters")
        if extra_fields.get("email"):
            extra_fields["email"] = self.normalize_email(extra_fields["email"])

        extra_fields.setdefault("is_active", True)
        user = self.model(
            phone=phone,
            # date_joined=timezone.now(),
            **extra_fields,
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        if not password:
            raise ValueError("Superuser must have a password")
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)

        return self.create_user(phone, password, **extra_fields)


class User(AbstractUser):
    username = None  # IMPORTANT

    ADMIN = "admin"
    COMPANY = "company"
    USER = "user"

    ROLE_CHOICES = (
        (ADMIN, "Admin"),
        (COMPANY, "Company"),
        (USER, "User"),
    )

    phone = models.CharField(max_length=15, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True, db_index=True)

    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default="user", db_index=True
    )

    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    profile_pic = models.ImageField(upload_to="users/profile/", blank=True, null=True)

    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []
    objects = UserManager()

    def save(self, *args, **kwargs):
        self.phone = self.phone.strip().replace(" ", "")
        if self.role == self.ADMIN:
            self.is_staff = True
        else:
            self.is_staff = False

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.phone} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.ADMIN

    @property
    def is_company_user(self):
        return self.role == self.COMPANY

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Company(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="company",
        limit_choices_to={"role": "company"},
        db_index=True,
    )

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    logo = models.ImageField(upload_to="company/logo/", blank=True, null=True)

    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, default="Doha")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if self.user.role != User.COMPANY:
            raise ValidationError("User must have company role")

    def save(self, *args, **kwargs):
        self.full_clean()  # ensures validation runs
        super().save(*args, **kwargs)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    image = models.ImageField(upload_to="category/", blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class SubCategory(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="subcategories", db_index=True
    )

    class Meta:
        unique_together = ["name", "category"]

    def __str__(self):
        return f"{self.category.name} → {self.name}"


class DealFlyerQuerySet(models.QuerySet):
    def active(self):
        today = timezone.now().date()
        return self.filter(is_active=True, start_date__lte=today, end_date__gte=today)


class DealFlyer(models.Model):

    CATEGORY_CHOICES = [
        ("supermarket", "Supermarkets"),
        ("restaurant", "Restaurants"),
        ("health", "Health & Clinics"),
        ("beauty", "Beauty & Spas"),
        ("fashion", "Fashion"),
        ("sports", "Sports"),
        ("home", "Home & Garden"),
        ("online", "Online Deals"),
    ]

    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="flyers"
    )

    title = models.CharField(max_length=255)
    pdf = models.FileField(upload_to="flyers/")

    category_type = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, db_index=True, blank=False, null=False
    )

    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DealFlyerQuerySet.as_manager()

    # ---------- validation ----------
    def clean(self):
        if self.start_date and self.end_date:
            if self.start_date > self.end_date:
                raise ValidationError("End date must be after start date")

    # ---------- save ----------
    def save(self, *args, **kwargs):
        # run all validations
        self.full_clean()

        today = timezone.now().date()

        # safe check (in case dates are None)
        if self.start_date and self.end_date:
            self.is_active = self.start_date <= today <= self.end_date
        else:
            self.is_active = False

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=Q(start_date__lte=F("end_date")),
                name="deal_start_before_end",
            )
        ]


class Product(models.Model):
    company = models.ForeignKey(
        Company, on_delete=models.CASCADE, related_name="products", db_index=True
    )

    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    old_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )

    image = models.ImageField(upload_to="products/", blank=True, null=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        db_index=True,
    )
    subcategory = models.ForeignKey(
        SubCategory, on_delete=models.SET_NULL, null=True,blank=True, related_name="products"
    )

    quantity = models.CharField(max_length=50, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    view_count = models.IntegerField(default=0, db_index=True)

    def clean(self):
        if self.old_price and self.old_price < self.price:
            raise ValidationError("Old price should be greater than price")

    def save(self, *args, **kwargs):
        self.full_clean()  #  ensures validation runs

        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1

            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["category"]),
        ]


class FlyerProduct(models.Model):
    flyer = models.ForeignKey(
        DealFlyer, on_delete=models.CASCADE, related_name="flyer_products"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="flyer_links"
    )

    page_number = models.IntegerField()

    class Meta:
        unique_together = ["flyer", "product"]


class SavedProduct(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="saved_products"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="saved_by_users",
        db_index=True,
        blank=True,
        null=True,
    )
    flyer = models.ForeignKey(
        DealFlyer,
        on_delete=models.CASCADE,
        related_name="saved_products",
        blank=True,
        null=True,
    )
    saved_product_count = models.IntegerField(default=0)
    saved_flyer_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                condition=Q(product__isnull=False),
                name="unique_user_product",
            ),
            models.UniqueConstraint(
                fields=["user", "flyer"],
                condition=Q(flyer__isnull=False),
                name="unique_user_flyer",
            ),
        ]


class ProductReview(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    flyer = models.ForeignKey(
        DealFlyer,
        on_delete=models.CASCADE,
        related_name="reviews",
        blank=True,
        null=True,
    )

    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], db_index=True)
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "flyer"],
                condition=Q(flyer__isnull=False),
                name="unique_user_flyer_review",
            )
        ]
        ordering = ["-created_at"]


phone_validator = RegexValidator(
    regex=r"^\+?[0-9]{7,15}$", message="Enter a valid phone number"
)

CACHE_KEY = "app_settings"


class AppSettings(models.Model):
    app_name = models.CharField(max_length=120)
    logo = models.ImageField(upload_to="settings/", blank=True, null=True)

    city = models.CharField(max_length=100, default="Doha")

    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(
        max_length=15, blank=True, null=True, validators=[phone_validator]
    )

    whatsapp = models.URLField(blank=True, null=True)

    instagram = models.URLField(blank=True, null=True)
    facebook = models.URLField(blank=True, null=True)

    managed_by = models.CharField(max_length=255, blank=True, null=True)

    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # enforce single instance
        if not self.pk and AppSettings.objects.exists():
            raise ValidationError("Only one AppSettings instance allowed")

        # delete old logo
        if self.pk:
            try:
                old = AppSettings.objects.get(pk=self.pk)
                if old.logo and old.logo != self.logo:
                    old.logo.delete(save=False)
            except AppSettings.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        # clear cache
        cache.delete(CACHE_KEY)

    def delete(self, *args, **kwargs):
        cache.delete(CACHE_KEY)
        super().delete(*args, **kwargs)

    def __str__(self):
        return self.app_name or "App Settings"

    class Meta:
        verbose_name = "App Setting"
        verbose_name_plural = "App Settings"


class CompanyRequest(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    company_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=15)
    email = models.EmailField()

    description = models.TextField(blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)

    is_approved = models.BooleanField(default=False)
    is_rejected = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name
