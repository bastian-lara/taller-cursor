from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import PasswordResetView
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.generic import FormView, TemplateView

from .forms import CustomPasswordResetForm, DocDigatalesAuthenticationForm


@login_required
def index(request):
    return render(
        request,
        "pages/index.html",
        {"base_template_name": "layouts/base_app_admin.html"},
    )


class Login_view(FormView):
    template_name = "pages/login.html"
    form_class = DocDigatalesAuthenticationForm

    def get(self, request, *args, **kwargs):
        if self.request.user.is_authenticated:
            return redirect(index)
        return super().get(request, *args, **kwargs)

    def form_valid(self, form):
        username = form.cleaned_data.get("username")
        password = form.cleaned_data.get("password")
        remember_me = form.cleaned_data.get("remember_me", False)

        rut_base = username.split("-")[0]
        user = authenticate(username=rut_base, password=password)

        if user is not None:
            login(self.request, user)
            if not remember_me:
                self.request.session.set_expiry(0)
            return redirect(index)

        form.add_error(None, "Usuario o contraseña incorrectos.")
        return self.form_invalid(form)


def appLogout(request):
    logout(request)
    return redirect("login_view")


class ResetPasswordView(PasswordResetView):
    form_class = CustomPasswordResetForm
    template_name = "pages/users/password_reset.html"
    email_template_name = "pages/users/password_reset_email_simple.html"
    html_email_template_name = "pages/users/password_reset_email.html"
    subject_template_name = "pages/users/password_reset_subject"
    success_url = reverse_lazy("reestablecer_password_enviado")


class ResetPasswordEmailSent(TemplateView):
    template_name = "pages/users/password_reset_sent.html"
