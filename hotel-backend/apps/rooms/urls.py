from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.rooms.views import RoomViewSet, AmenityViewSet, RoomImageViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'amenities', AmenityViewSet)
router.register(r'room-images', RoomImageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
