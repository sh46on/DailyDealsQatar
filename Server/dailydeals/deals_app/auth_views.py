from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from deals_app.serializers import RegisterSerializer, UserSerializer, LoginSerializer
from django.db import DatabaseError, IntegrityError
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.exceptions import TokenError
from django.core.exceptions import SuspiciousOperation


import logging

logger = logging.getLogger(__name__)


class LoginAPIView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            serializer = LoginSerializer(
                data=request.data, context={"request": request}
            )

            if not serializer.is_valid():
                logger.warning(f"Failed login attempt: {request.data.get('phone')}")

                return Response(
                    {
                        "success": False,
                        "message": "Invalid input",
                        "errors": serializer.errors,
                        "access": None,
                        "refresh": None,
                        "user": None,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = serializer.validated_data.get("user")

            #  CHECK USER FIRST
            if not user:
                logger.warning(
                    f"Authentication failed for phone: {request.data.get('phone')}"
                )

                return Response(
                    {
                        "success": False,
                        "message": "Authentication failed",
                        "access": None,
                        "refresh": None,
                        "user": None,
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            ip = request.META.get("REMOTE_ADDR")
            logger.info(f"Login success: {user.phone} from IP {ip}")
            # TOKEN
            refresh = RefreshToken.for_user(user)
            refresh["role"] = user.role  # optional but recommended
            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "role": user.role,
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )

        except DatabaseError:
            return Response(
                {
                    "success": False,
                    "message": "Database error. Try again later.",
                    "access": None,
                    "refresh": None,
                    "user": None,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "Something went wrong",
                    "access": None,
                    "refresh": None,
                    "user": None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RegisterAPIView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)

            #  VALIDATION
            if not serializer.is_valid():
                return Response(
                    {
                        "success": False,
                        "message": "Validation error",
                        "errors": serializer.errors,
                        "access": None,
                        "refresh": None,
                        "user": None,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            #  SAVE USER
            user = serializer.save()

            #  GENERATE TOKENS
            refresh = RefreshToken.for_user(user)
            refresh["role"] = user.role  # optional but useful

            return Response(
                {
                    "success": True,
                    "message": "Registration successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user, context={"request": request}).data,
                },
                status=status.HTTP_201_CREATED,
            )

        #  MOVE THIS ABOVE Exception
        except SuspiciousOperation:
            return Response(
                {
                    "success": False,
                    "message": "Invalid file upload",
                    "access": None,
                    "refresh": None,
                    "user": None,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": "User already exists or duplicate entry",
                    "access": None,
                    "refresh": None,
                    "user": None,
                },
                status=status.HTTP_409_CONFLICT,
            )

        except DatabaseError:
            logger.error("Database error during registration")
            return Response(
                {
                    "success": False,
                    "message": "Database error. Please try again later.",
                    "access": None,
                    "refresh": None,
                    "user": None,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response(
                {
                    "success": False,
                    "message": "Something went wrong. Please try again.",
                    "access": None,
                    "refresh": None,
                    "user": None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogoutAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        # Case 1: No refresh token
        if not refresh_token:
            return Response(
                {"success": True, "message": "Logged out (client-side)"},
                status=status.HTTP_200_OK,
            )

        try:
            token = RefreshToken(refresh_token)

            # Case 2: blacklist enabled
            try:
                token.blacklist()
            except AttributeError:
                # blacklist app not installed
                pass

            return Response(
                {"success": True, "message": "Logged out successfully"},
                status=status.HTTP_200_OK,
            )

        except TokenError:
            # Case 3: token already expired / invalid
            return Response(
                {"success": True, "message": "Token already expired"},
                status=status.HTTP_200_OK,
            )

        except Exception:
            return Response(
                {"success": True, "message": "Logout completed"},
                status=status.HTTP_200_OK,
            )
