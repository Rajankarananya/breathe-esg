from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Any

import pandas as pd

from ingestion.models import NormalizedRecord, RecordStatus, Scope, SourceType


class SAPParser:
    COLUMN_MAP = {
        "Buchungsdatum": "posting_date",
        "Werk": "plant",
        "Material": "material_code",
        "Menge": "quantity",
        "Mengeneinheit": "unit",
        "Bewegungsart": "movement_type",
        "Kostenstelle": "cost_center",
        "Nettopreis": "net_price",
        "Waehrung": "currency",
        "Kurztext": "description",
    }

    UNIT_NORMALIZATION = {
        "L": ("liters", Decimal("1.0")),
        "LT": ("liters", Decimal("1.0")),
        "KG": ("kg", Decimal("1.0")),
        "M3": ("liters", Decimal("1000.0")),
        "G": ("kg", Decimal("0.001")),
    }

    MATERIAL_SCOPE = {
        "DIESEL": Scope.SCOPE_1,
        "PETROL": Scope.SCOPE_1,
        "FURNACE_OIL": Scope.SCOPE_1,
        "LPG": Scope.SCOPE_1,
    }

    def parse(self, file_obj, ingestion_run) -> dict[str, Any]:
        errors: list[dict[str, Any]] = []
        records: list[NormalizedRecord] = []

        df = self._read_csv(file_obj)
        df_original = df.copy()
        df = df.rename(columns=self.COLUMN_MAP)

        required_columns = {"posting_date", "material_code", "quantity", "unit"}
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
            material_code = self._clean_string(row.get("material_code"))
            quantity_value = row.get("quantity")
            unit_code = self._clean_string(row.get("unit"))

            if not material_code or pd.isna(quantity_value):
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Missing material or quantity",
                        "raw_record": raw_row,
                    }
                )
                continue

            try:
                quantity = Decimal(str(quantity_value))
            except (InvalidOperation, ValueError):
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Invalid quantity",
                        "raw_record": raw_row,
                    }
                )
                continue

            posting_date_raw = self._clean_string(row.get("posting_date"))
            activity_date = self._parse_date(posting_date_raw)
            if activity_date is None:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Invalid posting date",
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
            normalized_quantity = quantity * multiplier

            scope = self._resolve_scope(material_code)
            if scope is None:
                errors.append(
                    {
                        "row": int(index) + 1,
                        "reason": "Unknown material scope",
                        "raw_record": raw_row,
                    }
                )
                continue

            extra = {
                "plant": row.get("plant"),
                "material_code": material_code,
                "movement_type": row.get("movement_type"),
                "cost_center": row.get("cost_center"),
                "net_price": row.get("net_price"),
                "currency": row.get("currency"),
                "description": row.get("description"),
            }

            records.append(
                NormalizedRecord(
                    tenant=tenant,
                    ingestion_run=ingestion_run,
                    source_type=SourceType.SAP,
                    scope=scope,
                    activity_date=activity_date,
                    quantity=normalized_quantity,
                    unit=unit_name,
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
        try:
            return datetime.strptime(raw_value, "%d.%m.%Y").date()
        except ValueError:
            return None

    def _normalize_unit(self, unit_code: str | None):
        if not unit_code:
            return None
        return self.UNIT_NORMALIZATION.get(unit_code.upper())

    def _resolve_scope(self, material_code: str | None):
        if not material_code:
            return None
        material_upper = material_code.upper()
        for prefix in sorted(self.MATERIAL_SCOPE, key=len, reverse=True):
            if material_upper.startswith(prefix):
                return self.MATERIAL_SCOPE[prefix]
        return None

    def _clean_string(self, value: Any) -> str | None:
        if value is None or pd.isna(value):
            return None
        cleaned = str(value).strip()
        return cleaned if cleaned else None
