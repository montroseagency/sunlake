from rest_framework import serializers
from apps.users.models import CustomUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_staff']
        read_only_fields = ['is_staff']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        # Auto-generate username from email if not provided
        if 'username' not in validated_data or not validated_data.get('username'):
            email = validated_data['email']
            username = email.split('@')[0]
            # Make username unique
            counter = 1
            original_username = username
            while CustomUser.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
            validated_data['username'] = username

        # Set default role to CUSTOMER if not provided
        if 'role' not in validated_data:
            validated_data['role'] = 'CUSTOMER'

        user = CustomUser.objects.create_user(**validated_data)
        return user
