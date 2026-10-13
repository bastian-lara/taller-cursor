from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.Login_view.as_view(), name="login_view"),
    path("logout", views.appLogout, name="app_logout"),
    path(
        "reestablecer_password",
        views.ResetPasswordView.as_view(),
        name="reestablecer_password",
    ),
    path(
        "reestablecer_password_enviado",
        views.ResetPasswordEmailSent.as_view(),
        name="reestablecer_password_enviado",
    ),
    path(
        "accounts/password-reset-confirm/<uidb64>/<token>/",
        auth_views.PasswordResetConfirmView.as_view(
            template_name="pages/users/password_reset_confirm.html"
        ),
        name="password_reset_confirm",
    ),
    path(
        "accounts/password-reset-complete/",
        auth_views.PasswordResetCompleteView.as_view(
            template_name="pages/users/password_reset_complete.html"
        ),
        name="password_reset_complete",
    ),
]
