from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any

import pandas as pd

from ingestion.models import NormalizedRecord, RecordStatus, Scope, SourceType


class UtilityParser:
    UNIT_NORMALIZATION = {
        "kWh": ("kWh", Decimal("1.0")),
        "KWH": ("kWh", Decimal("1.0")),
        "kVAh": ("kWh", Decimal("0.9")),
        "KVAH": ("kWh", Decimal("0.9")),
    }

    def parse(self, file_obj, ingestion_run) -> dict[str, Any]:
        errors: list[dict[str, Any]] = []
        records: list[NormalizedRecord] = []

        df = self._read_csv(file_obj)
        df_original = df.copy()

        required_columns = {
            "BillDate",
            "MeterID",
            "AccountNumber",
            "BillingPeriodStart",
            "BillingPeriodEnd",
            "Consumption",
            "Unit",
            "TariffCategory",
            "AmountINR",
            "PlantCode",
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
            raw_row = df_original.iloc[index].to_dict()
            consumption_value = row.get("Consumption")
            unit_code = self._clean_string(row.get("Unit"))

            if pd.isna(consumption_value):
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Missing consumption",
                        "raw_record": raw_row,
                    }
                )
                continue

            try:
                consumption = Decimal(str(consumption_value))
            except (InvalidOperation, ValueError):
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Invalid consumption",
                        "raw_record": raw_row,
                    }
                )
                continue

            activity_date = self._parse_date(self._clean_string(row.get("BillingPeriodStart")))
            if activity_date is None:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Invalid billing period start",
                        "raw_record": raw_row,
                    }
                )
                continue

            normalized_unit = self._normalize_unit(unit_code)
            if normalized_unit is None:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Unknown unit",
                        "raw_record": raw_row,
                    }
                )
                continue

            unit_name, multiplier = normalized_unit
            normalized_quantity = consumption * multiplier

            status = RecordStatus.PENDING
            if normalized_quantity == 0:
                status = RecordStatus.FLAGGED

            extra = {
                "meter_id": row.get("MeterID"),
                "account_number": row.get("AccountNumber"),
                "billing_period_end": row.get("BillingPeriodEnd"),
                "tariff_category": row.get("TariffCategory"),
                "amount_inr": row.get("AmountINR"),
                "plant_code": row.get("PlantCode"),
            }

            records.append(
                NormalizedRecord(
                    tenant=tenant,
                    ingestion_run=ingestion_run,
                    source_type=SourceType.UTILITY,
                    scope=Scope.SCOPE_2,
                    activity_date=activity_date,
                    quantity=normalized_quantity,
                    unit=unit_name,
                    status=status,
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
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"):
            try:
                return datetime.strptime(raw_value, fmt).date()
            except ValueError:
                continue
        return None

    def _normalize_unit(self, unit_code: str | None):
        if not unit_code:
            return None
        return self.UNIT_NORMALIZATION.get(unit_code)

    def _clean_string(self, value: Any) -> str | None:
        if value is None or pd.isna(value):
            return None
        cleaned = str(value).strip()
        return cleaned if cleaned else None
