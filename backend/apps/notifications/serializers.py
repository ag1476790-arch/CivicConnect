from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    complaint_number = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'complaint', 'complaint_number', 'message', 'is_read', 'created_at']

    def get_complaint_number(self, obj):
        return obj.complaint.complaint_number
