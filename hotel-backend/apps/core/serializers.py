from rest_framework import serializers
from apps.core.models import GalleryImage, ContactMessage


class GalleryImageSerializer(serializers.ModelSerializer):
    image_display = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_blank=True)

    class Meta:
        model = GalleryImage
        fields = [
            'id', 'title', 'description', 'image', 'image_url', 'image_display',
            'category', 'order', 'is_active', 'created_at'
        ]

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


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
