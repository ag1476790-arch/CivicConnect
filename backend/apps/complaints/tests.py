from django.test import TestCase
from rest_framework.test import APIClient
from apps.accounts.models import User
from .models import Complaint, ComplaintHistory


class ComplaintAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(username='citizen', password='Test-Password-2026!', role=User.Role.CITIZEN)
        self.other_citizen = User.objects.create_user(username='other', password='Test-Password-2026!', role=User.Role.CITIZEN)
        self.worker = User.objects.create_user(username='worker', password='Test-Password-2026!', role=User.Role.WORKER)
        self.admin = User.objects.create_user(username='admin', password='Test-Password-2026!', role=User.Role.ADMIN)
        self.complaint = Complaint.objects.create(
            citizen=self.citizen,
            title='Broken streetlight',
            description='The streetlight is not working.',
            location='Main Street',
        )

    def test_citizens_cannot_view_another_citizens_complaint(self):
        self.client.force_authenticate(self.other_citizen)

        response = self.client.get(f'/api/complaints/{self.complaint.pk}/')

        self.assertEqual(response.status_code, 404)

    def test_workers_only_view_assigned_complaints(self):
        self.client.force_authenticate(self.worker)

        response = self.client.get(f'/api/complaints/{self.complaint.pk}/')

        self.assertEqual(response.status_code, 404)

    def test_admin_status_update_records_history_and_priority(self):
        self.client.force_authenticate(self.admin)

        response = self.client.patch(
            f'/api/admin/complaints/{self.complaint.pk}/status/',
            {'status': 'UNDER_REVIEW', 'priority': 'HIGH', 'remarks': 'Verified report.'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.complaint.refresh_from_db()
        self.assertEqual(self.complaint.status, Complaint.Status.UNDER_REVIEW)
        self.assertEqual(self.complaint.priority, Complaint.Priority.HIGH)
        self.assertTrue(ComplaintHistory.objects.filter(
            complaint=self.complaint,
            previous_status=Complaint.Status.SUBMITTED,
            new_status=Complaint.Status.UNDER_REVIEW,
        ).exists())

    def test_worker_must_start_assigned_task_before_resolving(self):
        self.complaint.assigned_worker = self.worker
        self.complaint.status = Complaint.Status.ASSIGNED
        self.complaint.save()
        self.client.force_authenticate(self.worker)

        response = self.client.patch(
            f'/api/worker/tasks/{self.complaint.pk}/status/',
            {'status': Complaint.Status.RESOLVED, 'remarks': 'Work completed.'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
