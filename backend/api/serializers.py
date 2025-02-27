from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Club, Court

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'password2', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class CourtSerializer(serializers.ModelSerializer):
    class Meta:
        model = Court
        fields = ['id', 'court_type', 'court_number']

class ClubSerializer(serializers.ModelSerializer):
    court_details = CourtSerializer(many=True, read_only=True)
    
    class Meta:
        model = Club
        fields = [
            "id",
            "name",
            "address",
            "city",
            "state",
            "zip_code",
            "manager",
            "phone_number",
            "email",
            "website",
            "courts_summary",
            "court_details",
            "created_at",
            "updated_at",
            "is_approved",
        ]
        read_only_fields = ['manager', 'is_approved']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['manager'] = request.user
        return super().create(validated_data)