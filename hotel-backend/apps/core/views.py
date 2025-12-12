from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import models
from apps.core.models import GalleryCategory, GalleryImage, ContactMessage
from apps.core.serializers import (
    GalleryCategorySerializer, GalleryImageSerializer,
    GalleryImageCreateSerializer, ContactMessageSerializer
)
from apps.rooms.views import IsAdminOrStaff


class GalleryCategoryViewSet(viewsets.ModelViewSet):
    """
    Public endpoints:
    - GET /api/gallery-categories/ - List all categories

    Admin endpoints:
    - POST /api/gallery-categories/ - Create new category
    - PATCH /api/gallery-categories/{id}/ - Update category
    - DELETE /api/gallery-categories/{id}/ - Delete category
    - PATCH /api/gallery-categories/reorder/ - Reorder categories
    """
    queryset = GalleryCategory.objects.all()
    serializer_class = GalleryCategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticatedOrReadOnly()]
        return [IsAdminOrStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()

        # For public, only show active categories
        if not (self.request.user and self.request.user.is_authenticated
                and self.request.user.role in ['ADMIN', 'STAFF']):
            queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=False, methods=['patch'], permission_classes=[IsAdminOrStaff])
    def reorder(self, request):
        """Reorder categories. Expects array of {id, order} objects"""
        category_orders = request.data.get('categories', [])

        if not isinstance(category_orders, list):
            return Response(
                {'error': 'Expected "categories" to be an array of {id, order} objects'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = 0
        errors = []

        for item in category_orders:
            category_id = item.get('id')
            new_order = item.get('order')

            if category_id is None or new_order is None:
                errors.append({'error': 'Each item must have "id" and "order"', 'item': item})
                continue

            try:
                category = GalleryCategory.objects.get(id=category_id)
                category.order = new_order
                category.save(update_fields=['order'])
                updated_count += 1
            except GalleryCategory.DoesNotExist:
                errors.append({'error': 'Category not found', 'id': category_id})

        return Response({
            'updated': updated_count,
            'errors': errors
        }, status=status.HTTP_200_OK if updated_count > 0 else status.HTTP_400_BAD_REQUEST)


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

    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrStaff])
    def bulk_upload(self, request):
        """Add multiple images to a category at once"""
        category_id = request.data.get('category_id')

        if not category_id:
            return Response(
                {'error': 'category_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            category = GalleryCategory.objects.get(id=category_id)
        except GalleryCategory.DoesNotExist:
            return Response(
                {'error': 'Category not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        images_data = []
        errors = []

        # Handle multiple file uploads
        files = request.FILES.getlist('images')
        urls = request.data.getlist('image_urls')

        # Get starting order value (next highest order)
        max_order = category.images.aggregate(models.Max('order'))['order__max'] or 0
        current_order = max_order + 1

        # Process file uploads
        for idx, file in enumerate(files):
            data = {
                'category': category.id,
                'image': file,
                'order': current_order + idx
            }
            serializer = GalleryImageCreateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                images_data.append(serializer.data)
            else:
                errors.append({'file': file.name, 'errors': serializer.errors})

        # Process URL uploads
        for idx, url in enumerate(urls):
            if url:  # Skip empty URLs
                data = {
                    'category': category.id,
                    'image_url': url,
                    'order': current_order + len(files) + idx
                }
                serializer = GalleryImageCreateSerializer(data=data, context={'request': request})
                if serializer.is_valid():
                    serializer.save()
                    images_data.append(serializer.data)
                else:
                    errors.append({'url': url, 'errors': serializer.errors})

        return Response({
            'success': images_data,
            'errors': errors,
            'total_uploaded': len(images_data),
            'total_errors': len(errors)
        }, status=status.HTTP_201_CREATED if images_data else status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch'], permission_classes=[IsAdminOrStaff])
    def reorder(self, request):
        """Reorder gallery images. Expects array of {id, order} objects"""
        image_orders = request.data.get('images', [])

        if not isinstance(image_orders, list):
            return Response(
                {'error': 'Expected "images" to be an array of {id, order} objects'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = 0
        errors = []

        for item in image_orders:
            image_id = item.get('id')
            new_order = item.get('order')

            if image_id is None or new_order is None:
                errors.append({'error': 'Each item must have "id" and "order"', 'item': item})
                continue

            try:
                image = GalleryImage.objects.get(id=image_id)
                image.order = new_order
                image.save(update_fields=['order'])
                updated_count += 1
            except GalleryImage.DoesNotExist:
                errors.append({'error': 'Image not found', 'id': image_id})

        return Response({
            'updated': updated_count,
            'errors': errors
        }, status=status.HTTP_200_OK if updated_count > 0 else status.HTTP_400_BAD_REQUEST)


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
