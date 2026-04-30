from deals_app.tasks import refresh_homepage_cache, send_company_email_task
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import DatabaseError, transaction
from deals_app.serializers import *
from deals_app.service import get_homepage_data
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.utils.timezone import now
from deals_app.models import *
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from deals_app.email_utils import send_company_credentials
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.pagination import PageNumberPagination
import logging
import random       
import string
import time
import re
from rest_framework.exceptions import NotFound

User = get_user_model()
logger = logging.getLogger(__name__)


from django.db.models import F
from rest_framework.views import APIView
from rest_framework.response import Response

class ProductDetailAPIView(APIView):
    def get(self, request, slug):
        product = Product.objects.get(slug=slug, is_active=True)

        # atomic increment
        Product.objects.filter(id=product.id).update(
            view_count=F("view_count") + 1
        )

        product.refresh_from_db()

        return Response({
            "success": True,
            "data": ProductSerializer(product).data
        })



class StandardPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = "page_size"
    max_page_size = 50


from rest_framework.exceptions import NotFound


class SeparateParamPagination(StandardPagination):
    """Subclass that reads a custom page-query param so products and flyers
    never share the same ?page= key."""

    def __init__(self, page_query_param="page"):
        super().__init__()
        self.page_query_param = page_query_param


class HomePageAPIView(APIView):
    permission_classes = []

    def get(self, request):
        category_id   = request.GET.get("category")
        sub_id        = request.GET.get("sub")
        company_id    = request.GET.get("company")   # for flyer company filter
        category_type = request.GET.get("type")      # for flyer type filter
        product_paginator = SeparateParamPagination(page_query_param="page")

        # paginated_products = product_paginator.paginate_queryset(products, request)
        # ---------- CACHE ----------
        try:
            companies  = cache.get("homepage_companies")
            categories = cache.get("homepage_categories")

            if companies is None or categories is None:
                try:
                    refresh_homepage_cache()
                except Exception:
                    pass

                from deals_app.service import get_homepage_data
                companies_qs, categories_qs = get_homepage_data()
                companies  = CompanySerializer(companies_qs,  many=True).data
                categories = CategorySerializer(categories_qs, many=True).data

        except Exception:
            from deals_app.service import get_homepage_data
            companies_qs, categories_qs = get_homepage_data()
            companies  = CompanySerializer(companies_qs,  many=True).data
            categories = CategorySerializer(categories_qs, many=True).data

        # ---------- PRODUCTS  (param: ?page=N) — unchanged ----------
        products = (
            Product.objects
            .filter(is_active=True)
            .select_related("category", "subcategory", "company")
        )
        if category_id:
            products = products.filter(category_id=category_id)
        if sub_id:
            products = products.filter(subcategory_id=sub_id)
        products = products.order_by("-created_at")


        try:
            paginated_products = product_paginator.paginate_queryset(products, request)
        except NotFound:
            return Response({
                "count":    0,
                "next":     None,
                "previous": None,
                "results":  [],
                "success":  True,
                "companies":  companies  or [],
                "categories": categories or [],
                "pdfs": {"count": 0, "next": None, "previous": None, "results": []},
            })

        products_data = ProductSerializer(paginated_products, many=True).data

        # ---------- FLYERS ----------
        flyers = (
            DealFlyer.objects
            .filter(is_active=True)
            .select_related("company")
            .order_by("-created_at")
        )

        # Apply filters when provided
        if company_id:
            try:
                flyers = flyers.filter(company_id=int(company_id))
            except (ValueError, TypeError):
                pass  # ignore malformed company_id

        if category_type:
            flyers = flyers.filter(category_type__iexact=category_type.strip())

        # Only paginate when NO filters are active (i.e. "All Offers" with no company).
        # When filtering by type or company, return ALL matching flyers so the frontend
        # can display them without pagination controls.
        use_flyer_pagination = not company_id and not category_type

        if use_flyer_pagination:
            flyer_paginator = SeparateParamPagination(page_query_param="flyer_page")
            try:
                flyers_page = flyer_paginator.paginate_queryset(flyers, request)
            except NotFound:
                flyers_page = []
            flyers_data  = DealFlyerSerializer(flyers_page or [], many=True).data
            flyers_count = flyers.count()
            flyers_next  = flyer_paginator.get_next_link()     if flyers_page else None
            flyers_prev  = flyer_paginator.get_previous_link() if flyers_page else None
        else:
            # Return all matching flyers — no pagination
            all_flyers   = list(flyers)
            flyers_data  = DealFlyerSerializer(all_flyers, many=True).data
            flyers_count = len(all_flyers)
            flyers_next  = None
            flyers_prev  = None
            
        ids = [obj.id for obj in paginated_products] if paginated_products else []

        if ids:
            Product.objects.filter(id__in=ids).update(
                view_count=F("view_count") + 1
            )
        # ---------- RESPONSE ----------
        response = product_paginator.get_paginated_response(products_data)

        response.data.update({
            "success":    True,
            "companies":  companies  or [],
            "categories": categories or [],
            "products":   response.data.get("results", []),
            "pdfs": {
                "count":    flyers_count,
                "next":     flyers_next,
                "previous": flyers_prev,
                "results":  flyers_data,
            },
        })

        return response

# Admin


class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = AdminUserSerializer(request.user)
        return Response(serializer.data)


from django.utils.timezone import now
class AdminDashboardAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Sum

        try:
            # ── Counts ──
            total_users          = User.objects.count()
            total_companies      = Company.objects.count()
            total_products       = Product.objects.count()
            total_categories     = Category.objects.count()
            total_flyers         = DealFlyer.objects.count()
            total_reviews        = ProductReview.objects.count()
            active_products      = Product.objects.filter(is_active=True).count()
            featured_products    = Product.objects.filter(is_featured=True).count()
            total_saved_products = SavedProduct.objects.count()

            # ── Category views ──
            category_views = [
                {"name": c["name"], "views": c["total_views"] or 0}
                for c in (
                    Category.objects
                    .annotate(total_views=Sum("products__view_count"))
                    .values("name", "total_views")
                    .order_by("-total_views")[:6]
                )
            ]

            # ── Top products ──
            top_products = [
                {
                    "name": p.name,
                    "views": p.view_count,
                    "category": p.category.name if p.category else "Uncategorized",
                }
                for p in Product.objects.select_related("category").order_by("-view_count")[:5]
            ]

            # ── Recent users ──
            recent_users = [
                {"phone": u.phone, "role": u.role}
                for u in User.objects.only("phone", "role").order_by("-date_joined")[:5]
            ]

            return Response({
                "total_users":          total_users,
                "total_companies":      total_companies,
                "total_products":       total_products,
                "total_categories":     total_categories,
                "total_flyers":         total_flyers,
                "total_reviews":        total_reviews,
                "active_products":      active_products,
                "featured_products":    featured_products,
                "total_saved_products": total_saved_products,
                "top_products":         top_products,
                "recent_users":         recent_users,
                "category_views":       category_views,
                "server_time":          now(),
            })

        except Exception as e:
            return Response({"error": str(e)}, status=500)

class AdminCompanyListCreateAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # companies = Company.objects.filter("user")
        companies = Company.objects.select_related("user").prefetch_related(
            "products", "flyers"
        )
        serializer = AdminCompanySerializer(companies, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminCompanySerializer(data=request.data)

        if serializer.is_valid():
            company = serializer.save()
            return Response(
                AdminCompanySerializer(company).data, status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCompanyDetailAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        return get_object_or_404(Company, pk=pk)

    def put(self, request, pk):
        company = self.get_object(pk)
        serializer = AdminCompanySerializer(company, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        company = self.get_object(pk)

        with transaction.atomic():
            user = company.user
            company.delete()
            user.delete()  # delete user + company safely

        return Response({"message": "Deleted successfully"})


class ToggleCompanyStatusAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        company = get_object_or_404(Company, pk=pk)
        user = company.user

        user.is_active = not user.is_active
        if not user.date_joined:
            user.date_joined = time.timezone.now()
        user.save(update_fields=["is_active", "date_joined"])

        return Response({"status": "updated", "is_active": user.is_active})


class AdminUserListCreateAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.filter(role=User.USER).order_by("-date_joined")
        serializer = AdminUserSerializer(users, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        serializer = AdminUserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"success": True, "data": AdminUserSerializer(user).data},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = AdminUserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response({"success": True})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)


class ToggleUserStatusAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        user.is_active = not user.is_active
        user.is_verified = user.is_active
        if not user.date_joined:
            user.date_joined = timezone.now()

        user.save(update_fields=["is_active", "is_verified", "date_joined"])

        return Response(
            {
                "success": True,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
            }
        )


class AppSettingsAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self):
        return AppSettings.objects.first() or AppSettings.objects.create(
            app_name="Daily Deals Qatar"
        )

    def get(self, request):
        settings_obj = self.get_object()
        serializer = AppSettingsSerializer(settings_obj, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        settings_obj = self.get_object()

        serializer = AppSettingsSerializer(
            settings_obj, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)


class AdminProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser] 

    def get(self, request):
        serializer = AdminProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        serializer = AdminProfileSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class AdminFlyerListAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        flyers = DealFlyer.objects.all()
        serializer = AdminDealFlyerSerializer(
            flyers, many=True, context={"request": request}
        )
        return Response(serializer.data)




class ToggleFlyerAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            flyer = get_object_or_404(DealFlyer, pk=pk)

            new_status = not flyer.is_active

            # SAFE update (no validation crash)
            updated = DealFlyer.objects.filter(pk=pk).update(is_active=new_status)

            if not updated:
                return Response({"error": "Update failed"}, status=400)

            return Response({
                "success": True,
                "is_active": new_status
            })

        except Exception as e:
            return Response({
                "error": "Toggle failed",
                "details": str(e)
            }, status=500)


class DeleteFlyerAPIView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            flyer = DealFlyer.objects.get(pk=pk)
            flyer.delete()
            return Response({"success": True})
        except DealFlyer.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class AdminProductListAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        products = Product.objects.select_related(
            "company", "category", "subcategory"
        ).all()

        serializer = AdminProductSerializer(
            products, many=True, context={"request": request}
        )
        return Response(serializer.data)


class ToggleProductAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.is_active = not product.is_active
            product.save()

            return Response({"success": True, "is_active": product.is_active})
        except Product.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class ToggleFeaturedAPIView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.is_featured = not product.is_featured
            product.save()

            return Response({"success": True, "is_featured": product.is_featured})
        except Product.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class DeleteProductAPIView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            product.delete()
            return Response({"success": True})
        except Product.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class AdminCategoryAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        categories = Category.objects.prefetch_related("subcategories").all()
        serializer = AdminCategorySerializer(
            categories, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = AdminCategorySerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class CategoryDetailAPIView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        serializer = AdminCategorySerializer(
            category, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            category = Category.objects.get(pk=pk)
            category.delete()
            return Response({"success": True})
        except Category.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class SubCategoryCreateAPIView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AdminSubCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class SubCategoryDetailAPIView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        try:
            sub = SubCategory.objects.get(pk=pk)
        except SubCategory.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        serializer = AdminSubCategorySerializer(sub, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            sub = SubCategory.objects.get(pk=pk)
            sub.delete()
            return Response({"success": True})
        except SubCategory.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


class PublicAppSettingsAPIView(APIView):
    permission_classes = []

    def get(self, request):
        settings_obj = AppSettings.objects.first()

        if not settings_obj:
            settings_obj = AppSettings(app_name="Daily Deals Qatar", city="Doha")

        serializer = AppSettingsSerializer(settings_obj, context={"request": request})

        return Response(serializer.data)


# ---------------------------Company PDF Parsing (EXPERIMENTAL)---------------------------


class CompanyCurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CompanyUserSerializer(request.user)
        return Response(serializer.data)


class CompanyDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "company":
            return Response({"error": "Not authorized"}, status=403)

        company = user.company

        data = {
            "company": company.name,
            "profilePic": company.logo.url if company.logo else None,
            "total_products_saved": Product.objects.filter(
                company=company
            ).count(),
            "total_flyers_saved": SavedProduct.objects.filter(
                flyer__company=company
            ).count(),
            "total_flyers": DealFlyer.objects.filter(company=company).count(),
            "flyers": DealFlyer.objects.filter(company=company).values(
                "id", "title", "is_active", "pdf", "start_date", "end_date"
            ),
        }

        return Response(data)


class CompanyProductListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company
        products = Product.objects.filter(company=company)

        from deals_app.serializers import CompanyProductSerializer

        return Response(CompanyProductSerializer(products, many=True).data)


# class CompanyFlyerCreateAPIView(APIView):
#     permission_classes = [IsAuthenticated]
#     parser_classes = [MultiPartParser, FormParser]

#     def post(self, request):
#         user = request.user

#         if user.role != "company":
#             return Response({"error": "Not allowed"}, status=403)

#         serializer = CompanyDealFlyerSerializer(data=request.data)

#         if serializer.is_valid():
#             serializer.save(company=user.company)  #  attach company
#             return Response({"success": True, "data": serializer.data})

#         return Response(serializer.errors, status=400)


#------------------------------

from deals_app.ocr_utils import process_flyer, get_or_create_category
from decimal import Decimal, ROUND_HALF_UP
from django.core.files.base import ContentFile
import uuid
import cv2
import numpy as np


class CompanyFlyerCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user

        if user.role != "company":
            return Response({"error": "Not allowed"}, status=403)

        serializer = CompanyDealFlyerSerializer(data=request.data)

        if serializer.is_valid():
            flyer = serializer.save(company=user.company)

            try:
                pdf_path = flyer.pdf.path

                # ✅ FIX: unpack result
                result = process_flyer(pdf_path)
                products_data = result.get("products", [])
                images = result.get("images", [])

                for index, item in enumerate(products_data):
                    try:
                        name = item.get("name")
                        raw_price = item.get("price", 0)

                        if not name:
                            continue

                        try:
                            price = Decimal(str(raw_price)).quantize(
                                Decimal("0.01"),
                                rounding=ROUND_HALF_UP
                            )
                        except:
                            continue

                        if price <= 0:
                            continue

                        # 🔥 OLD PRICE
                        old_price = item.get("old_price")
                        if old_price:
                            try:
                                old_price = Decimal(str(old_price)).quantize(
                                    Decimal("0.01"),
                                    rounding=ROUND_HALF_UP
                                )
                            except:
                                old_price = None

                        # 🔥 CATEGORY
                        category, subcategory = get_or_create_category(
                            item.get("category"),
                            item.get("subcategory")
                        )

                        # 🔥 IMAGE (basic mapping)
                        image_file = None
                        if index < len(images):
                            try:
                                img = images[index]
                                _, buffer = cv2.imencode(".jpg", np.array(img))
                                image_file = ContentFile(
                                    buffer.tobytes(),
                                    name=f"{uuid.uuid4()}.jpg"
                                )
                            except:
                                pass

                        product, created = Product.objects.get_or_create(
                            company=user.company,
                            name=name.strip(),
                            is_featured = True,
                            defaults={
                                "price": price,
                                "old_price": old_price,
                                "description": item.get("description", ""),
                                "quantity": item.get("quantity", ""),
                                "category": category,
                                "subcategory": subcategory,
                                "image": image_file
                            }
                        )

                        FlyerProduct.objects.get_or_create(
                            flyer=flyer,
                            product=product,
                            defaults={"page_number": 1}
                        )

                    except Exception as e:
                        print("⚠️ Product skipped:", e)
                        continue

            except Exception as e:
                print("❌ OCR Error:", str(e))

            return Response({
                "success": True,
                "data": serializer.data
            })

        return Response(serializer.errors, status=400)


#------------------------------


class CompanyProfileUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):

        serializer = UserCompanyUpdateSerializer(
            request.user, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True})

        return Response(serializer.errors, status=400)


class CompanyFlyerListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.user.company

        flyers = DealFlyer.objects.filter(company=company).order_by("-created_at")

        serializer = CompanyDealFlyerSerializer(flyers, many=True)
        return Response(serializer.data)


class CompanyFlyerUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        company = request.user.company
        flyer = get_object_or_404(DealFlyer, id=pk, company=company)

        serializer = CompanyDealFlyerSerializer(flyer, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})

        return Response(serializer.errors, status=400)


class CompanyFlyerDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        company = request.user.company
        flyer = get_object_or_404(DealFlyer, id=pk, company=company)

        flyer.delete()
        return Response({"success": True})


class CompanyFlyerToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        company = request.user.company
        flyer = get_object_or_404(DealFlyer, id=pk, company=company)

        DealFlyer.objects.filter(id=pk).update(is_active=not flyer.is_active)
        flyer.refresh_from_db() 

        return Response({"success": True, "is_active": flyer.is_active})


class CompanyFlyerReviewsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "company":
            return Response({"error": "Not allowed"}, status=403)

        company = user.company

        flyers = DealFlyer.objects.filter(company=company).annotate(
            avg_rating=Avg("reviews__rating"),
            total_reviews=Count("reviews")
        ).prefetch_related("reviews")

        data = []

        for flyer in flyers:
            reviews_qs = ProductReview.objects.filter(flyer=flyer, flyer__isnull=False)

            stats = reviews_qs.aggregate(avg_rating=Avg("rating"), total=Count("id"))

            data.append(
                {
                    "flyer_id": flyer.id,
                    "flyer_title": flyer.title,
                    "avg_rating": round(stats["avg_rating"] or 0, 1),
                    "total_reviews": stats["total"],
                    "reviews": ProductReviewSerializer(reviews_qs, many=True).data,
                }
            )

        return Response(data)


class CompanyProductListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        company = request.user.company

        products = Product.objects.filter(company=company).order_by("-created_at")
        serializer = ManageCompanyProductSerializer(products, many=True)

        return Response(serializer.data)

    def post(self, request):
        company = request.user.company

        serializer = ManageCompanyProductSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(company=company)
            return Response({"success": True, "data": serializer.data})

        return Response(serializer.errors, status=400)


class CompanyProductUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, pk):
        company = request.user.company

        product = get_object_or_404(Product, id=pk, company=company)

        serializer = ManageCompanyProductSerializer(
            product, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})

        return Response(serializer.errors, status=400)


class CompanyProductDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        company = request.user.company

        product = get_object_or_404(Product, id=pk, company=company)
        product.delete()

        return Response({"success": True})


class CompanyProductToggleAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        company = request.user.company

        product = get_object_or_404(Product, id=pk, company=company)

        product.is_active = not product.is_active
        product.save()

        return Response({"success": True, "is_active": product.is_active})


# ---------------------------User Module---------------------------



CACHE_KEY = "user_navbar"


class UserNavbarAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f"{CACHE_KEY}_{request.user.id}"

        try:
            data = cache.get(cache_key)
        except Exception:
            data = None  # fallback if Redis fails


        if not data:
            serializer = UserNavbarSerializer(
                request.user, context={"request": request}
            )
            data = serializer.data
            try:
                cache.set(cache_key, data, 300)
            except Exception:
                pass  # ignore cache failure

        return Response({"success": True, "data": data})


from django.db.models import Avg, Count, Value, FloatField
from django.db.models.functions import Coalesce

class UserDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        Product.objects.update(view_count=F("view_count") + 1)
        products = Product.objects.filter(is_active=True).select_related("company")

        flyers = DealFlyer.objects.filter(is_active=True).select_related("company").annotate(
            avg_rating=Coalesce(Avg("reviews__rating"), Value(0.0), output_field=FloatField()),
            review_count=Count("reviews", distinct=True)
        )

        companies = Company.objects.all()
        categories = Category.objects.prefetch_related("subcategories")

        saved_products = SavedProduct.objects.filter(user=user, product__isnull=False)
        saved_flyers = SavedProduct.objects.filter(user=user, flyer__isnull=False)

        data = {
            "total_flyers": flyers.count(),
            "total_products": products.count(),
            "total_categories": categories.count(),
            "reviews": ProductReview.objects.filter(user=user).count(),

            "companies": companies,
            "products": products,
            "flyers": flyers,
            "categories": categories,

            "saved_product_ids": list(saved_products.values_list("product_id", flat=True)),
            "saved_flyer_ids": list(saved_flyers.values_list("flyer_id", flat=True)),
        }

        serializer = UserDashboardSerializer(instance=data)
        return Response({"success": True, "data": serializer.data})


class ToggleSaveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        product_id = request.data.get("product_id")
        flyer_id = request.data.get("flyer_id")

        if not product_id and not flyer_id:
            return Response(
                {"error": "product_id or flyer_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if product_id and flyer_id:
            return Response(
                {"error": "Send only one of product_id or flyer_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if product_id:
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({"error": "Product not found"}, status=404)

            obj, created = SavedProduct.objects.get_or_create(
                user=user,
                product=product,
            )

        else:
            try:
                flyer = DealFlyer.objects.get(id=flyer_id)
            except DealFlyer.DoesNotExist:
                return Response({"error": "Flyer not found"}, status=404)

            obj, created = SavedProduct.objects.get_or_create(
                user=user,
                flyer=flyer,
            )

        if not created:
            obj.delete()
            return Response({"success": True, "saved": False})

        return Response({"success": True, "saved": True})


class SavedItemsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        saved_items = (
            SavedProduct.objects.filter(user=user)
            .select_related("product", "flyer")
            .order_by("-created_at")
        )

        serializer = SavedItemSerializer(saved_items, many=True)

        return Response(
            {"success": True, "count": len(serializer.data), "data": serializer.data}
        )


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            cache.delete(f"user_navbar_{request.user.id}")
            return Response({"success": True, "data": serializer.data})

        return Response(serializer.errors, status=400)


# ----------------------- Company Request Module -----------------------


class CompanyRequestCreateAPIView(APIView):

    def post(self, request):
        serializer = CompanyRequestSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Request submitted"})

        return Response(serializer.errors, status=400)


class CompanyRequestListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "admin":
            return Response({"error": "Unauthorized"}, status=403)

        qs = CompanyRequest.objects.filter().order_by("-created_at")

        serializer = CompanyRequestSerializer(qs, many=True)

        return Response({"success": True, "data": serializer.data})



class ApproveCompanyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    # ---------- helpers ----------
    def _generate_password(self, length=8):
        return "".join(random.choices(string.ascii_letters + string.digits, k=length))

    def _sanitize_password(self, raw):
        if isinstance(raw, dict):
            raw = raw.get("password")

        if not isinstance(raw, str):
            raw = ""

        raw = raw.strip()

        if len(raw) < 6:
            return self._generate_password()

        return raw

    def _sanitize_email(self, email):
        email = (email or "").strip()

        # fix double @ issue
        if email.count("@") > 1:
            email = email.split("@")[0] + "@gmail.com"

        # validate format
        if not re.match(r"^[^@]+@[^@]+\.[^@]+$", email):
            return None

        return email

    # ---------- main ----------
    def post(self, request, pk):

        # ---------- auth ----------
        if request.user.role != "admin":
            return Response({"error": "Unauthorized"}, status=403)

        try:
            obj = CompanyRequest.objects.get(id=pk, is_approved=False)
        except CompanyRequest.DoesNotExist:
            return Response({"error": "Not found or already approved"}, status=404)

        # ---------- sanitize inputs ----------
        final_password = self._sanitize_password(request.data.get("password"))
        email = self._sanitize_email(obj.email)
        try:
            with transaction.atomic():

                # ---------- user (idempotent) ----------
                user, _ = User.objects.get_or_create(
                    phone=obj.phone,
                    defaults={
                        "email": email,
                        "first_name": obj.first_name or "",
                        "last_name": obj.last_name or "",
                        "role": "company",
                    },
                )

                # ALWAYS set password (source of truth)
                user.set_password(final_password)

                if email:
                    user.email = email

                user.first_name = obj.first_name or user.first_name
                user.last_name = obj.last_name or user.last_name
                user.role = "company"

                user.save()
                print(
                    f"[APPROVAL DEBUG] Phone: {user.phone} | Password: {final_password}"
                )

                # ---------- company (avoid duplicate) ----------
                company, created = Company.objects.get_or_create(
                    user=user,
                    defaults={
                        "name": obj.company_name or "Unnamed Company",
                        "description": obj.description or "",
                        "address": obj.address or "",
                        "city": obj.city or "",
                    },
                )

                # ---------- mark approved ----------
                obj.is_approved = True
                obj.save()

        except Exception as e:
            return Response({"error": "Approval failed", "details": str(e)}, status=500)

        # ---------- email (non-blocking) ----------
        email_status = "skipped"

        if email:
            try:
                send_company_email_task(email, final_password, obj.company_name)
                email_status = "queued"
            except Exception as e:
                email_status = f"error ({str(e)})"

        # ---------- response ----------    
        return Response(
            {
                "success": True,
                "message": "Company approved successfully",
                "email_status": email_status,
                "user_id": user.id,
                "company_id": company.id,
            }
        )


class RejectCompanyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != "admin":
            return Response({"error": "Unauthorized"}, status=403)

        CompanyRequest.objects.filter(id=pk).update(is_rejected=True)

        return Response({"success": True})




from rest_framework import status
from django.shortcuts import get_object_or_404

# GET reviews for a flyer
class FlyerReviewListAPIView(APIView):
    def get(self, request, flyer_id):
        reviews = ProductReview.objects.filter(flyer_id=flyer_id).select_related("user")
        serializer = FlyerReviewSerializer(reviews, many=True)
        return Response({"success": True, "data": serializer.data})


# POST / UPDATE review
class FlyerReviewCreateUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, flyer_id):
        flyer = get_object_or_404(DealFlyer, id=flyer_id)

        review, created = ProductReview.objects.update_or_create(
            user=request.user,
            flyer=flyer,
            defaults={
                "rating": request.data.get("rating"),
                "comment": request.data.get("comment"),
            },
        )

        serializer = FlyerReviewSerializer(review)
        return Response({
            "success": True,
            "message": "Review created" if created else "Review updated",
            "data": serializer.data
        }, status=status.HTTP_200_OK)