import re
from rest_framework import serializers
from deals_app.models import *
from django.contrib.auth import get_user_model
from django.db import transaction, IntegrityError
from deals_app.utils import get_settings
import re

User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    category_id = serializers.IntegerField(source="category.id", read_only=True)
    subcategory_id = serializers.IntegerField(source="subcategory.id", read_only=True)
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "price",
            "old_price",
            "image",
            "category_name",
            "category_id",
            "subcategory_id",
            "company_name",
            "is_featured",
        )


class SubCategorySerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = SubCategory
        fields = ["id", "name", "products"]

    def get_products(self, obj):
        products = getattr(obj, "prefetched_products", None)

        if products is None:
            products = obj.products.all().order_by("-id")[:10]

        return ProductSerializer(products, many=True).data


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    products = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "image", "subcategories", "products"]

    def get_products(self, obj):
        products = getattr(obj, "prefetched_products", None)

        if products is None:
            products = obj.products.all().order_by("-id")[:10]

        return ProductSerializer(products, many=True).data


class DealFlyerSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_id = serializers.IntegerField(source="company.id", read_only=True)
    company_logo = serializers.SerializerMethodField()

    def get_company_logo(self, obj):
        try:
            return obj.company.logo.url if obj.company.logo else None
        except:
            return None

    category_key = serializers.SerializerMethodField()

    class Meta:
        model = DealFlyer
        fields = (
            "id",
            "title",
            "pdf",
            "start_date",
            "end_date",
            "category_type",
            "company_name",
            "company_id",
            "company_logo",
            "category_key",
        )

    def get_category_key(self, obj):
        """
        Map category_type to frontend nav keys:
        - supermarket, restaurants, health, beauty, fashion, home, online, electronics
        """
        mapping = {
            "supermarket": "supermarket",
            "restaurants": "restaurants",
            "health": "health",
            "clinics": "health",
            "beauty": "beauty",
            "spa": "beauty",
            "fashion": "fashion",
            "sports": "fashion",
            "home": "home",
            "garden": "home",
            "online": "online",
            "electronics": "electronics",
            "gadgets": "electronics",
        }
        return mapping.get(obj.category_type, "offers")


class CompanySerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()
    pdfs = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = (
            "id",
            "name",
            "description",
            "logo",
            "city",
            "products",
            "pdfs",
        )

    def get_products(self, obj):
        products = getattr(obj, "prefetched_products", None)

        if products is None:
            products = obj.products.all().order_by("-id")[:10]  # limit for safety
        return ProductSerializer(products, many=True).data

    def get_pdfs(self, obj):
        flyers = getattr(obj, "prefetched_flyers", None)
        if flyers is None:
            flyers = obj.dealflyer_set.all().order_by("-id")[:10]
        return DealFlyerSerializer(flyers, many=True).data


# login serializers.py


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        phone = data.get("phone", "").strip()
        password = data.get("password")

        phone = phone.replace(" ", "")
        if phone.startswith("+974"):
            phone = phone.replace("+974", "")

        user = User.objects.filter(phone=phone).first()

        if not user or not password or not user.check_password(password):
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid phone or password"]}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": ["Account inactive"]}
            )

        data["user"] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "first_name",
            "last_name",
            "role",
            "profile_pic",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters")
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter"
            )
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError(
                "Password must contain at least one number"
            )
        return value

    class Meta:
        model = User
        fields = [
            "phone",
            "email",
            "first_name",
            "last_name",
            "password",
            "profile_pic",
        ]

    def validate(self, data):
        phone = data.get("phone", "").strip()
        email = data.get("email", "").strip()
        email = email.lower() if email else None

        # Normalize phone
        phone = phone.replace(" ", "")
        if phone.startswith("+974"):
            phone = phone.replace("+974", "")

        # Validate Qatar phone
        if not re.match(r"^\d{8}$", phone):
            raise serializers.ValidationError(
                {"phone": ["Enter valid 8-digit Qatar number"]}
            )

        # Unique checks
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": ["Phone already registered"]})

        if email:
            if User.objects.filter(email__iexact=email).exists():
                raise serializers.ValidationError(
                    {"email": ["Email already registered"]}
                )

        data["phone"] = phone
        data["email"] = email
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    password=password,
                    role="user",
                    is_active=True,
                    is_verified=True,
                    **validated_data,
                )
            return user

        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": ["User with this phone or email already exists"]}
            )


class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_companies = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    total_flyers = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    active_products = serializers.IntegerField()
    featured_products = serializers.IntegerField()
    server_time          = serializers.DateTimeField()
    category_views       = serializers.ListField()
    total_saved_products = serializers.IntegerField()
    top_products = serializers.ListField()
    recent_users = serializers.ListField()


class AdminCompanySerializer(serializers.ModelSerializer):
    # ─── USER FIELDS ───
    phone = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)

    # ─── COMPANY FIELDS ───
    address = serializers.CharField(required=False, allow_blank=True)

    # ─── READ ONLY ───
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)

    class Meta:
        model = Company
        fields = [
            "id",
            # company
            "name",
            "description",
            "city",
            "address",
            "logo",
            # user (write)
            "phone",
            "password",
            "email",
            "first_name",
            "last_name",
            # user (read)
            "user_phone",
            "is_active",
            "created_at",
        ]

    def validate_phone(self, value):
        value = value.strip().replace(" ", "")
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone already exists")
        return value

    def validate_email(self, value):
        if value:
            value = value.strip().lower()
            if User.objects.filter(email__iexact=value).exists():
                raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters")
        if not re.search(r"[0-9]", value):
            raise serializers.ValidationError(
                "Password must contain at least one number"
            )
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone")
        phone = phone.strip().replace(" ", "")

        password = validated_data.pop("password")

        email = validated_data.pop("email", "")
        email = email.lower() if email else None
        first_name = validated_data.pop("first_name", "")
        last_name = validated_data.pop("last_name", "")

        with transaction.atomic():
            user = User.objects.create_user(
                phone=phone,
                password=password,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=User.COMPANY,
                is_active=True,
                is_verified=True,
            )

            company = Company.objects.create(user=user, **validated_data)

        return company


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    profile_pic = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "password",
            "date_joined",
            "profile_pic",
        ]
        read_only_fields = ["id", "date_joined"]

    def validate_phone(self, value):
        value = value.strip().replace(" ", "")
        if self.instance is None and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone already exists")
        return value

    def validate_email(self, value):
        if value:
            value = value.strip().lower()
            if (
                self.instance is None
                and User.objects.filter(email__iexact=value).exists()
            ):
                raise serializers.ValidationError("Email already exists")
        return value

    def validate_password(self, value):
        if value:
            if len(value) < 6:
                raise serializers.ValidationError("Password too short")
            if not re.search(r"[0-9]", value):
                raise serializers.ValidationError("Must contain a number")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)

        user = User.objects.create_user(
            password=password, is_active=True, is_verified=True, **validated_data
        )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class AppSettingsSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = AppSettings
        fields = [
            "id",
            "app_name",
            "logo",
            "updated_at",
            "city",
            "email",
            "phone",
            "whatsapp",
            "facebook",
            "instagram",
            "managed_by",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get("request")
        logo = data.get("logo")
        if logo:
            if request:
                data["logo"] = request.build_absolute_uri(logo) if request else logo
            else:
                data["logo"] = logo
        else:
            data["logo"] = None

        return data

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone must contain only digits")
        return value

    def validate_whatsapp(self, value):
        if value and not value.startswith("https://"):
            raise serializers.ValidationError("Enter a valid WhatsApp URL")
        return value


class HomeAppSettingsSerializer(AppSettingsSerializer):
    class Meta(AppSettingsSerializer.Meta):
        fields = AppSettingsSerializer.Meta.fields


class AdminProfileSerializer(serializers.ModelSerializer):
    profile_pic = serializers.ImageField(required=False)  # for upload
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "profile_pic",
            "password",
        ]

    def get_profile_pic(self, obj):
        request = self.context.get("request")
        if obj.profile_pic:
            return request.build_absolute_uri(obj.profile_pic.url)
        return None

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        # update normal fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # handle password safely
        if password:
            instance.set_password(password)

        instance.save()
        return instance


class AdminDealFlyerSerializer(serializers.ModelSerializer):
    pdf = serializers.SerializerMethodField()
    company_name = serializers.CharField(source="company.name", read_only=True)

    class Meta:
        model = DealFlyer
        fields = [
            "id",
            "title",
            "pdf",
            "category_type",
            "start_date",
            "end_date",
            "is_active",
            "company_name",
            "created_at",
        ]

    def get_pdf(self, obj):
        request = self.context.get("request")
        if obj.pdf:
            return request.build_absolute_uri(obj.pdf.url)
        return None


class AdminProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    company_name = serializers.CharField(source="company.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    subcategory_name = serializers.CharField(source="subcategory.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "price",
            "old_price",
            "image",
            "quantity",
            "is_active",
            "is_featured",
            "company_name",
            "category_name",
            "subcategory_name",
            "view_count",
            "created_at",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


class AdminSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ["id", "name", "category"]


class AdminCategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    subcategories = AdminSubCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "image", "subcategories"]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None


# -------------------------------Company Serializer-------------------------------


class CompanyUserSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_logo = serializers.ImageField(source="company.logo", read_only=True)
    company_city = serializers.CharField(source="company.city", read_only=True)
    company_description = serializers.CharField(
        source="company.description", read_only=True
    )
    company_address = serializers.CharField(source="company.address", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "first_name",
            "last_name",
            "profile_pic",
            "role",
            "is_active",
            "date_joined",
            "company_name",
            "company_logo",
            "company_city",
            "company_description",
            "company_address",
        ]
        read_only_fields = ["id", "date_joined"]


class CompanyCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = "__all__"


class CompanyProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class CompanyFlyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealFlyer
        fields = "__all__"


class CompanyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["name", "description", "logo", "address", "city"]


class UserCompanyUpdateSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(required=False, allow_blank=True)
    company_description = serializers.CharField(required=False, allow_blank=True)
    company_logo = serializers.ImageField(required=False, allow_null=True)
    company_address = serializers.CharField(required=False, allow_blank=True)
    company_city = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "profile_pic",
            "company_name",
            "company_description",
            "company_logo",
            "company_address",
            "company_city",
        ]

    def update(self, instance, validated_data):

        #  extract company fields
        company_name = validated_data.pop("company_name", None)
        company_description = validated_data.pop("company_description", None)
        company_logo = validated_data.pop("company_logo", None)
        company_address = validated_data.pop("company_address", None)
        company_city = validated_data.pop("company_city", None)

        #  update user
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        #  update company
        company = instance.company

        if company_name is not None:
            company.name = company_name

        if company_description is not None:
            company.description = company_description

        if company_address is not None:
            company.address = company_address

        if company_city is not None:
            company.city = company_city

        if company_logo is not None:
            company.logo = company_logo

        company.save()

        return instance


class CompanyDealFlyerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealFlyer
        fields = [
            "id",
            "title",
            "pdf",
            "category_type",
            "is_active",
            "start_date",
            "end_date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        start = data.get("start_date")
        end = data.get("end_date")

        if start and end and start > end:
            raise serializers.ValidationError("End date must be after start date")

        return data
    def validate_category_type(self, value):
        if not value:
            raise serializers.ValidationError("Category is required")
        return value 


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_profile = serializers.ImageField(source="user.profile_pic", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "rating",
            "comment",
            "created_at",
            "user_name",
            "user_profile",
        ]


class FlyerReviewSerializer(serializers.Serializer):
    flyer_id = serializers.IntegerField()
    flyer_title = serializers.CharField()
    avg_rating = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    reviews = ProductReviewSerializer(many=True)


class ManageCompanyProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "old_price",
            "image",
            "category",
            "category_name",
            "subcategory",
            "quantity",
            "is_active",
            "is_featured",
            "created_at",
        ]
        read_only_fields = ["id", "slug", "created_at"]


# -----------------------User Dashboard Serializers-----------------------


class UserNavbarSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    app_name = serializers.SerializerMethodField()
    app_logo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "profile_pic",
            "full_name",
            "app_name",
            "app_logo",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_app_name(self, obj):
        settings = get_settings()
        return settings.app_name if settings else "Deals"

    def get_app_logo(self, obj):
        settings = get_settings()
        request = self.context.get("request")
        if settings and settings.logo and request:
            request = self.context.get("request")
            return request.build_absolute_uri(settings.logo.url)
        return None
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")

        if instance.profile_pic and request:
            data["profile_pic"] = request.build_absolute_uri(instance.profile_pic.url)

        return data


# ---------- COMPANY ----------
class UserCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ["id", "name", "logo"]


# ---------- CATEGORY ----------
class UserSubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ["id", "name"]


class UserCategorySerializer(serializers.ModelSerializer):
    subcategories = UserSubCategorySerializer(many=True)

    class Meta:
        model = Category
        fields = ["id", "name", "subcategories"]


# ---------- PRODUCT ----------
class UserProductSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name")
    company_logo = serializers.ImageField(source="company.logo")

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "price",
            "old_price",
            "image",
            "company_name",
            "company_logo",
            "category_id",
            "subcategory_id",
        ]


# ---------- FLYER ----------
class UserFlyerSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name")
    company_logo = serializers.ImageField(source="company.logo")

    avg_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DealFlyer
        fields = [
            "id",
            "title",
            "pdf",
            "category_type",
            "start_date",
            "end_date",
            "company_name",
            "company_logo",
            "avg_rating",
            "review_count",
        ]


# ---------- DASHBOARD ----------
class UserDashboardSerializer(serializers.Serializer):
    total_flyers = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_categories = serializers.IntegerField()
    reviews = serializers.IntegerField()
    companies = UserCompanySerializer(many=True)
    products = UserProductSerializer(many=True)
    flyers = UserFlyerSerializer(many=True)
    categories = UserCategorySerializer(many=True)

    saved_product_ids = serializers.ListField()
    saved_flyer_ids = serializers.ListField()



class SavedItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    flyer = serializers.SerializerMethodField()

    class Meta:
        model = SavedProduct
        fields = ["id", "product", "flyer", "created_at"]

    def get_product(self, obj):
        if obj.product:
            return {
                "id": obj.product.id,
                "name": obj.product.name,
                "price": str(obj.product.price),
                "image": obj.product.image.url if obj.product.image else None,
            }
        return None

    def get_flyer(self, obj):
        if obj.flyer:
            return {
                "id": obj.flyer.id,
                "title": obj.flyer.title,
                "pdf": obj.flyer.pdf.url,
                "category": obj.flyer.category_type,
            }
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    profile_pic = serializers.ImageField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "first_name",
            "last_name",
            "profile_pic",
            "password",
            "confirm_password",
        ]

    # Validate password match
    def validate(self, data):
        password = data.get("password")
        confirm = data.get("confirm_password")

        if password or confirm:
            if password != confirm:
                raise serializers.ValidationError(
                    {"password": "Passwords do not match"}
                )

            if len(password) < 6:
                raise serializers.ValidationError(
                    {"password": "Password must be at least 6 characters"}
                )

        return data

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("confirm_password", None)

        # Handle image replacement
        if "profile_pic" in validated_data:
            if instance.profile_pic:
                instance.profile_pic.delete(save=False)

        # Handle password properly
        if password:
            instance.set_password(password)

        # Handle phone (normalize like your model)
        if "phone" in validated_data:
            phone = validated_data["phone"].strip().replace(" ", "")
            instance.phone = phone
            validated_data.pop("phone")

        # Update remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class CompanyRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyRequest
        fields = "__all__"
        read_only_fields = ["is_approved", "is_rejected"]





class FlyerReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_avatar = serializers.CharField(source="user.profile_pic", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "user",
            "user_name",
            "user_avatar",
            "flyer",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]