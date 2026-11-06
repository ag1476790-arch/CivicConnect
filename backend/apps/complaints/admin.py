from django.contrib import admin
from .models import Complaint, ComplaintHistory


class ComplaintHistoryInline(admin.TabularInline):
    model = ComplaintHistory
    extra = 0
    readonly_fields = ('previous_status', 'new_status', 'updated_by', 'remarks', 'created_at')
    can_delete = False


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('complaint_number', 'title', 'category', 'priority', 'status', 'citizen', 'assigned_worker', 'created_at')
    list_filter = ('status', 'priority', 'category', 'created_at')
    search_fields = ('complaint_number', 'title', 'description', 'location', 'citizen__username')
    readonly_fields = ('complaint_number', 'created_at', 'updated_at', 'resolved_at')
    inlines = [ComplaintHistoryInline]


@admin.register(ComplaintHistory)
class ComplaintHistoryAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'previous_status', 'new_status', 'updated_by', 'created_at')
    list_filter = ('new_status', 'created_at')
    search_fields = ('complaint__complaint_number', 'remarks')
