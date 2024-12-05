from django.dispatch import receiver
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save, post_migrate
from django.core.mail import send_mail
from .models import Club
from django.contrib.auth.models import User

# Setup groups and permissions after migrations
@receiver(post_migrate)
def setup_groups_and_permissions(sender, **kwargs):
    try:
        # Get ContentType for Club model
        club_content_type = ContentType.objects.get(app_label='api', model='club')

        # Define groups and their permissions
        group_permissions = {
            "Manager": ["add_club", "change_club", "view_club"],
            "Coach": ["view_club"],
            "User": ["view_club"],
        }

        for group_name, permissions in group_permissions.items():
            group, _ = Group.objects.get_or_create(name=group_name)
            group.permissions.set([
                Permission.objects.get(codename=perm, content_type=club_content_type)
                for perm in permissions
            ])
        print("Groups and permissions setup successfully.")
    except ContentType.DoesNotExist:
        print("ContentType for Club does not exist yet. Skipping permissions setup.")

# Notify superusers when a new Club is created
@receiver(post_save, sender=Club)
def notify_superusers(sender, instance, created, **kwargs):
    if created:
        superusers = User.objects.filter(is_superuser=True)
        for superuser in superusers:
            send_mail(
                'New Club Submitted for Approval',
                f'A new club "{instance.name}" has been submitted for approval.',
                'admin@yourdomain.com',  # Change this to your email
                [superuser.email],
                fail_silently=True,
            )
        print("Notification email sent to superusers.")