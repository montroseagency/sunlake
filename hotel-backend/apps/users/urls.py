from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views import UserViewSet, LoginView, RegisterView

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
]
