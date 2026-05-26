from __future__ import annotations

from typing import Any

from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

from .models import DataSource, IngestionRun, IngestionStatus, NormalizedRecord
from .parsers.sap_parser import SAPParser
from .parsers.travel_parser import TravelParser
from .parsers.utility_parser import UtilityParser
from .serializers import NormalizedRecordSerializer, NormalizedRecordStatusSerializer


class SAPIngestView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs) -> Response:
        upload = request.FILES.get("file")
        tenant_id = request.data.get("tenant_id")
        data_source_id = request.data.get("data_source_id")

        if not upload:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not tenant_id or not data_source_id:
            return Response(
                {"detail": "tenant_id and data_source_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_source = get_object_or_404(DataSource, pk=data_source_id, tenant_id=tenant_id)

        ingestion_run = IngestionRun.objects.create(
            data_source=data_source,
            status=IngestionStatus.PROCESSING,
            file_name=upload.name,
            raw_file=upload,
            triggered_by=request.user,
        )

        try:
            upload.seek(0)
            parser = SAPParser()
            result = parser.parse(upload, ingestion_run)
            records = result.get("records", [])
            errors = result.get("errors", [])

            ingestion_run.row_count = len(records) + len(errors)
            ingestion_run.error_count = len(errors)
            ingestion_run.status = IngestionStatus.DONE
            ingestion_run.completed_at = timezone.now()
            ingestion_run.save(
                update_fields=[
                    "row_count",
                    "error_count",
                    "status",
                    "completed_at",
                ]
            )

            return Response(
                {
                    "ingestion_run_id": ingestion_run.id,
                    "row_count": ingestion_run.row_count,
                    "error_count": ingestion_run.error_count,
                    "errors": errors,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            ingestion_run.status = IngestionStatus.FAILED
            ingestion_run.completed_at = timezone.now()
            ingestion_run.save(update_fields=["status", "completed_at"])
            return Response(
                {"detail": "Ingestion failed", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UtilityIngestView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs) -> Response:
        upload = request.FILES.get("file")
        tenant_id = request.data.get("tenant_id")
        data_source_id = request.data.get("data_source_id")

        if not upload:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not tenant_id or not data_source_id:
            return Response(
                {"detail": "tenant_id and data_source_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_source = get_object_or_404(DataSource, pk=data_source_id, tenant_id=tenant_id)

        ingestion_run = IngestionRun.objects.create(
            data_source=data_source,
            status=IngestionStatus.PROCESSING,
            file_name=upload.name,
            raw_file=upload,
            triggered_by=request.user,
        )

        try:
            upload.seek(0)
            parser = UtilityParser()
            result = parser.parse(upload, ingestion_run)
            records = result.get("records", [])
            errors = result.get("errors", [])

            ingestion_run.row_count = len(records) + len(errors)
            ingestion_run.error_count = len(errors)
            ingestion_run.status = IngestionStatus.DONE
            ingestion_run.completed_at = timezone.now()
            ingestion_run.save(
                update_fields=[
                    "row_count",
                    "error_count",
                    "status",
                    "completed_at",
                ]
            )

            return Response(
                {
                    "ingestion_run_id": ingestion_run.id,
                    "row_count": ingestion_run.row_count,
                    "error_count": ingestion_run.error_count,
                    "errors": errors,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            ingestion_run.status = IngestionStatus.FAILED
            ingestion_run.completed_at = timezone.now()
            ingestion_run.save(update_fields=["status", "completed_at"])
            return Response(
                {"detail": "Ingestion failed", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class TravelIngestView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs) -> Response:
        upload = request.FILES.get("file")
        tenant_id = request.data.get("tenant_id")
        data_source_id = request.data.get("data_source_id")

        if not upload:
            return Response({"detail": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        if not tenant_id or not data_source_id:
            return Response(
                {"detail": "tenant_id and data_source_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_source = get_object_or_404(DataSource, pk=data_source_id, tenant_id=tenant_id)

        ingestion_run = IngestionRun.objects.create(
            data_source=data_source,
            status=IngestionStatus.PROCESSING,
            file_name=upload.name,
            raw_file=upload,
            triggered_by=request.user,
        )

        try:
            upload.seek(0)
            parser = TravelParser()
            result = parser.parse(upload, ingestion_run)
            records = result.get("records", [])
            errors = result.get("errors", [])

            ingestion_run.row_count = len(records) + len(errors)
            ingestion_run.error_count = len(errors)
            ingestion_run.status = IngestionStatus.DONE
            ingestion_run.completed_at = timezone.now()
            ingestion_run.save(
                update_fields=[
                    "row_count",
                    "error_count",
                    "status",
                    "completed_at",
                ]
            )

            return Response(
                {
                    "ingestion_run_id": ingestion_run.id,
                    "row_count": ingestion_run.row_count,
                    "error_count": ingestion_run.error_count,
                    "errors": errors,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            ingestion_run.status = IngestionStatus.FAILED
            ingestion_run.completed_at = timezone.now()
            ingestion_run.save(update_fields=["status", "completed_at"])
            return Response(
                {"detail": "Ingestion failed", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class NormalizedRecordListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs) -> Response:
        queryset = NormalizedRecord.objects.all().annotate(
            audit_entries_count=Count("audit_entries")
        )

        tenant_id = request.query_params.get("tenant_id")
        status_value = request.query_params.get("status")
        source_type = request.query_params.get("source_type")

        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
        if status_value:
            queryset = queryset.filter(status=status_value)
        if source_type:
            queryset = queryset.filter(source_type=source_type)

        queryset = queryset.order_by("-activity_date", "-created_at")

        paginator = PageNumberPagination()
        paginator.page_size = 25
        page = paginator.paginate_queryset(queryset, request)

        serializer = NormalizedRecordSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class NormalizedRecordDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, record_id: int, *args, **kwargs) -> Response:
        record = get_object_or_404(NormalizedRecord, pk=record_id)

        if record.is_locked:
            return Response(
                {"detail": "Record is locked and cannot be modified"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = NormalizedRecordStatusSerializer(record, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        record._audit_user = request.user
        serializer.save()

        record.audit_entries_count = record.audit_entries.count()
        response_serializer = NormalizedRecordSerializer(record)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
