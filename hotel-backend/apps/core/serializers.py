from rest_framework import serializers
from apps.core.models import GalleryCategory, GalleryImage, ContactMessage


class GalleryCategorySerializer(serializers.ModelSerializer):
    """Serializer for gallery categories"""
    image_count = serializers.SerializerMethodField()
    display_name = serializers.CharField(source='name', read_only=True)

    class Meta:
        model = GalleryCategory
        fields = ['id', 'name', 'display_name', 'slug', 'description', 'order', 'is_active', 'image_count', 'created_at', 'updated_at']
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def get_image_count(self, obj):
        return obj.images.filter(is_active=True).count()


class GalleryImageSerializer(serializers.ModelSerializer):
    """Serializer for gallery images"""
    image_display = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = GalleryImage
        fields = [
            'id', 'category', 'category_name', 'image', 'image_url', 'image_display',
            'alt_text', 'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_image_display(self, obj):
        """Return the full URL for the image"""
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

    def validate(self, data):
        """Ensure either image or image_url is provided"""
        # Only validate if creating new instance
        if not self.instance:
            if not data.get('image') and not data.get('image_url'):
                raise serializers.ValidationError('Either image file or image_url must be provided')
        return data


class GalleryImageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating gallery images"""
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = GalleryImage
        fields = ['id', 'category', 'image', 'image_url', 'alt_text', 'order', 'is_active']

    def validate(self, data):
        """Ensure either image or image_url is provided"""
        image = data.get('image')
        image_url = data.get('image_url')

        if not image and not image_url:
            raise serializers.ValidationError('Either image file or image_url must be provided')

        return data


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
