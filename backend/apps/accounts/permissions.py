from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    message = 'Only administrators are allowed to access this resource.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class IsWorkerUserRole(BasePermission):
    message = 'Only field workers are allowed to access this resource.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'WORKER')


class IsCitizenUserRole(BasePermission):
    message = 'Only citizens are allowed to access this resource.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'CITIZEN')
