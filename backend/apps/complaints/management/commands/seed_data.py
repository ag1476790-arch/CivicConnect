from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from apps.complaints.models import Complaint, ComplaintHistory
from apps.notifications.models import Notification

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed sample civic data for the CivicConnect platform.'

    def handle(self, *args, **options):
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@civicconnect.local',
                'full_name': 'Platform Administrator',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin.set_password('Admin@123')
        admin.save()

        workers = []
        for username, full_name in [('worker_raj', 'Raj Sharma'), ('worker_priya', 'Priya Nair'), ('worker_amit', 'Amit Verma')]:
            worker, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@civicconnect.local',
                    'full_name': full_name,
                    'role': 'WORKER',
                    'department': 'Public Works',
                },
            )
            worker.set_password('Worker@123')
            worker.save()
            workers.append(worker)

        citizens = []
        for username, full_name in [('citizen_john', 'John Doe'), ('citizen_anita', 'Anita Roy')]:
            citizen, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@civicconnect.local',
                    'full_name': full_name,
                    'role': 'CITIZEN',
                },
            )
            citizen.set_password('Citizen@123')
            citizen.save()
            citizens.append(citizen)

        sample_complaints = [
            {
                'citizen': citizens[0],
                'title': 'Large pothole near Market Street',
                'description': 'A deep pothole has formed in the road and is causing traffic issues.',
                'category': 'ROADS',
                'location': 'Market Street',
                'priority': 'HIGH',
                'status': 'ASSIGNED',
                'assigned_worker': workers[0],
            },
            {
                'citizen': citizens[1],
                'title': 'Garbage overflow near park',
                'description': 'Waste bins are overflowing and creating a hygiene hazard.',
                'category': 'GARBAGE',
                'location': 'City Park',
                'priority': 'MEDIUM',
                'status': 'IN_PROGRESS',
                'assigned_worker': workers[1],
            },
            {
                'citizen': citizens[0],
                'title': 'Streetlight not working',
                'description': 'The streetlight near the bus stop remains off after dark.',
                'category': 'STREETLIGHT',
                'location': 'Bus Stop 12',
                'priority': 'LOW',
                'status': 'SUBMITTED',
            },
            {
                'citizen': citizens[1],
                'title': 'Overflowing drain',
                'description': 'Water is collecting near the drain and causing flooding.',
                'category': 'DRAINAGE',
                'location': 'North Avenue',
                'priority': 'URGENT',
                'status': 'RESOLVED',
                'assigned_worker': workers[2],
            },
        ]

        for data in sample_complaints:
            complaint = Complaint.objects.filter(title=data['title']).first()
            if complaint is None:
                complaint = Complaint.objects.create(
                    citizen=data['citizen'],
                    title=data['title'],
                    description=data['description'],
                    category=data['category'],
                    location=data['location'],
                    priority=data['priority'],
                    status=data['status'],
                    assigned_worker=data.get('assigned_worker'),
                )

            ComplaintHistory.objects.get_or_create(
                complaint=complaint,
                previous_status='SUBMITTED',
                new_status=complaint.status,
                updated_by=admin,
                remarks='Seed record created.',
            )
            Notification.objects.get_or_create(
                recipient=data['citizen'],
                complaint=complaint,
                defaults={'message': f'Your complaint {complaint.complaint_number} is in status {complaint.status}.'},
            )

        self.stdout.write(self.style.SUCCESS('Seed data created successfully.'))
