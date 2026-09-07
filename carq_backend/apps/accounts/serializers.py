from rest_framework import serializers

from apps.accounts.models import User, UserRole


class UserSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "company",
            "company_name",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "role", "company", "company_name", "is_active", "date_joined")

    def get_company_name(self, obj):
        if obj.company_id and obj.company:
            return obj.company.name
        return None


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "role",
            "company",
        )

    def validate_role(self, value):
        if value == UserRole.SUPER_ADMIN:
            raise serializers.ValidationError("Cannot create super admin via API.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
