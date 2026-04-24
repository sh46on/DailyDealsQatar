from django.db.models import Prefetch
from django.core.cache import cache
from deals_app.models import Company, Product, DealFlyer, Category, SubCategory
from deals_app.serializers import CategorySerializer


def get_homepage_data():
    products_qs = Product.objects.filter(is_active=True)\
        .select_related("category", "subcategory")\
        .order_by("-created_at")[:10]

    flyers_qs = DealFlyer.objects.filter(is_active=True)\
        .order_by("-created_at")[:5]

    companies = Company.objects.select_related("user").prefetch_related(
        Prefetch("products", queryset=products_qs, to_attr="prefetched_products"),
        Prefetch("flyers", queryset=flyers_qs, to_attr="prefetched_flyers"),
    )

    # ❗ NO CACHE HERE
    categories = Category.objects.prefetch_related(
        Prefetch(
            "subcategories",
            queryset=SubCategory.objects.prefetch_related(
                Prefetch(
                    "products",
                    queryset=Product.objects.filter(is_active=True)
                    .select_related("category", "subcategory")
                )
            ),
        ),
        Prefetch(
            "products",
            queryset=Product.objects.filter(
                is_active=True, subcategory__isnull=True
            ).select_related("category", "subcategory"),
        ),
    )

    return companies, categories