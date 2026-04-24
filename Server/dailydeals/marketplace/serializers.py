from rest_framework import serializers
from marketplace.models import *


# ================= IMAGE =================
class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["image"]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


# ================= PRODUCT LIST =================
class ProductListSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)

    seller_name = serializers.CharField(source="seller.phone", read_only=True)
    category_name = serializers.SerializerMethodField()
    seller_id = serializers.IntegerField(source="seller.id", read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "price",
            "city",
            "condition",
            "is_negotiable",
            "view_count",
            "created_at",
            "primary_image",  # optimized
            "images",
            "seller_name",
            "category_name",
            "seller_id",
        ]

    # Safe category
    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    # Primary image (fast UI load)
    def get_primary_image(self, obj):
        request = self.context.get("request")

        image = obj.images.first()
        if image and image.image and request:
            return request.build_absolute_uri(image.image.url)

        return None


class NotificationSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)
    product_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    product_city = serializers.CharField(source="product.city", read_only=True)

    # buyer basic
    buyer_first_name = serializers.CharField(source="buyer.first_name", read_only=True)
    buyer_last_name = serializers.CharField(source="buyer.last_name", read_only=True)
    buyer_email = serializers.CharField(source="buyer.email", read_only=True)
    buyer_phone = serializers.CharField(source="buyer.phone", read_only=True)

    # profile fields
    buyer_city = serializers.SerializerMethodField()
    buyer_state = serializers.SerializerMethodField()
    buyer_address = serializers.SerializerMethodField()
    buyer_profile_image = serializers.SerializerMethodField()

    product_image = serializers.SerializerMethodField()
    message = serializers.CharField(read_only=True)

    class Meta:
        model = ProductRequest
        fields = [
            "id",
            "status",
            "is_read",
            "created_at",
            # product
            "product_title",
            "product_price",
            "product_city",
            "product_image",
            "product_id",
            "message",
            # buyer
            "buyer_first_name",
            "buyer_last_name",
            "buyer_email",
            "buyer_phone",
            # profile
            "buyer_city",
            "buyer_state",
            "buyer_address",
            "buyer_profile_image",
        ]

    def get_profile(self, obj):
        return getattr(obj.buyer, "marketplace_profile", None)

    def get_buyer_city(self, obj):
        profile = self.get_profile(obj)
        return getattr(profile, "city", "")

    def get_buyer_state(self, obj):
        profile = self.get_profile(obj)
        return getattr(profile, "state", "")

    def get_buyer_address(self, obj):
        profile = self.get_profile(obj)
        return getattr(profile, "address", "")

    def get_buyer_profile_image(self, obj):
        request = self.context.get("request")
        profile = self.get_profile(obj)

        if profile and profile.profile_image:
            url = profile.profile_image.url
            return request.build_absolute_uri(url) if request else url

        return None

    def get_product_image(self, obj):
        request = self.context.get("request")

        # safe + optimized (uses prefetch)
        image = next(iter(obj.product.images.all()), None)

        if image and image.image:
            url = image.image.url
            return request.build_absolute_uri(url) if request else url

        return None


class SavedProductSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id")
    title = serializers.CharField(source="product.title")
    price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2
    )
    city = serializers.CharField(source="product.city")
    condition = serializers.CharField(source="product.condition")

    image = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "product_id",
            "title",
            "price",
            "city",
            "condition",
            "image",
        ]

    def get_image(self, obj):
        request = self.context.get("request")

        img = obj.product.images.first()
        if img and img.image:
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url

        return None


class MyInterestSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id")
    title = serializers.CharField(source="product.title")
    price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2
    )
    city = serializers.CharField(source="product.city")
    status = serializers.CharField()

    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductRequest
        fields = [
            "id",
            "product_id",
            "title",
            "price",
            "city",
            "status",
            "created_at",
            "image",
        ]

    def get_image(self, obj):
        request = self.context.get("request")

        img = obj.product.images.first()
        if img and img.image:
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url

        return None


class UserProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    image_file = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "city",
            "state",
            "address",
            "profile_image",
            "image_file",
        ]

    def get_profile_image(self, obj):
        request = self.context.get("request")

        if obj.profile_image:
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url

        return None

    def update(self, instance, validated_data):
        image = validated_data.pop("image_file", None)

        if image:
            # delete old image
            if instance.profile_image:
                instance.profile_image.delete(save=False)

            instance.profile_image = image

        return super().update(instance, validated_data)


class SellerProductSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    image_urls = serializers.SerializerMethodField(read_only=True)
    category = serializers.CharField(required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "price",
            "city",
            "condition",
            "is_negotiable",
            "description",
            "category",
            "images",
            "image_urls",
            "created_at",
            "is_active",
        ]

    def get_image_urls(self, obj):
        request = self.context.get("request")

        return [
            request.build_absolute_uri(img.image.url)
            for img in obj.images.all()
            if img.image
        ]

    def validate(self, data):
        # BASIC VALIDATION
        if not data.get("title"):
            raise serializers.ValidationError({"title": "Title is required"})

        if not data.get("price"):
            raise serializers.ValidationError({"price": "Price is required"})

        return data

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        category_name = validated_data.pop("category", None)

        user = self.context["request"].user

        # convert price safely
        price = validated_data.get("price")
        try:
            validated_data["price"] = float(price)
        except:
            raise serializers.ValidationError({"price": "Invalid price"})

        # create/get category from STRING
        category_obj = None
        if category_name:
            category_obj, _ = Category.objects.get_or_create(
                name=category_name.strip().title()
            )

        product = Product.objects.create(
            seller=user, category=category_obj, **validated_data
        )

        # save images safely
        for img in images[:5]:
            ProductImage.objects.create(product=product, image=img)

        return product


class UpdateSellerProductSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    image_urls = serializers.SerializerMethodField(read_only=True)
    category = serializers.CharField(required=False)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "price",
            "city",
            "condition",
            "is_negotiable",
            "is_active",
            "description",
            "category",
            "images",
            "image_urls",
            "created_at",
        ]

    def validate(self, data):
        if "price" in data and data["price"] < 0:
            raise serializers.ValidationError({"price": "Price must be positive"})
        return data

    def update(self, instance, validated_data):
        images = validated_data.pop("images", None)
        category_name = validated_data.pop("category", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)
            instance.category = category

        instance.save()

        if images is not None:
            instance.images.all().delete()
            for img in images[:5]:
                ProductImage.objects.create(product=instance, image=img)

        return instance


class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ["id", "product", "created_at"]


class ProductRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRequest
        fields = ["id", "product", "status", "created_at"]


# -------------Admin serializers (not used in views)------------------


class TopSavedProductSerializer(serializers.Serializer):
    prod_id = serializers.IntegerField()
    product_title = serializers.CharField()
    category_name = serializers.CharField()
    total_saves = serializers.IntegerField()


class TopRequestedProductSerializer(serializers.Serializer):
    prod_id = serializers.IntegerField()
    product_title = serializers.CharField()
    category_name = serializers.CharField()
    total_requests = serializers.IntegerField()


class TopViewedProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    category_name = serializers.CharField()
    total_views = serializers.IntegerField()


class UserActivitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    total_products = serializers.IntegerField()
    total_requests = serializers.IntegerField()
    total_cart = serializers.IntegerField()


class AdminListingSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.first_name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "price",
            "is_active",
            "view_count",
            "seller_name",
            "category_name",
            "created_at",
        ]


class AdminUserProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    phone = serializers.CharField(source="user.phone", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user_id",
            "full_name",
            "email",
            "phone",
            "city",
            "state",
            "address",
            "profile_image",
            "created_at",
        ]

    def get_full_name(self, obj):
        first = obj.user.first_name or ""
        last = obj.user.last_name or ""
        return f"{first} {last}".strip() or "User"
