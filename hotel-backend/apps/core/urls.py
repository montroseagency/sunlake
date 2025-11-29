from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import GalleryImageViewSet

router = DefaultRouter()
router.register(r'gallery', GalleryImageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
