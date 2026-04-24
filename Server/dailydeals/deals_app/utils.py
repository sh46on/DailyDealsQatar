from django.core.cache import cache
from deals_app.models import AppSettings, CACHE_KEY


def get_settings():
    settings = cache.get(CACHE_KEY)

    if not settings:
        settings = AppSettings.objects.first()
        cache.set(CACHE_KEY, settings, None)  # no expiry

    return settings
