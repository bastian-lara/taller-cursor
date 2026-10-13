from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

SEED_USERNAME = "70015580"
SEED_PASSWORD = "password"
SEED_EMAIL = "admin@prototipo.local"


class Command(BaseCommand):
    help = "Idempotent seed of sandbox admin user (RUT 70015580 / password)."

    def handle(self, *args, **options):
        user, created = User.objects.get_or_create(
            username=SEED_USERNAME,
            defaults={
                "email": SEED_EMAIL,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Admin",
                "last_name": "Prototipo",
            },
        )
        if created:
            user.set_password(SEED_PASSWORD)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created seed user {SEED_USERNAME}"))
        else:
            updated = False
            if user.email != SEED_EMAIL:
                user.email = SEED_EMAIL
                updated = True
            if not user.is_staff:
                user.is_staff = True
                updated = True
            if not user.is_superuser:
                user.is_superuser = True
                updated = True
            if not user.check_password(SEED_PASSWORD):
                user.set_password(SEED_PASSWORD)
                updated = True
            if updated:
                user.save()
                self.stdout.write(
                    self.style.WARNING(f"Updated seed user {SEED_USERNAME}")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"Seed user {SEED_USERNAME} already OK")
                )
