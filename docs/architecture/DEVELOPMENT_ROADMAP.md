# ChemScale — Phased Development Roadmap

**Version:** 1.0.0
**Date:** 2026-02-26
**Methodology:** Agile (2-week sprints, quarterly releases)

---

## Roadmap Overview

```
                        CHEMSCALE DEVELOPMENT TIMELINE
 ─────────────────────────────────────────────────────────────────────────
 PHASE 0        PHASE 1          PHASE 2            PHASE 3         PHASE 4
 Foundation     MVP Core         Equipment+Econ     Advanced        Platform
 Wk 1─8        Wk 9─20          Wk 21─32           Wk 33─48        Wk 49─60
 ─────────────────────────────────────────────────────────────────────────
 │              │                │                  │               │
 │ Thermo Eng   │ Pipe Sizing    │ Material Sel.    │ Distillation  │ P&ID Dev
 │ Component DB │ Phase Sep.     │ Pump Sizing      │ Process Safety│ Collab
 │ Unit Conv    │ Heat Exchanger │ PSV/PRV          │ APC           │ Integr.
 │ API Shell    │ Datasheets     │ Economics        │ Plant Layout  │ Polish
 │ Auth + UI    │ Project CRUD   │ Cross-Module     │ Phase Envelope│
 │              │                │                  │               │
 ─────────────────────────────────────────────────────────────────────────
   Q1 2026          Q2 2026          Q3 2026         Q4 2026       Q1 2027
```

---

## Phase 0 — Foundation (Weeks 1–8)

**Objective:** Build the computational and infrastructure foundation upon which all modules depend.

### Sprint 1–2 (Weeks 1–4): Infrastructure & Core Engine

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Monorepo setup (Python backend + React frontend) | DevOps | `docker-compose up` runs full stack locally |
| PostgreSQL schema + Alembic migrations | Backend | All tables from COMPONENT_DB_SCHEMA.sql migrated |
| FastAPI project skeleton + OpenAPI docs | Backend | `/docs` serves Swagger UI |
| Auth integration (Keycloak/Auth0) | Backend | JWT-protected endpoints functional |
| Unit conversion engine | Backend | 200+ unit conversions pass (SI ↔ US ↔ CGS) |
| React shell + Tailwind design system | Frontend | Navigation, auth flow, component search UI |
| CI/CD pipeline (GitHub Actions) | DevOps | Lint + test + build on every PR |

### Sprint 3–4 (Weeks 5–8): Thermodynamic Engine

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Component Database (500 compounds loaded) | Data Eng | All critical properties + DIPPR correlations |
| Peng-Robinson EOS (pure + mixture) | Backend | ±1% vs. NIST for 20 reference compounds |
| NRTL activity coefficient model | Backend | ±5% on γ values vs. DECHEMA VLE data |
| PT Flash (Rachford-Rice solver) | Backend | Converges for 30+ test systems |
| Bubble/dew point calculations | Backend | ±0.5 K accuracy on binary VLE |
| Transport property correlations | Backend | Viscosity, thermal conductivity, surface tension |
| Binary interaction parameter loading | Data Eng | 200+ kij pairs for common systems |
| Thermo API endpoints + tests | Backend | >90% code coverage on thermo package |

**Phase 0 Deliverable:** Standalone property calculator web app. Engineers can search for components, select a thermo model, and get validated phase + properties at any T, P, composition.

**Exit Criteria:**
- [ ] 500 components in database with all DIPPR correlations
- [ ] PT Flash converges for all GPSA reference systems
- [ ] Property accuracy within ±1% of NIST for pure components
- [ ] Automated test suite >90% coverage
- [ ] Docker deployment functional

---

## Phase 1 — MVP Core Modules (Weeks 9–20)

**Objective:** Deliver the three highest-value engineering sizing tools.

### Sprint 5–6 (Weeks 9–12): Pipe Sizing & Phase Separators

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Darcy-Weisbach + Colebrook-White solver | Backend | ΔP within ±2% of Crane TP-410 examples |
| Two-phase pressure drop (Lockhart-Martinelli) | Backend | Validated against GPSA Section 17 |
| Erosional velocity check (API RP 14E) | Backend | Correct C-factor application |
| Pipe schedule selection + fitting K-factors | Backend | Full Crane TP-410 database loaded |
| Pipe sizing UI (input form + results table) | Frontend | Responsive, unit switching, export |
| 2-phase separator (Souders-Brown, retention time) | Backend | Matches GPSA Section 7 examples |
| 3-phase separator (horizontal with weir) | Backend | Gas/oil/water distribution correct |
| Separator internals selection (demister sizing) | Backend | Mesh pad area per Koch-Glitsch data |
| Separator UI + nozzle placement diagram | Frontend | SVG cross-section with dimensions |

### Sprint 7–8 (Weeks 13–16): Heat Exchanger Module

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Quick estimate (U×A×LMTD×Ft) | Backend | Matches hand calc within ±1% |
| LMTD correction factor (Bowman formula) | Backend | Ft tables reproduced for 1-2, 2-4 pass configs |
| Bell-Delaware shell-side (Jc, Jl, Jb, Js, Jr) | Backend | Validated against HTRI benchmark cases |
| Tube-side (Gnielinski + Sieder-Tate) | Backend | Re range coverage: laminar through turbulent |
| TEMA tube count tables | Data Eng | Loaded for all standard shell IDs + pitch combos |
| Design iteration loop (converge on geometry) | Backend | Converges in <15 iterations for 95% of cases |
| Vibration screening (TEMA Section 6) | Backend | Correct frequency ratio and velocity checks |
| Condenser design (Silver-Bell-Ghaly) | Backend | Multi-zone condensation curve integration |
| Reboiler design (Mostinski nucleate boiling) | Backend | Kettle reboiler sizing matches examples |

### Sprint 9–10 (Weeks 17–20): Datasheets & Polish

| Task | Owner | Acceptance Criteria |
|---|---|---|
| PDF datasheet generator (TEMA format for HX) | Backend | Generates spec-compliant PDF |
| PDF generator for pipe sizing results | Backend | Pipe data table with hydraulic profile |
| PDF generator for separator datasheets | Backend | API-format vessel datasheet |
| Excel export for all modules | Backend | Structured .xlsx with formulas preserved |
| Project save/load (PostgreSQL persistence) | Full stack | Create, update, retrieve calculations |
| Unit preference system (SI/US/CGS toggle) | Full stack | All displays honor user preference |
| Results history + comparison view | Frontend | Side-by-side comparison of design alternatives |
| Integration testing | QA | End-to-end tests for all 3 modules |

**Phase 1 Deliverable:** Engineers can size pipe, separators, and heat exchangers with TEMA/API datasheets. This is the **Minimum Viable Product** for commercial launch.

**Exit Criteria:**
- [ ] All three module calculations validated against reference problems
- [ ] PDF datasheets match TEMA/API formatting standards
- [ ] <5 second response time for rigorous heat exchanger design
- [ ] Project persistence and retrieval functional
- [ ] Beta test with 5 practicing engineers — >80% satisfaction

---

## Phase 2 — Equipment Expansion & Economics (Weeks 21–32)

**Objective:** Complete the equipment sizing loop with materials, pumps, safety valves, and cost estimation.

### Sprint 11–12 (Weeks 21–24): Materials & Pumps

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Material database (50+ materials) | Data Eng | All ASME II-D allowable stress values loaded |
| de Waard-Milliams CO2 corrosion model | Backend | Matches NORSOK M-506 examples |
| NACE MR0175 sour service mapping | Backend | Correct SSC/HIC region classification |
| PREN calculator + material selection matrix | Backend | Recommends appropriate MOC for service |
| System head curve builder | Backend | Static + friction + elevation + fittings |
| NPSH available vs. required (API 610) | Backend | Correct margin per API 610 11th Ed. |
| Pump type selection algorithm | Backend | Centrifugal vs. PD per Ns and viscosity |
| Affinity laws + specific speed calculator | Backend | Impeller type recommendation from Ns |
| Pump UI (system curve overlay on pump curve) | Frontend | Interactive chart with operating point |

### Sprint 13–14 (Weeks 25–28): Safety Relief Valves

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Gas/vapor PSV sizing (API 520) | Backend | Matches API 520 worked examples |
| Liquid PSV sizing (API 520) | Backend | Correct Kd, Kw, Kv application |
| Two-phase PSV (Omega method) | Backend | API 520 Annex C implementation |
| Fire case heat input (API 521) | Backend | Wetted area + F-factor correct |
| Blocked discharge scenario builder | Backend | Auto-calculates required relief rate |
| Tube rupture scenario | Backend | HX tube failure into shell at design P |
| Inlet/outlet piping ΔP check (3%/10%) | Backend | Warns on violation |
| PSV selection (conventional, balanced, pilot) | Backend | Decision tree per backpressure |
| PSV UI + datasheet | Frontend + Backend | API 526 standard orifice selection |

### Sprint 15–16 (Weeks 29–32): Economic Evaluation

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Turton cost correlations (20 equipment types) | Backend | log10(Cp0) within ±5% of textbook |
| Pressure and material factors | Data Eng | Tables A.1–A.6 from Turton loaded |
| CEPCI index escalation | Backend | Historical index + user override |
| Six-tenths rule scaling | Backend | Correct exponent application |
| Lang factor total plant cost | Backend | Fluid/solid/mixed plant types |
| Guthrie bare module method | Backend | CBM with B1, B2 factors |
| OPEX calculator (materials, utilities, labor) | Backend | Itemized annual cost breakdown |
| Profitability analysis (NPV, IRR, payback) | Backend | Cash flow table + metrics |
| Sensitivity analysis (tornado chart) | Backend + Frontend | Multi-variable tornado rendering |
| Steam/CW/IA utility demand aggregation | Backend | Sums across all project equipment |
| Cross-module integration (size → cost) | Full stack | Equipment list auto-populates costs |
| Economics report (PDF/Excel) | Backend | Comprehensive economics summary |

**Phase 2 Deliverable:** Complete equipment sizing → material selection → safety valve → cost estimation pipeline. Engineers can take a project from sizing through economic evaluation.

**Exit Criteria:**
- [ ] CAPEX estimates within AACE Class 4 accuracy (±20-30%)
- [ ] PSV sizing matches API 520/521 worked examples
- [ ] Material selection aligns with NACE MR0175 for sour service
- [ ] Cross-module equipment list tracks all sized items + costs
- [ ] NPV/IRR calculations verified against textbook problems

---

## Phase 3 — Advanced Design Capabilities (Weeks 33–48)

**Objective:** Rigorous column design, process safety, control system specification, and plant layout.

### Sprint 17–18 (Weeks 33–36): Distillation Column

| Task | Owner | Acceptance Criteria |
|---|---|---|
| SRK EOS + Wilson activity model | Backend | Extends thermo engine coverage |
| Phase envelope tracer (Michelsen method) | Backend | Correct cricondentherm/bar detection |
| Fenske-Underwood-Gilliland shortcut | Backend | Nmin, Rmin, N vs. R within ±5% |
| MESH equation solver (Inside-Out method) | Backend | Converges for 50-stage column |
| Tray hydraulics (sieve, valve) | Backend | Flooding, weeping, entrainment checks |
| Packing hydraulics (HETP, capacity) | Backend | Random + structured packing correlations |
| Internal parameter design | Backend | Downcomer, weir, hole pattern |
| Column UI (stage profile viewer) | Frontend | T, comp, flow profiles per stage |

### Sprint 19–20 (Weeks 37–40): Process Safety

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Dow F&EI calculator | Backend | Matches Dow guide worked examples |
| CEI calculator | Backend | Chemical exposure distance correct |
| HAZOP worksheet template + guidewords | Full stack | ISA-compliant HAZOP table |
| Bow-tie diagram builder | Frontend | Interactive threat → barrier → consequence |
| LOPA worksheet | Full stack | IPL credit + target mitigated event frequency |
| Inherent safety checklist (MSDS integration) | Full stack | Minimize/Substitute/Moderate/Simplify |
| Case study library (5 major incidents) | Content | Root cause + lessons learned + references |

### Sprint 21–22 (Weeks 41–44): Advanced Process Control

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Control strategy selection matrix | Backend | Per unit operation recommendation |
| PID tuning calculator (Cohen-Coon, Lambda) | Backend | Kc, Ti, Td from process dynamics |
| Control valve Cv sizing (IEC 60534) | Backend | Matches Fisher/Emerson handbook |
| MPC scope definition builder | Full stack | MV/CV/DV matrix with constraints |
| Anti-surge logic (compressor) | Backend | Surge line + control line definition |
| Control narrative template generator | Backend | Auto-generates per loop description |

### Sprint 23–24 (Weeks 45–48): Plant Layout

| Task | Owner | Acceptance Criteria |
|---|---|---|
| API/PIP spacing tables database | Data Eng | Minimum distances for 20+ equipment pairs |
| 2D plot plan canvas (Konva.js) | Frontend | Drag-drop equipment, snap-to-grid |
| Fire zone classification | Backend | Zone 0/1/2 per IEC 60079 |
| Escape route validation | Backend | Two exits per zone, max travel distance |
| Wind rose orientation for flare/vent | Frontend | Interactive compass with prevailing wind |
| Plot plan report (PDF export) | Backend | Scaled drawing with spacing annotations |

**Phase 3 Deliverable:** Full column design (shortcut → rigorous), HAZOP templates, control strategy recommendations, and preliminary plant layout.

---

## Phase 4 — Platform Maturity (Weeks 49–60)

**Objective:** P&ID drafting, collaboration, and enterprise features.

### Sprint 25–26 (Weeks 49–52): P&ID Development

| Task | Owner | Acceptance Criteria |
|---|---|---|
| ISA-5.1 symbol library (150+ symbols) | Frontend | SVG symbols for instruments, valves, equipment |
| Tag number generator (ISA convention) | Backend | FIC-1001A, LT-2003, etc. |
| Line numbering convention | Backend | Size-service-seq-insulation format |
| Canvas-based P&ID editor | Frontend | Connect, route, annotate |
| Typical loop generation (flow, level, P, T) | Backend | Auto-generates standard instrument loops |
| Export to SVG/PDF | Backend | Scalable vector output |

### Sprint 27–28 (Weeks 53–56): Collaboration & Integration

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Multi-user real-time collaboration | Full stack | WebSocket-based concurrent editing |
| Calculation audit trail + versioning | Backend | Full input/output history per tag |
| Role-based project sharing | Backend | Viewer/Engineer/Admin per project |
| HYSYS/Aspen CSV import | Backend | Parse simulation results into ChemScale |
| Public API + developer documentation | Backend | OpenAPI 3.1 spec published |
| Webhook integrations (Slack, email) | Backend | Notify on calculation complete |

### Sprint 29–30 (Weeks 57–60): Performance & Polish

| Task | Owner | Acceptance Criteria |
|---|---|---|
| Load testing (100 concurrent users) | QA/DevOps | <5s P95 for rigorous HX design |
| Database query optimization | Backend | All queries <100ms at scale |
| CDN + asset optimization | DevOps | Lighthouse score >90 |
| Accessibility audit (WCAG 2.1 AA) | Frontend | Keyboard navigation, screen readers |
| Security audit (OWASP Top 10) | Security | No critical/high findings |
| Documentation site (user guides) | Content | Per-module user guide with examples |

**Phase 4 Deliverable:** Enterprise-ready platform with P&ID drafting, real-time collaboration, and third-party integrations.

---

## Team Structure (Recommended)

| Role | Count | Phase 0–1 | Phase 2–3 | Phase 4 |
|---|---|---|---|---|
| Backend / Thermo Engineer | 2 | Core engine + modules | Advanced modules | API + optimization |
| Frontend Engineer | 2 | UI framework + calc UIs | Diagrams + canvas | P&ID editor + collab |
| Data Engineer | 1 | Component DB + correlations | Cost DB + materials | Integrations |
| DevOps / Platform | 1 | CI/CD + infrastructure | Scaling + monitoring | Security + performance |
| QA Engineer | 1 | Test framework + validation | Module testing | Load + security testing |
| Product / Domain Expert | 1 | Requirements + validation | Standards review | User testing |

**Total:** 8 engineers

---

## Key Milestones

| Date | Milestone |
|---|---|
| Q1 2026 W8 | Thermodynamic Engine validated (Phase 0 complete) |
| Q2 2026 W20 | MVP launch: Pipe + Separator + Heat Exchanger (Phase 1) |
| Q3 2026 W32 | Full sizing + economics loop (Phase 2) |
| Q4 2026 W48 | Advanced design: column + safety + APC (Phase 3) |
| Q1 2027 W60 | Enterprise platform: P&ID + collaboration (Phase 4) |

---

*This roadmap is a living document. Sprint boundaries and task assignments will be refined during sprint planning ceremonies. Phase gates require all exit criteria to be met before proceeding.*
