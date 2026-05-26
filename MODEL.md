# Data Model

## Overview
The core design uses a single NormalizedRecord table as the canonical ledger. Source-specific details live in the JSONB `extra` field to keep the ledger stable while allowing source variance. An immutable audit trail is enforced through Django signals so every meaningful change is captured without relying on app-layer discipline.

## Entity Relationship
Tenant -> DataSource -> IngestionRun -> NormalizedRecord -> AuditEntry
EmissionFactor acts as a reference table for future CO2e calculations.

## Model Decisions

### Multi-tenancy
Every NormalizedRecord carries a direct tenant foreign key (denormalized intentionally). This is because dashboard queries filter by tenant first; carrying the tenant id on the record avoids joins up the chain and keeps query plans simple under heavy read traffic.

### Scope 1/2/3 Categorization
- SAP fuel/procurement -> SCOPE_1 (direct combustion, company-owned)
- Utility electricity -> SCOPE_2 (indirect, purchased energy)
- Corporate travel -> SCOPE_3 (value chain, employee travel)
Each mapping mirrors GHG Protocol definitions: direct fuel use is Scope 1, purchased electricity is Scope 2, and employee travel is Scope 3.

### Source-of-Truth Tracking
- `raw_record` (JSONField): the original unparsed row, never modified after creation
- `ingestion_run` FK: links every record to the exact file upload that produced it
- `AuditEntry` with `diff`: captures every field change with old/new values
- `is_locked`: approved records cannot be modified (enforced in both `model.save()` and the API layer)

### Unit Normalization
- SAP: L/LT -> liters, KG stays kg, M3 -> liters (x1000), G -> kg (x0.001)
- Utility: kVAh -> kWh (x0.9 power factor approximation)
- Travel: all distances in km; hotels default to 1 night as quantity
- All CO2e stored in kg CO2e

### Audit Trail
- Django signals (pre_save + post_save) capture snapshots
- `AuditEntry.diff` stores field-level changes as {field: {old: x, new: y}}
- Action auto-detected from status change: APPROVED/REJECTED/FLAGGED
- `performed_by`: request.user set via instance._audit_user before save
