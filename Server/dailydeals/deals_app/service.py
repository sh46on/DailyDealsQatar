from django.db.models import Prefetch
from django.core.cache import cache
from deals_app.models import Company, Product, DealFlyer, Category, SubCategory

CACHE_KEY = "homepage_data"
CACHE_TIMEOUT = 300  # 5 minutes


def get_homepage_data():
    # ✅ Try cache first
    cached = cache.get(CACHE_KEY)
    if cached:
        return cached

    # ✅ Base queryset
    active_products = Product.objects.filter(is_active=True).select_related(
        "category", "subcategory"
    )

    # 🔹 Limited products for homepage
    products_qs = active_products.order_by("-created_at")

    # 🔹 Limited flyers
    flyers_qs = DealFlyer.objects.filter(is_active=True).order_by("-created_at")[:5]

    # 🔹 Companies with prefetched data
    companies = Company.objects.select_related("user").prefetch_related(
        Prefetch("products", queryset=products_qs[:10], to_attr="prefetched_products"),
        Prefetch("flyers", queryset=flyers_qs, to_attr="prefetched_flyers"),
    )

    # 🔹 Limit products inside categories (IMPORTANT)
    category_products_qs = active_products.order_by("-created_at")

    categories = Category.objects.prefetch_related(
        Prefetch(
            "subcategories",
            queryset=SubCategory.objects.prefetch_related(
                Prefetch(
                    "products",
                    queryset=category_products_qs[:20],
                    to_attr="prefetched_products"
                )
            ),
        ),
        Prefetch(
            "products",
            queryset=category_products_qs.filter(subcategory__isnull=True)[:20],
            to_attr="prefetched_products"
        ),
    )

    # ✅ Cache result
    cache.set(CACHE_KEY, (companies, categories), CACHE_TIMEOUT)

    return companies, categories