from celery import shared_task
from django.core.cache import cache
from django.utils import timezone
from django.db import connection, transaction
from django.db.models import F
import logging
import re

from deals_app.models import Product, DealFlyer, FlyerProduct
from deals_app.email_utils import send_company_credentials
from deals_app.service import get_homepage_data
from deals_app.serializers import CategorySerializer, CompanySerializer

logger = logging.getLogger(__name__)


# ---------------- EMAIL ----------------
# @shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, max_retries=3, queue="email")
def send_company_email_task(self, email, password, company_name):
    try:
        send_company_credentials(email, password, company_name)
        logger.info(f"Email sent to {email}")
    except Exception as e:
        logger.error(f"Email failed: {str(e)}")
        raise self.retry(exc=e)


# ---------------- EXPIRE FLYERS ----------------
# @shared_task(queue="default")
def expire_flyers():
    today = timezone.now().date()

    count = DealFlyer.objects.filter(
        end_date__lt=today,
        is_active=True
    ).update(is_active=False)

    logger.info(f"{count} flyers expired")


# ---------------- HOMEPAGE CACHE ----------------
# @shared_task(queue="default")
def refresh_homepage_cache():
    try:
        companies, categories = get_homepage_data()

        cache.set(
            "homepage_companies",
            CompanySerializer(companies, many=True).data,
            300
        )
        cache.set(
            "homepage_categories",
            CategorySerializer(categories, many=True).data,
            300
        )

        logger.info("Homepage cache refreshed")

    except Exception as e:
        logger.error(f"Homepage cache failed: {str(e)}")


# ---------------- ANALYTICS ----------------
# @shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=3, max_retries=3, queue="analytics")
def increment_product_view(self, product_id):
    try:
        Product.objects.filter(id=product_id).update(
            view_count=F("view_count") + 1
        )
    except Exception as e:
        logger.error(f"View count update failed: {str(e)}")
        raise self.retry(exc=e)


