from django import forms
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMultiAlternatives
from django.template import loader
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

UserModel = get_user_model()


class DocDigatalesAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        label="Usuario",
        max_length=14,
        widget=forms.TextInput(attrs={"autofocus": True, "class": "form-control"}),
    )
    password = forms.CharField(
        label="Contraseña",
        widget=forms.PasswordInput(attrs={"class": "form-control"}),
    )
    remember_me = forms.BooleanField(label="Recordarme", required=False)

    def clean(self):
        username = self.cleaned_data.get("username")
        if username:
            self.cleaned_data["username"] = username.split("-")[0]
        return super().clean()


class CustomPasswordResetForm(forms.Form):
    rut = forms.CharField(
        label="Rut",
        max_length=12,
        required=True,
        help_text="Ejemplo: 70015580-3",
        widget=forms.TextInput(
            attrs={
                "autofocus": True,
                "class": "form-control",
                "placeholder": "Rut sin puntos y con guión",
                "autocomplete": "off",
            }
        ),
    )

    def clean(self):
        cleaned_data = super().clean()
        rut = cleaned_data.get("rut", "")
        rut_base = rut.split("-")[0]
        if not UserModel.objects.filter(username=rut_base).exists():
            raise forms.ValidationError(
                "Se produjo un error, por favor revise el Rut ingresado."
            )
        return cleaned_data

    def send_mail(
        self,
        subject_template_name,
        email_template_name,
        context,
        from_email,
        to_email,
        html_email_template_name=None,
    ):
        subject = loader.render_to_string(subject_template_name, context)
        subject = "".join(subject.splitlines())
        body = loader.render_to_string(email_template_name, context)
        email_message = EmailMultiAlternatives(subject, body, from_email, [to_email])
        if html_email_template_name is not None:
            html_email = loader.render_to_string(html_email_template_name, context)
            email_message.attach_alternative(html_email, "text/html")
        email_message.send()

    def get_users(self, rut):
        username_split = rut.split("-")[0]
        active_users = UserModel.objects.filter(username=username_split, is_active=True)
        if not active_users.exists():
            raise forms.ValidationError("Error, por favor revise el Rut ingresado.")
        return active_users

    def save(
        self,
        domain_override=None,
        subject_template_name="registration/password_reset_subject.txt",
        email_template_name="registration/password_reset_email.html",
        use_https=False,
        token_generator=default_token_generator,
        from_email=None,
        request=None,
        html_email_template_name=None,
        extra_email_context=None,
    ):
        rut = self.cleaned_data["rut"]

        if not domain_override:
            current_site = get_current_site(request)
            site_name = current_site.name
            domain = current_site.domain
        else:
            site_name = domain = domain_override

        for user in self.get_users(rut):
            user_email = user.email
            context = {
                "base_url": settings.BASE_URL,
                "email": user_email,
                "domain": domain,
                "site_name": site_name,
                "uid": urlsafe_base64_encode(force_bytes(user.pk)),
                "user": user,
                "token": token_generator.make_token(user),
                "protocol": "https" if use_https else "http",
                **(extra_email_context or {}),
            }
            self.send_mail(
                subject_template_name,
                email_template_name,
                context,
                from_email,
                user_email,
                html_email_template_name=html_email_template_name,
            )
