# TravelRunning Forms

Static web forms for TravelRunning booking system. Hosted on GitHub Pages.

## Forms

- `/preventivo/` — Quote request form (`?event=XXXX`)
- `/prenotazione/` — Booking form (`?token=XXXX`)

## Hosting

Served via GitHub Pages from the `main` branch root.

**Live URL:** `https://giacomo-benedetti.github.io/travelrunning-forms/`

## Architecture

Pure static HTML/CSS/JS — no build step, no dependencies.
Forms submit data to n8n webhooks (external automation server).
