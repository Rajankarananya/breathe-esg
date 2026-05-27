from django.contrib import admin
from django.urls import include, path, re_path
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
import os


def serve_spa(request, *args, **kwargs):
    index_path = os.path.join(settings.BASE_DIR, 'breathe_esg', 'static', 'frontend', 'index.html')
    if not os.path.exists(index_path):
        # fallback to staticfiles
        index_path = os.path.join(settings.BASE_DIR, 'staticfiles', 'frontend', 'index.html')
    if os.path.exists(index_path):
        return FileResponse(open(index_path, 'rb'), content_type='text/html')
    from django.http import HttpResponse
    return HttpResponse("App not found. Static files may not be built.", status=404)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("ingestion.urls")),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    re_path(r"^(?!api/|admin/|static/|assets/).*$", serve_spa),
]
