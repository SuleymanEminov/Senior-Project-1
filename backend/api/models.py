from django.db import models
from django.contrib.auth import get_user_model

UserProfile = get_user_model()

class Club(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=10)
    manager = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_clubs",
        limit_choices_to={"groups__name": "Manager"},
    )
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    website = models.URLField(null=True, blank=True)
    courts = models.JSONField(
        default=list,
        help_text="Store a list of dictionaries, e.g., [{'type': 'hard', 'count': 3}]"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.name