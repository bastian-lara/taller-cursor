from django.conf import settings

ENVIRONMENT_NAMES = {
    "PRODUCTION": "PRODUCCIÓN",
    "TESTING": "TESTING",
    "DEVELOPMENT": "DESARROLLO",
    "QA": "QA",
}


def environment(request):
    return {
        "ENVIRONMENT": settings.ENVIRONMENT,
        "ENVIRONMENT_NAME": ENVIRONMENT_NAMES.get(
            settings.ENVIRONMENT,
            settings.ENVIRONMENT,
        ),
    }
