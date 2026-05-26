from django.contrib import admin

from .models import (
    AuditEntry,
    DataSource,
    EmissionFactor,
    IngestionRun,
    NormalizedRecord,
    Tenant,
)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "tenant", "source_type", "created_at")


@admin.register(IngestionRun)
class IngestionRunAdmin(admin.ModelAdmin):
    list_display = ("data_source", "status", "started_at", "completed_at", "row_count")


@admin.register(NormalizedRecord)
class NormalizedRecordAdmin(admin.ModelAdmin):
    list_display = (
        "tenant",
        "source_type",
        "scope",
        "activity_date",
        "quantity",
        "unit",
        "status",
        "is_locked",
    )


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
    list_display = ("normalized_record", "action", "performed_by", "timestamp")


@admin.register(EmissionFactor)
class EmissionFactorAdmin(admin.ModelAdmin):
    list_display = (
        "source_type",
        "activity_type",
        "region",
        "factor",
        "unit",
        "valid_from",
        "valid_to",
    )
