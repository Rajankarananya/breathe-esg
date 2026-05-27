# Breathe ESG — Data Ingestion Platform

## Live App
https://breathe-esg-jg7b.onrender.com

## Login
Username: admin
Password: admin123

## What it does
Ingests emissions data from SAP (fuel), utility portals (electricity), 
and corporate travel platforms. Normalizes it and surfaces a review 
dashboard where analysts approve/reject records before audit lock.

## Sample data files
- ingestion/sample_data/sap_fuel_export.csv
- ingestion/sample_data/utility_electricity.csv
- ingestion/sample_data/travel_export.csv

## Stack
Django 5 + DRF + PostgreSQL + React + Vite — deployed on Render

## Design docs
- MODEL.md — data model decisions
- DECISIONS.md — ingestion format choices
- TRADEOFFS.md — what was deliberately not built
- SOURCES.md — real-world format research
