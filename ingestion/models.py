from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.db import models


class SourceType(models.TextChoices):
    SAP = "SAP", "SAP"
    UTILITY = "UTILITY", "Utility"
    TRAVEL = "TRAVEL", "Travel"


class Scope(models.TextChoices):
    SCOPE_1 = "SCOPE_1", "Scope 1"
    SCOPE_2 = "SCOPE_2", "Scope 2"
    SCOPE_3 = "SCOPE_3", "Scope 3"


class IngestionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    PROCESSING = "PROCESSING", "Processing"
    DONE = "DONE", "Done"
    FAILED = "FAILED", "Failed"


class RecordStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    FLAGGED = "FLAGGED", "Flagged"


class AuditAction(models.TextChoices):
    CREATED = "CREATED", "Created"
    EDITED = "EDITED", "Edited"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"
    FLAGGED = "FLAGGED", "Flagged"


class Tenant(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tenant"
        verbose_name_plural = "Tenants"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class DataSource(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="data_sources")
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    name = models.CharField(max_length=200)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Data Source"
        verbose_name_plural = "Data Sources"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["tenant"]),
            models.Index(fields=["source_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.source_type})"


class IngestionRun(models.Model):
    data_source = models.ForeignKey(
        DataSource, on_delete=models.CASCADE, related_name="ingestion_runs"
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=IngestionStatus.choices, default=IngestionStatus.PENDING
    )
    file_name = models.CharField(max_length=255, blank=True)
    raw_file = models.FileField(upload_to="ingestion_raw/", null=True, blank=True)
    row_count = models.PositiveIntegerField(default=0)
    error_count = models.PositiveIntegerField(default=0)
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ingestion_runs",
    )

    class Meta:
        verbose_name = "Ingestion Run"
        verbose_name_plural = "Ingestion Runs"
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.data_source.name} {self.started_at:%Y-%m-%d %H:%M}"


class NormalizedRecord(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="normalized_records")
    ingestion_run = models.ForeignKey(
        IngestionRun, on_delete=models.CASCADE, related_name="normalized_records"
    )
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    scope = models.CharField(max_length=20, choices=Scope.choices)
    activity_date = models.DateField()
    quantity = models.DecimalField(max_digits=20, decimal_places=6)
    unit = models.CharField(max_length=50)
    quantity_co2e = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)
    emission_factor_used = models.DecimalField(
        max_digits=20, decimal_places=6, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=RecordStatus.choices, default=RecordStatus.PENDING
    )
    is_locked = models.BooleanField(default=False)
    extra = models.JSONField(default=dict, blank=True)
    raw_record = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Normalized Record"
        verbose_name_plural = "Normalized Records"
        ordering = ["-activity_date", "-created_at"]
        indexes = [
            models.Index(fields=["tenant"]),
            models.Index(fields=["status"]),
            models.Index(fields=["activity_date"]),
            models.Index(fields=["source_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.tenant.name} {self.activity_date} {self.source_type}"

    def save(self, *args, **kwargs) -> None:
        if self.status == RecordStatus.APPROVED:
            self.is_locked = True
        super().save(*args, **kwargs)


class AuditEntry(models.Model):
    normalized_record = models.ForeignKey(
        NormalizedRecord, on_delete=models.CASCADE, related_name="audit_entries"
    )
    action = models.CharField(max_length=20, choices=AuditAction.choices)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_entries",
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)
    diff = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Audit Entry"
        verbose_name_plural = "Audit Entries"
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"{self.normalized_record_id} {self.action}"


class EmissionFactor(models.Model):
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    activity_type = models.CharField(max_length=100)
    region = models.CharField(max_length=50, blank=True)
    factor = models.DecimalField(max_digits=20, decimal_places=6)
    unit = models.CharField(max_length=50)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    source_reference = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Emission Factor"
        verbose_name_plural = "Emission Factors"
        ordering = ["source_type", "activity_type", "-valid_from"]
        indexes = [
            models.Index(fields=["source_type"]),
        ]

    def __str__(self) -> str:
        region = f" {self.region}" if self.region else ""
        return f"{self.activity_type}{region} ({self.source_type})"
