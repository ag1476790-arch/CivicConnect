from django.urls import path
from .views import (
    AdminAssignWorkerView, AdminComplaintListView, AdminDashboardView,
    AdminUpdateComplaintStatusView, AdminUserStatusView, AdminUsersView, AdminWorkersView,
    CitizenComplaintDetailView, CitizenComplaintListCreateView,
    ComplaintDetailAccessView, ComplaintSearchView, WorkerTaskDetailView, WorkerTaskListView,
    WorkerUpdateTaskStatusView,
)

urlpatterns = [
    path('complaints/', ComplaintSearchView.as_view(), name='complaint_search'),
    path('complaints/<int:pk>/', ComplaintDetailAccessView.as_view(), name='complaint_detail'),
    path('citizen/complaints/', CitizenComplaintListCreateView.as_view(), name='citizen_complaints'),
    path('citizen/complaints/<int:pk>/', CitizenComplaintDetailView.as_view(), name='citizen_complaint_detail'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/complaints/', AdminComplaintListView.as_view(), name='admin_complaints'),
    path('admin/complaints/<int:pk>/assign/', AdminAssignWorkerView.as_view(), name='admin_assign_worker'),
    path('admin/complaints/<int:pk>/status/', AdminUpdateComplaintStatusView.as_view(), name='admin_update_status'),
    path('admin/workers/', AdminWorkersView.as_view(), name='admin_workers'),
    path('admin/users/', AdminUsersView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/status/', AdminUserStatusView.as_view(), name='admin_user_status'),
    path('worker/tasks/', WorkerTaskListView.as_view(), name='worker_tasks'),
    path('worker/tasks/<int:pk>/', WorkerTaskDetailView.as_view(), name='worker_task_detail'),
    path('worker/tasks/<int:pk>/status/', WorkerUpdateTaskStatusView.as_view(), name='worker_update_task_status'),
]
