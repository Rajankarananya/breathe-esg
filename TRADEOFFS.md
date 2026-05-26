# Tradeoffs

## 1. No emission factor calculation (CO2e not computed)
**What we did not build:** Automatic multiplication of quantity x emission_factor -> quantity_co2e
**Why:** Emission factors are jurisdiction and year specific. For diesel in India, IPCC 2006 vs GHG Protocol vs MoEFCC factors differ. Hardcoding one would be worse than leaving it blank; an auditor would reject incorrect CO2e values.
**What exists:** The EmissionFactor model and quantity_co2e field are ready. A calculation service would look up EmissionFactor by source_type + activity_type + region + year, multiply, and populate the field. This is a one-sprint addition.

## 2. No multi-tenant UI (tenant is hardcoded to ID=1)
**What we did not build:** Tenant switcher, per-user tenant assignment, tenant onboarding flow
**Why:** The assignment is about ingestion and review, not tenant management. Building a full tenant admin would consume 2 days of a 4-day window.
**What exists:** The data model is fully multi-tenant. Every query filters by tenant_id. Adding a tenant switcher is a UI-only change with no schema work.

## 3. No file deduplication / re-ingestion guard
**What we did not build:** Detection of duplicate uploads (same file uploaded twice)
**Why:** Deduplication requires either file hashing (MD5/SHA) or row-level unique constraints across source + date + quantity + plant. The latter has false positives (same plant, same day, same quantity is plausible). File hashing is reliable but adds complexity.
**The risk:** An analyst uploading the same CSV twice doubles the records silently.
**Mitigation in place:** IngestionRun stores the original filename and timestamp; a duplicate is visible in the admin and in the audit trail.
