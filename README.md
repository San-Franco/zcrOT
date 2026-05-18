# zcrOT Frontend Demo

zcrOT is configured here as a frontend-only OT cybersecurity visibility demo for a fictional industrial energy environment.

Demo identity:

- Customer: ABC Industrial Co., Ltd.
- Site: ABC Smart Energy Factory
- Environment: ABC OT Energy Monitoring Site
- Report: zcrOT OT Cybersecurity Visibility Demo Report

The demo does not require an API server, database, container services, workers, collectors, authentication server, or external AI/API service. All dashboard, detection, notification, port-management, user-management, and report-generation workflows use local browser mock services.

## Run

```bash
cd ui
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

Demo login accepts any username/password and uses a local demo session. Suggested account:

```text
demo.admin
demo
```

## Demo Scope

The mock environment models:

- Direct Ethernet/IP-visible assets: Router, Core Switch, OT Gateway / Smart Logger / Unit 0, Industrial Cloud Gateway, EV Charger, Engineering Workstation.
- Downstream logical OT units: Unit 1 = Solar Inverter, Unit 11 = Power Meter, Unit 100 = Environmental Sensor.
- External peers: documentation-range cloud, NTP, and remote maintenance endpoints.
- Unknown client investigation examples.

Downstream units are intentionally represented as logical entities identified through OT Gateway telemetry or Modbus-style unit IDs. The demo does not claim direct IP/MAC visibility for serial or gateway-managed downstream devices.

## Frontend Demo Data

The frontend mock layer lives in `ui/src/mock/` and provides:

- mock users and auth session
- mock assets and device mappings
- mock communication flows and gateway topology
- mock Modbus polling summaries
- mock security events and detection rules
- mock threat incidents and incident-event mapping
- mock notifications and port status
- mock report data and local simulated report narratives

Mutable demo state is stored in browser localStorage so create/edit/delete/status workflows survive refresh during a demo session.

## Deploy On Vercel

This repository is Vercel-ready from the repository root.

Vercel uses `vercel.json` to:

- install dependencies with `npm --prefix ui ci`
- typecheck and build with `npm --prefix ui run build:check`
- serve the static Vite output from `ui/dist`
- rewrite all routes to `index.html` so browser refresh works on dashboard pages
- cache hashed Vite assets under `/assets`

No backend, database, worker, API key, or AI service is required.

Recommended Vercel environment variables are optional because safe demo defaults are already built in:

```text
VITE_APP_MODE=demo
VITE_USE_MOCKS=true
VITE_DEMO_CUSTOMER_NAME=ABC Industrial Co., Ltd.
VITE_DEMO_SITE_NAME=ABC Smart Energy Factory
VITE_DEMO_ENVIRONMENT_NAME=ABC OT Energy Monitoring Site
```

For local root-level checks:

```bash
npm run build:check
```
