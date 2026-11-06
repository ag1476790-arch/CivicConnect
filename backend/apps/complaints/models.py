import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Complaint(models.Model):
    class Category(models.TextChoices):
        ROADS = 'ROADS', 'Roads'
        GARBAGE = 'GARBAGE', 'Garbage'
        STREETLIGHT = 'STREETLIGHT', 'Streetlight'
        WATER_SUPPLY = 'WATER_SUPPLY', 'Water Supply'
        DRAINAGE = 'DRAINAGE', 'Drainage'
        PUBLIC_INFRASTRUCTURE = 'PUBLIC_INFRASTRUCTURE', 'Public Infrastructure'
        SAFETY = 'SAFETY', 'Safety'
        OTHER = 'OTHER', 'Other'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        URGENT = 'URGENT', 'Urgent'

    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED', 'Submitted'
        UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        REJECTED = 'REJECTED', 'Rejected'

    complaint_number = models.CharField(max_length=50, unique=True, blank=True)
    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints')
    assigned_worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=40, choices=Category.choices, default=Category.OTHER)
    location = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.SUBMITTED)
    image = models.ImageField(upload_to='complaints/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['citizen', 'created_at'], name='complaint_citizen_date_idx'),
            models.Index(fields=['assigned_worker', 'status'], name='complaint_worker_status_idx'),
            models.Index(fields=['status', 'priority'], name='complaint_status_priority_idx'),
        ]

    def save(self, *args, **kwargs):
        if not self.complaint_number:
            today = timezone.now().strftime('%Y%m%d')
            self.complaint_number = f'CC-{today}-{uuid.uuid4().hex[:8].upper()}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.complaint_number} - {self.title}'


class ComplaintHistory(models.Model):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='history')
    previous_status = models.CharField(max_length=30)
    new_status = models.CharField(max_length=30)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaint_updates')
    remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['complaint', 'created_at'], name='history_complaint_date_idx')]

    def __str__(self):
        return f'{self.complaint.complaint_number}: {self.previous_status} -> {self.new_status}'
