# UCCX Multi-Tenant Wallboard & Dashboard

A modern, real-time dashboard system for Cisco UCCX call centers, enabling multi-tenant wallboard analytics, operator and queue live status, customizable KPI dashboards, and historical/reporting data integration.

---

## 🚀 Project Vision

This project provides a **modular, scalable, and customizable** wallboard/dashboard for Cisco UCCX-based call centers and IVR systems. It allows organizations (including multi-business holding groups) to monitor and analyze their real-time and historical call center operations, optimize resources, and customize reporting per business needs.

---

## ⚡️ Key Features

- **Live Operator Status:** Real-time monitoring of all agents/operators and their performance metrics.
- **Live Queue Status:** Instant insight into queue volumes, wait times, missed calls, and other KPIs.
- **Aggregated Call Center Stats:** Multi-tenant, company-wide, and day-wise summary statistics at a glance.
- **Custom KPI Dashboard:** Configure and prioritize displayed KPIs per company, team, or user.
- **Historical Data Analytics:** Query, visualize, and export call history, queue trends, and agent performance.
- **Survey Reports:** Integrate customer survey results (from UCCX or external SQL server).
- **Admin Panel:** Manage users, roles, agent visibility, dashboard customization, and company-level settings.
- **Multi-Tenant Support:** Single UCCX instance, multiple businesses/companies with isolated data and configs.
- **Role-Based Access Control:** Fine-grained access control for admins, supervisors, and users.
- **Extensible Reporting:** Plug-in architecture for custom queries, data sources, and exportable reports.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, [NestJS](https://nestjs.com/), TypeORM/Prisma (MS SQL Server), Swagger/OpenAPI, Redis (caching), Socket.io (real-time)
- **Frontend:** React.js, Material UI (or Ant Design), Socket.io-client, Chart.js (or Recharts)
- **Database:** MS SQL Server (main), Redis (caching, session), optional external SQL for survey data
- **DevOps:** Docker, GitHub Actions, ready for cloud deployment (Azure/AWS)

---

## 📦 Project Structure & Phases

### Phase 1 – Core Data APIs & Real-Time Wallboard

- Connect to UCCX Operator and Queue APIs
- Expose REST endpoints (NestJS + Swagger) for agent/queue stats
- Implement WebSocket real-time push for live wallboard updates
- MS SQL integration for optional historical/call/survey data
- Simple user authentication & role-based access (JWT)

### Phase 2 – Frontend Wallboard Dashboard

- Set up React.js project structure
- Live dashboards: operators, queues, global KPIs
- Basic user login and tenant-aware dashboard views
- Responsive layout for wallboard displays

### Phase 3 – Admin Panel & Customization

- Admin UI for user/role management
- Configure which KPIs and agents/queues to display per company/team
- Assign dashboard themes, branding, and custom metrics

### Phase 4 – Reporting & Analytics

- Historical data queries & analytics (calls, surveys, performance)
- Custom report builder, export (CSV/XLS), and scheduling
- Visualization: charts, tables, drill-downs

### Phase 5 – Extensibility & Integrations

- Plug-in support for new data sources, custom KPIs, and integrations
- Optional: Integrate external survey/feedback data from other SQL sources
- Enhanced notification/alerting (email/SMS/push)


### Documentation
- API Docs: auto-generated Swagger UI at /api
- Architecture Diagrams: See /docs/architecture/
- EConfiguration: Example .env files in both repos

### Contact
- Radman Co.

---

