from celery import shared_task
from django.core.cache import cache
from django.utils import timezone
import logging

from deals_app.models import Product, DealFlyer
from django.db.models import F
from deals_app.email_utils import send_company_credentials
from deals_app.services import get_homepage_data
from deals_app.serializers import CategorySerializer, CompanySerializer

logger = logging.getLogger(__name__)


# ---------------- EMAIL ----------------
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=5, max_retries=3, queue="email")
def send_company_email_task(self, email, password, company_name):
    try:
        send_company_credentials(email, password, company_name)
        logger.info(f"Email sent to {email}")
    except Exception as e:
        logger.error(f"Email failed: {str(e)}")
        raise self.retry(exc=e)


# ---------------- EXPIRE FLYERS ----------------
@shared_task(queue="default")
def expire_flyers():
    today = timezone.now().date()

    expired = DealFlyer.objects.filter(
        end_date__lt=today,
        is_active=True
    )

    count = expired.update(is_active=False)

    logger.info(f"{count} flyers expired")


# ---------------- HOMEPAGE CACHE ----------------
@shared_task(queue="default")
def refresh_homepage_cache():
    try:
        companies, categories = get_homepage_data()

        # serialize BEFORE caching
        companies_data = CompanySerializer(companies, many=True).data
        categories_data = CategorySerializer(categories, many=True).data

        cache.set("homepage_companies", companies_data, 300)
        cache.set("homepage_categories", categories_data, 300)

        logger.info("Homepage cache refreshed")

    except Exception as e:
        logger.error(f"Homepage cache failed: {str(e)}")


# ---------------- ANALYTICS ----------------
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=3, max_retries=3, queue="analytics")
def increment_product_view(self, product_id):
    try:
        Product.objects.filter(id=product_id).update(
            view_count=F("view_count") + 1
        )
    except Exception as e:
        logger.error(f"View count update failed: {str(e)}")
        raise self.retry(exc=e)
    

from celery import shared_task
from deals_app.services.flyer_ai import process_flyer
from .models import DealFlyer, Product, FlyerProduct

@shared_task(queue="ai") 
def process_flyer_task(flyer_id):
    flyer = DealFlyer.objects.get(id=flyer_id)

    pdf_path = flyer.pdf.path
    extracted_products = process_flyer(pdf_path)

    for item in extracted_products:
        product = Product.objects.create(
            company=flyer.company,
            name=item["name"],
            price=10
        )

        FlyerProduct.objects.create(
            flyer=flyer,
            product=product,
            page_number=item["page"]
        )