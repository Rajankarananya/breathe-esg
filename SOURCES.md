# Sources

## SAP - Fuel and Procurement

**Format researched:** SAP MB51 Material Document List transaction, flat-file CSV export
SAP ME2M is used for purchase orders; MB51 for goods movements (consumption, issues, receipts). Real exports from SAP ECC and S/4HANA in non-English system language produce German column headers.

**What we learned:**
- Movement type 201 = consumption for cost center (Scope 1 relevant)
- Movement type 261 = goods issue for production order
- Plant codes (Werk) are internal SAP org units, not legal entities
- Units vary: liters (L/LT), kilograms (KG), cubic meters (M3) - sometimes mixed for the same material
- Dates in DD.MM.YYYY (German locale) or MM/DD/YYYY (US locale) depending on system config
- Numeric fields use comma as decimal separator in German locale (1.250,00 vs 1250.00)

**Sample data rationale:**
- 3 plants: Mumbai, Pune, Delhi (realistic Indian multi-site client)
- Materials: DIESEL_001, PETROL_001, FURNACE_OIL_001, LPG_001 (common Scope 1 fuels)
- Mix of L and KG units across rows
- 3 intentional bad rows: invalid date (31.02.2024), missing material, missing quantity

**What would break in production:**
- German decimal separator (1.250,00) not handled; would parse as string
- Plant code lookup table not implemented; plant names are opaque codes
- Material descriptions are short codes, not emission-factor-friendly names
- Large exports (100k+ rows) need chunked pandas reading, not full load

## Utility - Electricity

**Format researched:** Portal CSV export from Indian utility providers
MSEDCL (Maharashtra), BESCOM (Karnataka), TPDDL (Delhi) all offer CSV downloads from their commercial portal. Format varies by provider but consistently includes meter ID, billing period, consumption in kWh or kVAh, and amount.

**What we learned:**
- Billing periods are meter-read cycles, not calendar months (typically 28-32 days)
- Industrial meters (HT category) often report kVAh; residential/commercial report kWh
- A single plant may have multiple meter IDs (lighting, HVAC, production - separate meters)
- Some providers report cumulative meter readings; others report consumption directly

**Sample data rationale:**
- Billing periods deliberately offset (18th to 17th) to reflect real meter cycles
- Mix of kWh and kVAh units across meters
- 1 zero-consumption row (flagged, not rejected - could be a shutdown month)
- 2 missing consumption rows (errors)

**What would break in production:**
- PDF bill parsing not implemented; some facilities teams only have PDFs
- Multi-meter aggregation not handled; 5 meters for one plant need summing
- Cumulative reading format (read current - read previous) not supported

## Corporate Travel - Flights, Hotels, Ground

**Format researched:** Concur Expense and Navan (formerly TripActions) CSV exports
Concur Travel exports via the Concur API (v4) or as CSV from the reporting module. Navan exports via their reporting dashboard. Both include booking metadata, traveler ID, trip category, origin/destination, and amount.

**What we learned:**
- Flight records include IATA origin/destination codes, not always distances
- Hotel records rarely include check-in/check-out in standard CSV exports
- Ground transport (taxi, train) usually has distance or city-pair
- Concur separates expense reports from travel bookings - we modeled travel bookings
- Emission factors for flights vary by cabin class (economy vs business: ~2x factor)

**Sample data rationale:**
- 6 Indian airport IATA codes (BOM, DEL, BLR, HYD, MAA, CCU)
- Some flight rows have DistanceKM blank - haversine calculation kicks in
- Hotel rows use city names not IATA codes
- 2 rows with missing TravelDate (errors)

**What would break in production:**
- Only 6 airports hardcoded; international routes would fail distance calculation
- Hotel nights defaulted to 1; understates emissions for multi-night stays
- Cabin class affects emission factor but we store it in extra, do not use it yet
- Concur vs Navan column names differ; would need per-client column mapping config
