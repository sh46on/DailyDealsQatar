from urllib import request
from rest_framework import status
from django.db.models import Q, F
from django.core.paginator import Paginator, EmptyPage
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from marketplace.models import *
from django.db.models import Prefetch
from marketplace.serializers import *
from rest_framework.pagination import PageNumberPagination
from deals_app.models import User


class ProductListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # ---------------- BASE QUERY ----------------
            queryset = (
                Product.objects.filter(is_active=True)
                .exclude(seller=request.user)
                .select_related("seller", "category")
                .prefetch_related("images")
                .order_by("-created_at")
            )

            # ---------------- FILTERS ----------------
            category = request.GET.get("category")
            city = request.GET.get("city")
            search = request.GET.get("search")

            if category:
                queryset = queryset.filter(category__slug__iexact=category)

            if city:
                queryset = queryset.filter(city__icontains=city)

            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )

            # ---------------- PAGINATION ----------------
            page = request.GET.get("page", 1)
            limit = request.GET.get("limit", 10)

            try:
                limit = int(limit)
                if limit > 50:
                    limit = 50  # prevent heavy queries
            except:
                limit = 10

            paginator = Paginator(queryset, limit)

            try:
                paginated_data = paginator.page(page)
            except EmptyPage:
                paginated_data = paginator.page(paginator.num_pages)

            # ---------------- SERIALIZER ----------------
            serializer = ProductListSerializer(
                paginated_data,
                many=True,
                context={"request": request},  # important for image URLs
            )

            return Response(
                {
                    "success": True,
                    "count": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": int(page),
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch products",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class HomeProductListAPIView(APIView):

    def get(self, request):
        try:
            # ---------------- BASE QUERY ----------------
            queryset = (
                Product.objects.filter(is_active=True)
                .select_related("seller", "category")
                .prefetch_related("images")
                .order_by("-created_at")
            )

            # ---------------- FILTERS ----------------
            category = request.GET.get("category")
            city = request.GET.get("city")
            search = request.GET.get("search")

            if category:
                queryset = queryset.filter(category__slug__iexact=category)

            if city:
                queryset = queryset.filter(city__icontains=city)

            if search:
                queryset = queryset.filter(
                    Q(title__icontains=search) | Q(description__icontains=search)
                )
            top_ids = list(queryset.values_list("id", flat=True)[:12])

            if top_ids:
                Product.objects.filter(id__in=top_ids).update(
                    view_count=F("view_count") + 1
                )
            # ---------------- PAGINATION ----------------
            page = request.GET.get("page", 1)
            limit = request.GET.get("limit", 10)

            try:
                limit = int(limit)
                if limit > 50:
                    limit = 50  # prevent heavy queries
            except:
                limit = 10

            paginator = Paginator(queryset, limit)

            try:
                paginated_data = paginator.page(page)
            except EmptyPage:
                paginated_data = paginator.page(paginator.num_pages)

            # ---------------- SERIALIZER ----------------
            serializer = ProductListSerializer(
                paginated_data,
                many=True,
                context={"request": request},  # important for image URLs
            )

            return Response(
                {
                    "success": True,
                    "count": paginator.count,
                    "total_pages": paginator.num_pages,
                    "current_page": int(page),
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Failed to fetch products",
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class NotificationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            ProductRequest.objects.filter(seller=request.user)
            .select_related(
                "product", "buyer", "buyer__marketplace_profile"  # 🔥 IMPORTANT
            )
            .prefetch_related(
                Prefetch("product__images", queryset=ProductImage.objects.only("image"))
            )
            .only(
                "id",
                "status",
                "is_read",
                "created_at",
                # product
                "product__id",
                "product__title",
                "product__price",
                "product__city",
                # buyer basic
                "buyer__first_name",
                "buyer__last_name",
                "buyer__email",
                "buyer__phone",
                # profile
                "buyer__marketplace_profile__city",
                "buyer__marketplace_profile__state",
                "buyer__marketplace_profile__address",
                "buyer__marketplace_profile__profile_image",
            )
            .order_by("is_read", "-created_at")
        )

        unread_count = qs.filter(is_read=False).count()

        serializer = NotificationSerializer(qs, many=True, context={"request": request})

        return Response(
            {
                "success": True,
                "count": unread_count,
                "total": qs.count(),
                "data": serializer.data,
            }
        )


class UpdateRequestStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            obj = ProductRequest.objects.get(id=pk, seller=request.user)

            status_value = request.data.get("status")

            if status_value not in ["accepted", "rejected", "pending"]:
                return Response({"error": "Invalid status"}, status=400)

            obj.status = status_value
            obj.save()

            return Response({"success": True, "status": obj.status})

        except ProductRequest.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class MarkNotificationReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        updated = ProductRequest.objects.filter(id=pk, seller=request.user).update(
            is_read=True
        )

        if not updated:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"success": True})


class MarkAllNotificationsReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ProductRequest.objects.filter(seller=request.user, is_read=False).update(
            is_read=True
        )

        return Response({"success": True})


class SavedProductsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Cart.objects.filter(user=request.user)
            .select_related("product")
            .prefetch_related("product__images")
            .order_by("-created_at")
        )

        serializer = SavedProductSerializer(qs, many=True, context={"request": request})

        return Response({"success": True, "count": qs.count(), "data": serializer.data})


class ToggleSaveProductAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        user = request.user

        obj = Cart.objects.filter(user=user, product_id=product_id).first()

        if obj:
            obj.delete()
            return Response({"saved": False, "message": "Removed from saved"})

        Cart.objects.create(user=user, product_id=product_id)

        return Response({"saved": True, "message": "Saved successfully"})


class RequestProductAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, product_id):
        user = request.user

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        # BLOCK OWN PRODUCT
        if product.seller == user:
            return Response(
                {"error": "You cannot request your own product"}, status=400
            )

        obj, created = ProductRequest.objects.get_or_create(
            product=product,
            buyer=user,
            defaults={
                "seller": product.seller,
                "message": request.data.get("message", ""),
            },
        )
        if created:
            Product.objects.filter(id=product.id).update(view_count=F("view_count") + 1)

        return Response({"success": True, "requested": True, "created": created})


class MyInterestsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            ProductRequest.objects.filter(buyer=request.user)
            .select_related("product")
            .prefetch_related("product__images")
            .order_by("-created_at")
        )

        serializer = MyInterestSerializer(qs, many=True, context={"request": request})

        return Response({"success": True, "count": qs.count(), "data": serializer.data})


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        serializer = UserProfileSerializer(profile, context={"request": request})

        return Response({"success": True, "data": serializer.data})

    def put(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        serializer = UserProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})

        return Response(serializer.errors, status=400)


class SellerProductsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = (
            Product.objects.filter(seller=request.user)
            .prefetch_related("images")
            .order_by("-created_at")
        )

        serializer = SellerProductSerializer(
            qs, many=True, context={"request": request}
        )

        return Response({"success": True, "count": qs.count(), "data": serializer.data})

    def post(self, request):
        serializer = SellerProductSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            serializer.is_active = True  # new products are active by default
            product = serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Product created",
                    "product_id": product.id,
                },
                status=201,
            )

        # RETURN REAL ERROR
        return Response({"success": False, "errors": serializer.errors}, status=400)


class SellerProductDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Product.objects.get(id=pk, seller=user)
        except Product.DoesNotExist:
            return None

    def put(self, request, pk):
        product = self.get_object(pk, request.user)

        if not product:
            return Response({"error": "Not found"}, status=404)

        serializer = UpdateSellerProductSerializer(
            product, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Updated"})

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        product = self.get_object(pk, request.user)

        if not product:
            return Response({"error": "Not found"}, status=404)

        product.delete()

        return Response({"success": True, "message": "Deleted"})


class ToggleProductStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(id=pk, seller=request.user)
        except Product.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        product.is_active = not product.is_active
        product.save()

        return Response({"success": True, "is_active": product.is_active})


class CartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = Cart.objects.filter(user=request.user).values_list(
            "product_id", flat=True
        )
        return Response({"success": True, "data": list(items)})

    def post(self, request):
        product_id = request.data.get("product_id")

        if not product_id:
            return Response({"error": "Product required"}, status=400)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Invalid product"}, status=404)

        # BLOCK OWN PRODUCT
        if product.seller == request.user:
            return Response({"error": "You cannot add your own product"}, status=400)

        obj, created = Cart.objects.get_or_create(user=request.user, product=product)
        if created:
            Product.objects.filter(id=product.id).update(view_count=F("view_count") + 1)

        return Response({"success": True, "already_exists": not created})


class RemoveCartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        Cart.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({"success": True})


class ProductRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Invalid product"}, status=404)

        if product.seller == request.user:
            return Response({"error": "Cannot request your own product"}, status=400)

        obj, created = ProductRequest.objects.get_or_create(
            product=product, buyer=request.user, defaults={"seller": product.seller}
        )
        if created:
            Product.objects.filter(id=product.id).update(view_count=F("view_count") + 1)

        return Response({"success": True, "already_requested": not created})


class UserRequestedProductsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ProductRequest.objects.filter(buyer=request.user).values_list(
            "product_id", flat=True
        )

        return Response({"success": True, "data": list(qs)})


# List all listings
class AdminListingsView(APIView):
    def get(self, request):
        products = Product.objects.select_related("seller", "category").order_by(
            "-created_at"
        )
        serializer = AdminListingSerializer(products, many=True)
        return Response(serializer.data)


# Toggle activate / deactivate
class ToggleListingStatusView(APIView):
    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.is_active = not product.is_active
            product.save()
            return Response(
                {"message": "Status updated", "is_active": product.is_active}
            )
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)


# Delete listing
class DeleteListingView(APIView):
    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.delete()
            return Response(
                {"message": "Product deleted"}, status=status.HTTP_204_NO_CONTENT
            )
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)



class AdminUserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50



# List users with pagination
class AdminUserListView(APIView):
    def get(self, request):
        queryset = UserProfile.objects.select_related("user").order_by("-created_at")

        paginator = AdminUserPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = AdminUserProfileSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# Delete user (cascade deletes profile)
class AdminDeleteUserView(APIView):
    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(
                {"message": "User deleted"}, status=status.HTTP_204_NO_CONTENT
            )
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
