from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        User = get_user_model()
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@breathe.com', 'admin123')
            self.stdout.write('Superuser created')
        else:
            self.stdout.write('Superuser already exists')
