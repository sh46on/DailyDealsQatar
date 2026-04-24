from django.urls import path
from marketplace.views import *
from marketplace.analytics_views import CategoryAnalyticsView, UserActivityDashboardView

urlpatterns = [
    path("home/products/", HomeProductListAPIView.as_view(), name="home-product-list"),
    path("products/", ProductListAPIView.as_view(), name="product-list"),
    path("notifications/", NotificationAPIView.as_view()),
    path("notifications/read/<int:pk>/", MarkNotificationReadAPIView.as_view()),
    path("notifications/status/<int:pk>/", UpdateRequestStatusAPIView.as_view()),
    path("notifications/read-all/", MarkAllNotificationsReadAPIView.as_view()),
    path("saved-products/", SavedProductsAPIView.as_view()),
    path("toggle-save/<int:product_id>/", ToggleSaveProductAPIView.as_view()),
    path("request-product/<int:product_id>/", RequestProductAPIView.as_view()),
    path("my-interests/", MyInterestsAPIView.as_view()),
    path("profile/", UserProfileAPIView.as_view()),
    path("seller/products/", SellerProductsAPIView.as_view()),
    path("seller/products/<int:pk>/", SellerProductDetailAPIView.as_view()),
    path("seller/products/<int:pk>/toggle/", ToggleProductStatusAPIView.as_view()),
    path("cart/", CartAPIView.as_view()),
    path("cart/<int:product_id>/", RemoveCartAPIView.as_view()),
    path("request/", ProductRequestAPIView.as_view()),
    path("requested/", UserRequestedProductsAPIView.as_view()),
    path("admin/analytics/", CategoryAnalyticsView.as_view()),
    path("admin/user-activity/", UserActivityDashboardView.as_view()),
    path("admin/listings/", AdminListingsView.as_view()),
    path("admin/listings/<int:pk>/toggle/", ToggleListingStatusView.as_view()),
    path("admin/listings/<int:pk>/delete/", DeleteListingView.as_view()),
    path("admin/users/", AdminUserListView.as_view()),
    path("admin/users/<int:pk>/delete/", AdminDeleteUserView.as_view()),
]
