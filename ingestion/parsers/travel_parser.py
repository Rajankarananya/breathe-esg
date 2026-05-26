from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from math import asin, cos, radians, sin, sqrt
from typing import Any

import pandas as pd

from ingestion.models import NormalizedRecord, RecordStatus, Scope, SourceType


class TravelParser:
    AIRPORT_COORDS = {
        "BOM": (19.0896, 72.8656),
        "DEL": (28.5562, 77.1000),
        "BLR": (13.1986, 77.7066),
        "HYD": (17.2403, 78.4294),
        "MAA": (12.9941, 80.1709),
        "CCU": (22.6542, 88.4467),
    }

    CATEGORY_SCOPE = {
        "FLIGHT": Scope.SCOPE_3,
        "HOTEL": Scope.SCOPE_3,
        "GROUND_TAXI": Scope.SCOPE_3,
        "GROUND_TRAIN": Scope.SCOPE_3,
    }

    CATEGORY_UNIT = {
        "FLIGHT": "km",
        "HOTEL": "night",
        "GROUND_TAXI": "km",
        "GROUND_TRAIN": "km",
    }

    def parse(self, file_obj, ingestion_run) -> dict[str, Any]:
        errors: list[dict[str, Any]] = []
        records: list[NormalizedRecord] = []

        df = self._read_csv(file_obj)
        df_original = df.copy()

        required_columns = {
            "BookingDate",
            "TravelDate",
            "TravelerID",
            "Category",
            "Origin",
            "Destination",
            "DistanceKM",
            "Class",
            "AmountINR",
            "CostCenter",
            "VendorName",
        }
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            return {
                "records": [],
                "errors": [
                    {
                        "row": None,
                        "reason": "Missing required columns",
                        "details": sorted(missing_columns),
                    }
                ],
            }

        tenant = ingestion_run.data_source.tenant

        for index, row in df.iterrows():
            raw_row = self._sanitize_dict(df_original.iloc[index].to_dict())
            category = self._clean_string(row.get("Category"))
            travel_date_raw = self._clean_string(row.get("TravelDate"))

            if not travel_date_raw:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Missing travel date",
                        "raw_record": raw_row,
                    }
                )
                continue

            activity_date = self._parse_date(travel_date_raw)
            if activity_date is None:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Invalid travel date",
                        "raw_record": raw_row,
                    }
                )
                continue

            if not category or category not in self.CATEGORY_SCOPE:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Unknown category",
                        "raw_record": raw_row,
                    }
                )
                continue

            quantity, unit = self._resolve_quantity_and_unit(category, row)
            if quantity is None or unit is None:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Unable to determine distance",
                        "raw_record": raw_row,
                    }
                )
                continue

            extra = self._sanitize_dict(
                {
                    "traveler_id": row.get("TravelerID"),
                    "category": category,
                    "origin": row.get("Origin"),
                    "destination": row.get("Destination"),
                    "class": row.get("Class"),
                    "amount_inr": row.get("AmountINR"),
                    "cost_center": row.get("CostCenter"),
                    "vendor": row.get("VendorName"),
                }
            )

            records.append(
                NormalizedRecord(
                    tenant=tenant,
                    ingestion_run=ingestion_run,
                    source_type=SourceType.TRAVEL,
                    scope=self.CATEGORY_SCOPE[category],
                    activity_date=activity_date,
                    quantity=quantity,
                    unit=unit,
                    status=RecordStatus.PENDING,
                    raw_record=raw_row,
                    extra=extra,
                )
            )

        created = []
        if records:
            created = NormalizedRecord.objects.bulk_create(records, batch_size=1000)

        return {"records": created, "errors": errors}

    def _read_csv(self, file_obj) -> pd.DataFrame:
        try:
            file_obj.seek(0)
            return pd.read_csv(file_obj, encoding="utf-8")
        except UnicodeDecodeError:
            file_obj.seek(0)
            return pd.read_csv(file_obj, encoding="cp1252")

    def _parse_date(self, raw_value: str | None):
        if not raw_value:
            return None
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(raw_value, fmt).date()
            except ValueError:
                continue
        return None

    def _resolve_quantity_and_unit(self, category: str, row) -> tuple[Decimal | None, str | None]:
        if category == "HOTEL":
            return Decimal("1"), self.CATEGORY_UNIT[category]

        distance_value = row.get("DistanceKM")
        if not pd.isna(distance_value):
            try:
                return Decimal(str(distance_value)), self.CATEGORY_UNIT[category]
            except (InvalidOperation, ValueError):
                return None, None

        if category != "FLIGHT":
            return None, None

        origin = self._clean_string(row.get("Origin"))
        destination = self._clean_string(row.get("Destination"))
        if not origin or not destination:
            return None, None

        coord1 = self.AIRPORT_COORDS.get(origin.upper())
        coord2 = self.AIRPORT_COORDS.get(destination.upper())
        if not coord1 or not coord2:
            return None, None

        distance = self._haversine_km(coord1, coord2)
        return Decimal(str(distance)), self.CATEGORY_UNIT[category]

    def _haversine_km(self, coord1, coord2) -> float:
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        radius_km = 6371.0

        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)

        a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))
        return radius_km * c

    def _clean_string(self, value: Any) -> str | None:
        if value is None or pd.isna(value):
            return None
        cleaned = str(value).strip()
        return cleaned if cleaned else None

    def _sanitize_dict(self, values: dict[str, Any]) -> dict[str, Any]:
        return {key: self._sanitize_value(value) for key, value in values.items()}

    def _sanitize_value(self, value: Any) -> Any:
        if value is None or pd.isna(value):
            return None
        return value
