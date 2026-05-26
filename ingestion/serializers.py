from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import serializers

from .models import (
    AuditEntry,
    DataSource,
    EmissionFactor,
    IngestionRun,
    NormalizedRecord,
    Tenant,
)


User = get_user_model()


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ["id", "name", "slug", "created_at"]


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "tenant", "source_type", "name", "config", "created_at"]


class IngestionRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = IngestionRun
        fields = [
            "id",
            "data_source",
            "started_at",
            "completed_at",
            "status",
            "file_name",
            "raw_file",
            "row_count",
            "error_count",
            "triggered_by",
        ]


class NormalizedRecordSerializer(serializers.ModelSerializer):
    audit_entries_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = NormalizedRecord
        fields = [
            "id",
            "tenant",
            "ingestion_run",
            "source_type",
            "scope",
            "activity_date",
            "quantity",
            "unit",
            "quantity_co2e",
            "emission_factor_used",
            "status",
            "is_locked",
            "extra",
            "raw_record",
            "created_at",
            "updated_at",
            "audit_entries_count",
        ]


class NormalizedRecordStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = NormalizedRecord
        fields = ["status"]


class AuditEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditEntry
        fields = [
            "id",
            "normalized_record",
            "action",
            "performed_by",
            "timestamp",
            "note",
            "diff",
        ]


class EmissionFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmissionFactor
        fields = [
            "id",
            "source_type",
            "activity_type",
            "region",
            "factor",
            "unit",
            "valid_from",
            "valid_to",
            "source_reference",
        ]
