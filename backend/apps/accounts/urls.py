from django.urls import path
from .views import LoginUserView, LogoutUserView, ProfileView, RegisterUserView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register_user'),
    path('login/', LoginUserView.as_view(), name='login_user'),
    path('logout/', LogoutUserView.as_view(), name='logout_user'),
    path('profile/', ProfileView.as_view(), name='profile_user'),
]
