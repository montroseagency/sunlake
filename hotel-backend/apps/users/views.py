from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from apps.users.models import CustomUser
from apps.users.serializers import UserSerializer, UserRegistrationSerializer


class UserViewSet(viewsets.GenericViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class LoginView(APIView):
    """Login endpoint that returns JWT tokens"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')
        password = request.data.get('password')

        # Accept either email or username
        login_identifier = email or username

        if not login_identifier or not password:
            return Response(
                {'detail': 'Email/username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Try to authenticate with email first, then username
        user = None
        if email:
            try:
                user_obj = CustomUser.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except CustomUser.DoesNotExist:
                pass

        if user is None and username:
            user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
            }
        })


class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

