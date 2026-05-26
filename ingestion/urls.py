from django.urls import path

from .views import (
    NormalizedRecordDetailView,
    NormalizedRecordListView,
    SAPIngestView,
    TravelIngestView,
    UtilityIngestView,
)

urlpatterns = [
    path("ingest/sap/", SAPIngestView.as_view(), name="ingest-sap"),
    path("ingest/utility/", UtilityIngestView.as_view(), name="ingest-utility"),
    path("ingest/travel/", TravelIngestView.as_view(), name="ingest-travel"),
    path("records/", NormalizedRecordListView.as_view(), name="record-list"),
    path("records/<int:record_id>/", NormalizedRecordDetailView.as_view(), name="record-detail"),
]
