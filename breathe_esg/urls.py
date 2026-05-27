"""URL configuration for breathe_esg."""
import os

from django.conf import settings as django_settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("ingestion.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    re_path(
        r"^(?!api/|admin/).*$",
        lambda request, *args, **kwargs: serve(
            request,
            "frontend/index.html",
            document_root=django_settings.STATICFILES_DIRS[0]
            if django_settings.STATICFILES_DIRS
            else os.path.join(django_settings.BASE_DIR, "breathe_esg", "static"),
        ),
    ),
]
