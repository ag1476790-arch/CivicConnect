from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsAdminUserRole, IsCitizenUserRole, IsWorkerUserRole
from apps.notifications.models import Notification
from .models import Complaint, ComplaintHistory
from apps.accounts.serializers import AdminUserCreateSerializer
from .serializers import (
    AssignWorkerSerializer, ComplaintCreateSerializer, ComplaintDetailSerializer,
    ComplaintSerializer, StatusUpdateSerializer,
)

User = get_user_model()


def submit_complaint(request):
    serializer = ComplaintCreateSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    with transaction.atomic():
        complaint = serializer.save()
        ComplaintHistory.objects.create(
            complaint=complaint,
            previous_status='',
            new_status=complaint.status,
            updated_by=request.user,
            remarks='Complaint submitted.',
        )
        Notification.objects.create(
            recipient=request.user,
            complaint=complaint,
            message=f'Your complaint {complaint.complaint_number} was submitted successfully.',
        )
    return Response(ComplaintDetailSerializer(complaint).data, status=status.HTTP_201_CREATED)


def add_history(complaint, previous_status, new_status, updated_by, remarks=''):
    if previous_status == new_status:
        return
    ComplaintHistory.objects.create(
        complaint=complaint,
        previous_status=previous_status,
        new_status=new_status,
        updated_by=updated_by,
        remarks=remarks,
    )
    complaint.status = new_status
    complaint.save(update_fields=['status', 'updated_at'])

    if new_status == 'RESOLVED':
        complaint.resolved_at = complaint.updated_at
        complaint.save(update_fields=['resolved_at'])
    elif complaint.resolved_at:
        complaint.resolved_at = None
        complaint.save(update_fields=['resolved_at'])

    if complaint.citizen and complaint.citizen != updated_by:
        Notification.objects.create(
            recipient=complaint.citizen,
            complaint=complaint,
            message=f'Complaint {complaint.complaint_number} updated to {new_status}.',
        )
    if complaint.assigned_worker and complaint.assigned_worker != updated_by:
        Notification.objects.create(
            recipient=complaint.assigned_worker,
            complaint=complaint,
            message=f'Complaint {complaint.complaint_number} changed status to {new_status}.',
        )


class CitizenComplaintListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsCitizenUserRole]

    def get(self, request):
        complaints = Complaint.objects.filter(citizen=request.user).select_related('citizen', 'assigned_worker').order_by('-created_at')
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)

    def post(self, request):
        return submit_complaint(request)


class CitizenComplaintDetailView(APIView):
    permission_classes = [IsAuthenticated, IsCitizenUserRole]

    def get(self, request, pk):
        complaint = Complaint.objects.filter(citizen=request.user, pk=pk).first()
        if not complaint:
            return Response({'detail': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ComplaintDetailSerializer(complaint).data)


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        complaints = Complaint.objects.all()
        total = complaints.count()
        stats = {
            'total': total,
            'submitted': complaints.filter(status='SUBMITTED').count(),
            'under_review': complaints.filter(status='UNDER_REVIEW').count(),
            'assigned': complaints.filter(status='ASSIGNED').count(),
            'in_progress': complaints.filter(status='IN_PROGRESS').count(),
            'resolved': complaints.filter(status='RESOLVED').count(),
            'rejected': complaints.filter(status='REJECTED').count(),
        }
        recent = ComplaintSerializer(
            complaints.select_related('citizen', 'assigned_worker').order_by('-created_at')[:5],
            many=True,
        ).data
        category_breakdown = list(complaints.values('category').annotate(count=Count('id')).order_by('-count'))
        return Response({'stats': stats, 'recent_complaints': recent, 'category_breakdown': category_breakdown})


class AdminComplaintListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        complaints = Complaint.objects.select_related('citizen', 'assigned_worker').all().order_by('-created_at')
        status_filter = request.query_params.get('status')
        category_filter = request.query_params.get('category')
        priority_filter = request.query_params.get('priority')
        search = request.query_params.get('search', '')

        if status_filter:
            complaints = complaints.filter(status=status_filter)
        if category_filter:
            complaints = complaints.filter(category=category_filter)
        if priority_filter:
            complaints = complaints.filter(priority=priority_filter)
        if search:
            complaints = complaints.filter(Q(title__icontains=search) | Q(location__icontains=search) | Q(description__icontains=search))

        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)


class AdminAssignWorkerView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    @transaction.atomic
    def post(self, request, pk):
        complaint = Complaint.objects.filter(pk=pk).first()
        if not complaint:
            return Response({'detail': 'Complaint not found.'}, status=404)
        serializer = AssignWorkerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        if complaint.status in {Complaint.Status.RESOLVED, Complaint.Status.REJECTED}:
            return Response({'detail': 'Resolved or rejected complaints cannot be assigned.'}, status=status.HTTP_400_BAD_REQUEST)
        worker = User.objects.filter(pk=serializer.validated_data['worker_id'], role='WORKER', is_active=True).first()
        if not worker:
            return Response({'detail': 'Worker not found.'}, status=404)

        previous_status = complaint.status
        complaint.assigned_worker = worker
        complaint.status = 'ASSIGNED'
        complaint.save(update_fields=['assigned_worker', 'status', 'updated_at'])
        add_history(complaint, previous_status, 'ASSIGNED', request.user, serializer.validated_data.get('remarks', ''))
        Notification.objects.create(recipient=worker, complaint=complaint, message=f'You have been assigned complaint {complaint.complaint_number}.')
        return Response(ComplaintDetailSerializer(complaint).data)

    def patch(self, request, pk):
        return self.post(request, pk)


class AdminUpdateComplaintStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    @transaction.atomic
    def post(self, request, pk):
        complaint = Complaint.objects.filter(pk=pk).first()
        if not complaint:
            return Response({'detail': 'Complaint not found.'}, status=404)
        serializer = StatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        previous_status = complaint.status
        new_status = serializer.validated_data.get('status', previous_status)
        update_fields = []
        if 'status' in serializer.validated_data:
            complaint.status = new_status
            update_fields.append('status')
        if 'priority' in serializer.validated_data:
            complaint.priority = serializer.validated_data['priority']
            update_fields.append('priority')
        if update_fields:
            complaint.save(update_fields=[*update_fields, 'updated_at'])
        add_history(complaint, previous_status, new_status, request.user, serializer.validated_data.get('remarks', ''))
        return Response(ComplaintDetailSerializer(complaint).data)

    def patch(self, request, pk):
        return self.post(request, pk)


class AdminWorkersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        workers = User.objects.filter(role='WORKER', is_active=True).annotate(task_count=Count('assigned_tasks')).order_by('username')
        worker_data = []
        for worker in workers:
            worker_data.append({
                'id': worker.id,
                'username': worker.username,
                'full_name': worker.full_name or worker.get_full_name() or worker.username,
                'department': worker.department,
                'task_count': worker.task_count,
                'email': worker.email,
            })
        return Response(worker_data)


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def get(self, request):
        users = User.objects.order_by('-date_joined')
        payload = [{
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name or user.get_full_name() or user.username,
            'role': user.role,
            'email': user.email,
            'phone_number': user.phone_number,
            'is_active': user.is_active,
        } for user in users]
        return Response(payload)

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response({
            'id': user.id,
            'username': user.username,
            'full_name': user.full_name or user.get_full_name() or user.username,
            'role': user.role,
            'email': user.email,
            'phone_number': user.phone_number,
            'is_active': user.is_active,
        }, status=status.HTTP_201_CREATED)


class AdminUserStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUserRole]

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).exclude(pk=request.user.pk).exclude(role=User.Role.ADMIN).first()
        if not user:
            return Response({'detail': 'User not found or cannot be changed.'}, status=status.HTTP_404_NOT_FOUND)
        is_active = request.data.get('is_active')
        if not isinstance(is_active, bool):
            return Response({'is_active': ['A boolean value is required.']}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = is_active
        user.save(update_fields=['is_active'])
        return Response({'id': user.id, 'is_active': user.is_active})


class WorkerTaskListView(APIView):
    permission_classes = [IsAuthenticated, IsWorkerUserRole]

    def get(self, request):
        complaints = Complaint.objects.filter(assigned_worker=request.user).select_related('citizen', 'assigned_worker').order_by('-created_at')
        status_filter = request.query_params.get('status')
        if status_filter:
            complaints = complaints.filter(status=status_filter)
        return Response(ComplaintSerializer(complaints, many=True).data)


class WorkerTaskDetailView(APIView):
    permission_classes = [IsAuthenticated, IsWorkerUserRole]

    def get(self, request, pk):
        complaint = Complaint.objects.filter(assigned_worker=request.user, pk=pk).first()
        if not complaint:
            return Response({'detail': 'Task not found.'}, status=404)
        return Response(ComplaintDetailSerializer(complaint).data)


class WorkerUpdateTaskStatusView(APIView):
    permission_classes = [IsAuthenticated, IsWorkerUserRole]

    @transaction.atomic
    def post(self, request, pk):
        complaint = Complaint.objects.filter(assigned_worker=request.user, pk=pk).first()
        if not complaint:
            return Response({'detail': 'Task not found.'}, status=404)
        serializer = StatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        new_status = serializer.validated_data['status']
        allowed_transitions = {
            Complaint.Status.ASSIGNED: {Complaint.Status.IN_PROGRESS},
            Complaint.Status.IN_PROGRESS: {Complaint.Status.RESOLVED},
        }
        if new_status not in {Complaint.Status.IN_PROGRESS, Complaint.Status.RESOLVED}:
            return Response({'detail': 'Workers can only mark tasks in progress or resolved.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_status != complaint.status and new_status not in allowed_transitions.get(complaint.status, set()):
            return Response({'detail': 'Workers must start assigned tasks before resolving them.'}, status=status.HTTP_400_BAD_REQUEST)

        previous_status = complaint.status
        complaint.status = new_status
        complaint.save(update_fields=['status', 'updated_at'])
        add_history(complaint, previous_status, new_status, request.user, serializer.validated_data.get('remarks', ''))
        return Response(ComplaintDetailSerializer(complaint).data)

    def patch(self, request, pk):
        return self.post(request, pk)


class ComplaintSearchView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            complaints = Complaint.objects.select_related('citizen', 'assigned_worker').all()
            status_filter = self.request.query_params.get('status')
            category_filter = self.request.query_params.get('category')
            priority_filter = self.request.query_params.get('priority')
            search = self.request.query_params.get('search', '')
            if status_filter:
                complaints = complaints.filter(status=status_filter)
            if category_filter:
                complaints = complaints.filter(category=category_filter)
            if priority_filter:
                complaints = complaints.filter(priority=priority_filter)
            if search:
                complaints = complaints.filter(
                    Q(title__icontains=search)
                    | Q(location__icontains=search)
                    | Q(description__icontains=search)
                )
            return complaints.order_by('-created_at')
        if user.role == 'WORKER':
            return Complaint.objects.filter(assigned_worker=user).select_related('citizen', 'assigned_worker').order_by('-created_at')
        return Complaint.objects.filter(citizen=user).select_related('citizen', 'assigned_worker').order_by('-created_at')

    def post(self, request, *args, **kwargs):
        if request.user.role != User.Role.CITIZEN:
            return Response({'detail': 'Only citizens can submit complaints.'}, status=status.HTTP_403_FORBIDDEN)
        return submit_complaint(request)


class ComplaintDetailAccessView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        complaints = Complaint.objects.select_related('citizen', 'assigned_worker').prefetch_related('history__updated_by')
        if request.user.role == User.Role.WORKER:
            complaints = complaints.filter(assigned_worker=request.user)
        elif request.user.role != User.Role.ADMIN:
            complaints = complaints.filter(citizen=request.user)
        complaint = complaints.filter(pk=pk).first()
        if not complaint:
            return Response({'detail': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ComplaintDetailSerializer(complaint).data)
