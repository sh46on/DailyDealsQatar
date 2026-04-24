from django.db.models import Count, F
from rest_framework.views import APIView
from rest_framework.response import Response
from marketplace.models import Product, Cart, ProductRequest
from deals_app.models import User
from django.db.models import Value
from django.db.models.functions import Concat



class CategoryAnalyticsView(APIView):
    def get(self, request):

        # Most Viewed
        viewed = (
            Product.objects.values(
                "id",
                "title",
                category_name=F("category__name"),  # renamed
            )
            .annotate(total_views=F("view_count"))
            .order_by("-total_views")[:10]
        )

        # Most Saved
        saved = (
            Cart.objects.values(
                prod_id=F("product__id"),
                product_title=F("product__title"),
                category_name=F("product__category__name"),
            )
            .annotate(total_saves=Count("id"))
            .order_by("-total_saves")[:10]
        )

        # Most Requested
        requested = (
            ProductRequest.objects.values(
                prod_id=F("product__id"),
                product_title=F("product__title"),
                category_name=F("product__category__name"),
            )
            .annotate(total_requests=Count("id"))
            .order_by("-total_requests")[:10]
        )

        return Response(
            {
                "most_viewed": viewed,
                "most_saved": saved,
                "most_requested": requested,
            }
        )



class UserActivityDashboardView(APIView):
    def get(self, request):

        users = (
            User.objects.annotate(
                full_name=Concat("first_name", Value(" "), "last_name"),
                total_products=Count("marketplace_products"),
                total_requests=Count("product_requests"),
                total_cart=Count("cart_items"),
            )
            .values(
                "id",
                "full_name",
                "total_products",
                "total_requests",
                "total_cart",
            )
            .order_by("-total_requests")[:10]
        )

        return Response(users)
