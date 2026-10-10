# AnnaSetu AI — Application Quick Access & Scratchpad

> **Status:** Both the **Next.js Web Frontend** (`localhost:3000`) and the **FastAPI Backend** (`127.0.0.1:8000`) are active and running.

---

## 🌐 Live Application Links

### 1. Dedicated Role Dashboards & Privacy Isolation
| Workspace | URL | Target User & Core Features |
| :--- | :--- | :--- |
| **Food Donor / Vendor Dashboard** | [http://localhost:3000/dashboard/donor](http://localhost:3000/dashboard/donor) | **Strictly for Caterers & Donors:** Food surplus posting with photo upload, **editable contact person name**, quantity, prep time, address, and interactive **AI Assistant Bot Verification** (photo clarity audit, FSSAI temperature rule audit, description enhancement, automatic live publishing). **Strict Privacy Barrier:** Users logged in as Ashram/Receptionist cannot view this page and are blocked. |
| **Ashram / Recipient Dashboard** | [http://localhost:3000/dashboard/recipient](http://localhost:3000/dashboard/recipient) | **Strictly for Ashrams & Shelters:** Live incoming food feed displaying real donor offerings with full photo, quantity, distance, and AI certification. Includes **Deny** and **Accept Food** buttons. **Clicking Accept Food automatically redirects straight to the Delivery & Live Chat page!** **Strict Privacy Barrier:** Users logged in as Food Donors cannot view this page and are blocked. |
| **Delivery Handover & Live Chat** | [http://localhost:3000/handover](http://localhost:3000/handover) | **Live 2-Way Coordination & Audit:** Shows Delivery Handover OTP, physical inspection checklist, and **Direct 2-Way Chat** between strictly two parties: **Donor** and **Receiver**. Messages appear only once (strictly deduplicated, zero duplicates). |

---

### 2. Core Entry & Authentication with Distinct Role Content
| Page | URL | Purpose & Features |
| :--- | :--- | :--- |
| **Landing Page** | [http://localhost:3000](http://localhost:3000) | Clean public portal. Features only **Log In** and **Sign Up** actions. |
| **Sign Up (Role-Adaptive)** | [http://localhost:3000/signup](http://localhost:3000/signup) | **Distinct Content per Role:** Toggle between **Food Donor / Caterer** and **Ashram / Receptionist** (or use `?role=donor` / `?role=recipient`). Renders completely customized headings, benefit lists, privacy notices, and tailored field placeholders. Automatically dispatches to your dedicated dashboard upon 6-digit OTP verification. |
| **Log In (Role-Adaptive)** | [http://localhost:3000/login](http://localhost:3000/login) | **Distinct Content per Role:** Toggle between **Food Donor / Caterer** and **Ashram / Receptionist** (or use `?role=donor` / `?role=recipient`). Renders distinct portal headings, feature tools, and strict privacy isolation banners. Automatically dispatches Donors to `/dashboard/donor` and Ashrams to `/dashboard/recipient`. |
| **Smart Dashboard Dispatcher** | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) | Automatically routes authenticated users strictly to their role portal. |

---

### 3. Operational & System Consoles
| Workspace | URL | Purpose & Features |
| :--- | :--- | :--- |
| **Agentic AI Coordinator** | [http://localhost:3000/agent](http://localhost:3000/agent) | LangGraph autonomous multi-agent orchestration console with real-time reasoning trace. |
| **Operations Console** | [http://localhost:3000/operations](http://localhost:3000/operations) | Operations audit trail, impact metrics (meals rescued, CO₂ saved), active dispatches, and system health. |
| **Browse Food Listings** | [http://localhost:3000/listings](http://localhost:3000/listings) | Public surplus food directory with safety breakdown. |
| **Ashram Demand & Capacity** | [http://localhost:3000/recipients/capacity](http://localhost:3000/recipients/capacity) | Formal capacity registry for recording meal requirements and storage. |

---

### 4. Backend & API Services
| Service | URL | Purpose |
| :--- | :--- | :--- |
| **FastAPI Interactive Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI for exploring and executing all REST endpoints. |
| **ReDoc Specification** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Alternate clean API documentation. |
| **System Health Check** | [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) | API health & dependency status check. |

---

### 5. GitHub Repository
| Repository | URL | Status |
| :--- | :--- | :--- |
| **AnnaSetu AI (ibm_project)** | [https://github.com/Jyotirmaya01/ibm_project](https://github.com/Jyotirmaya01/ibm_project) | **Public & Synchronized:** All branches, components, models, and docs are live on GitHub. |

---

## 🔒 Strict Role Privacy & Isolation Architecture

1. **Different Content on Login & Signup**:
   - Both `/login` and `/signup` dynamically adapt their interface based on the active role (`Food Donor / Caterer` vs `Ashram / Receptionist`).
   - Donors see catering & banquet registration, Good Samaritan liability protections, AI photo shelf-life tools, and donor privacy notices.
   - Ashrams see shelter & orphanage intake registration, dining headcount management, safety inspection checklists, and resident confidentiality notices.

2. **Route Guard & Dashboard Isolation**:
   - If an **Ashram / Receptionist** attempts to access `/dashboard/donor`, a full-screen **Private Donor Portal** privacy barrier immediately intervenes and redirects them to their Ashram dashboard.
   - If a **Food Donor** attempts to access `/dashboard/recipient`, a full-screen **Private Ashram Portal** privacy barrier immediately intervenes and redirects them to their Donor dashboard.
   - Cross-portal header links between the two roles have been eliminated to ensure complete isolation.

3. **Handover & Live Chat**:
   - Dedicated communication channel with strictly two parties: **Donor** and **Receiver**.
   - Messages appear strictly **once** with zero duplicates.
