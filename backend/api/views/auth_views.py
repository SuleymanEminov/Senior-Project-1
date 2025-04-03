from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import IntegrityError
from ..serializers import *

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                response_data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
                return Response(response_data, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                if 'username' in str(e):
                    return Response({"username": ["This username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)
                elif 'email' in str(e):
                    return Response({"email": ["This email is already taken."]}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
     permission_classes = (IsAuthenticated,)
     def post(self, request):
          try:
               refresh_token = request.data.get("refresh_token")
               if refresh_token:
                   token = RefreshToken(refresh_token)
                   token.blacklist()
               # Even if no token is provided, we'll consider the logout successful
               # since the frontend will clear local storage anyway
               return Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
          except Exception as e:
               return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)