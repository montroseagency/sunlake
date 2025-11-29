from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from apps.core.models import GalleryImage, ContactMessage
from apps.core.serializers import GalleryImageSerializer, ContactMessageSerializer
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


class ContactMessageViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - POST /api/contact/ - Submit contact form (no authentication required)

    Admin endpoints:
    - GET /api/contact/ - List all contact messages
    - GET /api/contact/{id}/ - Get specific contact message
    - PATCH /api/contact/{id}/ - Mark message as read
    - DELETE /api/contact/{id}/ - Delete contact message
    """
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAdminOrStaff()]

    def create(self, request, *args, **kwargs):
        """Allow public to submit contact form"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {'message': 'Your message has been sent successfully. We will get back to you soon!'},
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({'status': 'Message marked as read'})
