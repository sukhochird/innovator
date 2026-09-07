from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.SUPER_ADMIN
        )


class IsCompanyAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.COMPANY_ADMIN
        )


class IsDriver(BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.DRIVER
        )


class IsCompanyMember(BasePermission):
    """Company admin or driver belonging to a company."""

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == UserRole.SUPER_ADMIN:
            return True
        return user.role in (UserRole.COMPANY_ADMIN, UserRole.DRIVER) and user.company_id is not None


class IsCompanyAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return user.role in (UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
