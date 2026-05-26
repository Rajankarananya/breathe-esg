from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from django.db import models
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import AuditAction, AuditEntry, NormalizedRecord, RecordStatus


def _serialize_value(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, models.Model):
        return value.pk
    return value


def _build_diff(old: NormalizedRecord, new: NormalizedRecord) -> dict[str, dict[str, Any]]:
    diff: dict[str, dict[str, Any]] = {}
    excluded_fields = {"id", "created_at", "updated_at"}

    for field in new._meta.fields:
        if field.name in excluded_fields:
            continue
        old_value = field.value_from_object(old)
        new_value = field.value_from_object(new)
        if old_value != new_value:
            diff[field.name] = {
                "old": _serialize_value(old_value),
                "new": _serialize_value(new_value),
            }

    return diff


@receiver(pre_save, sender=NormalizedRecord)
def _capture_pre_save_snapshot(sender, instance: NormalizedRecord, **kwargs) -> None:
    if instance.pk:
        try:
            instance._pre_save_snapshot = sender.objects.get(pk=instance.pk)
        except sender.DoesNotExist:
            instance._pre_save_snapshot = None
    else:
        instance._pre_save_snapshot = None


@receiver(post_save, sender=NormalizedRecord)
def _create_audit_entry(sender, instance: NormalizedRecord, created: bool, **kwargs) -> None:
    performed_by = getattr(instance, "_audit_user", None)
    if performed_by is None and instance.ingestion_run_id:
        performed_by = instance.ingestion_run.triggered_by

    if created:
        AuditEntry.objects.create(
            normalized_record=instance,
            action=AuditAction.CREATED,
            performed_by=performed_by,
            timestamp=timezone.now(),
            note="Record created",
            diff={"created": True},
        )
        return

    old_instance = getattr(instance, "_pre_save_snapshot", None)
    if not old_instance:
        return

    diff = _build_diff(old_instance, instance)
    if not diff:
        return

    action = AuditAction.EDITED
    if "status" in diff:
        new_status = diff["status"]["new"]
        if new_status == RecordStatus.APPROVED:
            action = AuditAction.APPROVED
        elif new_status == RecordStatus.REJECTED:
            action = AuditAction.REJECTED
        elif new_status == RecordStatus.FLAGGED:
            action = AuditAction.FLAGGED

    AuditEntry.objects.create(
        normalized_record=instance,
        action=action,
        performed_by=performed_by,
        timestamp=timezone.now(),
        diff=diff,
    )
