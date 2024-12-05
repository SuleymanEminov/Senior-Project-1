from django.apps import AppConfig
from django.db.models.signals import post_migrate

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Import setup_groups_and_permissions inside ready() to avoid AppRegistryNotReady error
        from .signals import setup_groups_and_permissions
        post_migrate.connect(setup_groups_and_permissions, sender=self)

        from .signals import notify_superusers