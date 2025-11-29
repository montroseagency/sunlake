from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from apps.core.models import GalleryImage
from apps.core.serializers import GalleryImageSerializer
from apps.rooms.views import IsAdminOrStaff


class GalleryImageViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - GET /api/gallery/ - List gallery images

    Admin endpoints:
    - POST /api/gallery/ - Add new gallery image
    - PUT/PATCH /api/gallery/{id}/ - Update gallery image
    - DELETE /api/gallery/{id}/ - Delete gallery image
    """
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAdminOrStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # For public, only show active images
        if not (self.request.user and self.request.user.is_authenticated
                and self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(is_active=True)

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        return queryset
