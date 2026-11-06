from rest_framework import serializers
from .models import Complaint, ComplaintHistory


class ComplaintHistorySerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintHistory
        fields = ['id', 'complaint', 'previous_status', 'new_status', 'updated_by', 'updated_by_name', 'remarks', 'created_at']

    def get_updated_by_name(self, obj):
        return obj.updated_by.full_name or obj.updated_by.get_full_name() or obj.updated_by.username


class ComplaintSerializer(serializers.ModelSerializer):
    citizen_name = serializers.SerializerMethodField()
    assigned_worker_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'title', 'description', 'category', 'location', 'latitude', 'longitude',
            'priority', 'status', 'image', 'citizen', 'citizen_name', 'assigned_worker', 'assigned_worker_name',
            'created_at', 'updated_at', 'resolved_at'
        ]

    def get_citizen_name(self, obj):
        return obj.citizen.full_name or obj.citizen.get_full_name() or obj.citizen.username

    def get_assigned_worker_name(self, obj):
        if obj.assigned_worker:
            return obj.assigned_worker.full_name or obj.assigned_worker.get_full_name() or obj.assigned_worker.username
        return None


class ComplaintDetailSerializer(serializers.ModelSerializer):
    history = ComplaintHistorySerializer(many=True, read_only=True)
    citizen_name = serializers.SerializerMethodField()
    assigned_worker_name = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_number', 'title', 'description', 'category', 'location', 'latitude', 'longitude',
            'priority', 'status', 'image', 'citizen', 'citizen_name', 'assigned_worker', 'assigned_worker_name',
            'created_at', 'updated_at', 'resolved_at', 'history'
        ]

    def get_citizen_name(self, obj):
        return obj.citizen.full_name or obj.citizen.get_full_name() or obj.citizen.username

    def get_assigned_worker_name(self, obj):
        if obj.assigned_worker:
            return obj.assigned_worker.full_name or obj.assigned_worker.get_full_name() or obj.assigned_worker.username
        return None


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['title', 'description', 'category', 'location', 'latitude', 'longitude', 'priority', 'image']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['citizen'] = request.user
        return super().create(validated_data)

    def validate_image(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('Image files must be 5 MB or smaller.')
        return value


class AssignWorkerSerializer(serializers.Serializer):
    worker_id = serializers.IntegerField()
    remarks = serializers.CharField(allow_blank=True, required=False, default='')


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Complaint.Status.choices, required=False)
    priority = serializers.ChoiceField(choices=Complaint.Priority.choices, required=False)
    remarks = serializers.CharField(allow_blank=True, required=False, default='')

    def validate(self, attrs):
        if 'status' not in attrs and 'priority' not in attrs:
            raise serializers.ValidationError('Provide a status or priority update.')
        return attrs
