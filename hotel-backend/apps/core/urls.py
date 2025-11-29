from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import GalleryImageViewSet, ContactMessageViewSet

router = DefaultRouter()
router.register(r'gallery', GalleryImageViewSet)
router.register(r'contact', ContactMessageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
