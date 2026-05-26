# Decisions

## SAP Ingestion
**Format chosen:** Flat-file CSV (MB51/ME2M transaction export style)
**Why not IDoc:** IDocs require SAP middleware (ALE/EDI), not realistic for a prototype
**Why not OData:** OData requires live SAP system connectivity
**Why flat file:** Most common real-world handoff. SAP basis teams export MB51 to CSV and send via SFTP or email. This matches what sustainability leads typically receive.

**German headers:** Real SAP exports in German locale use Buchungsdatum, Werk, Menge, etc. We handle this with a COLUMN_MAP translation layer.

**Subset handled:** Movement types 201 (consumption) and 261 (goods issue) only.
Ignored: returns (262), transfers (301), stock transport orders.
**Why:** Scope 1 emissions come from consumption movements, not transfers.

**What I'd ask the PM:**
- Do clients export from SAP directly or via a middleware layer?
- Is there a plant-to-legal-entity mapping table we can reference?
- Are material codes standardized across clients or client-specific?

## Utility Ingestion
**Format chosen:** Portal CSV export
**Why not PDF:** PDF parsing is fragile; table extraction breaks across utility providers.
**Why not API:** Very few Indian utilities offer programmatic APIs (BESCOM, MSEDCL do not).
**Portal CSV** is what facilities teams actually download and email to sustainability leads.

**Billing period alignment:** Utility bills do not align to calendar months (e.g., 18th to 17th). We store BillingPeriodStart as activity_date so analysts see the actual consumption window.

**kVAh handling:** Some industrial meters report kVAh instead of kWh. We convert using 0.9 power factor (industry standard approximation for HT industrial loads).

**What I'd ask the PM:**
- Do clients have multiple meters per plant or one account per plant?
- Should billing period misalignment be surfaced to analysts as a flag?

## Travel Ingestion
**Format chosen:** Concur/Navan CSV export
**Why CSV over API:** Navan API requires OAuth per client setup. CSV export is universal across Concur, Navan, TripActions, and in-house travel desks.

**Distance calculation:** Concur exports often omit distance for flights, only origin/destination IATA codes. We compute great-circle distance using the Haversine formula with hardcoded airport coordinates for the top 6 Indian airports.

**Hotel quantity:** Navan exports do not reliably include check-in/check-out dates in all configs. We default to 1 night as quantity; this is a known limitation and is documented in SOURCES.md.

**What I'd ask the PM:**
- Which travel platform does this client use? (affects column names)
- Are hotel nights available in their export config?
- Should personal travel be filtered out via cost center?

## Analyst Review Flow
**Why PENDING -> APPROVED locks the record:**
Once an analyst approves a record it enters the audit-ready state. Allowing edits after approval would invalidate the audit trail. Rejection keeps the record editable (analyst may want to correct and re-approve).

## Authentication
**SimpleJWT over session auth:** The React SPA needs stateless auth. Sessions do not work cleanly across origins in dev.
