# ChemScale — Chemical Engineering Design & Sizing Platform

## Master Architecture Document

**Version:** 1.1.0
**Author:** Lead Architect / Senior Chemical Process Engineer
**Date:** 2026-02-26
**Status:** Architecture Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack & High-Level Architecture](#2-tech-stack--high-level-architecture)
3. [The Calculation Pipeline](#3-the-calculation-pipeline)
4. [Core System Foundations](#4-core-system-foundations)
5. [Functional Engineering Modules](#5-functional-engineering-modules)
6. [Phased Development Roadmap](#6-phased-development-roadmap)
7. [Proof of Concept Deep Dives](#7-proof-of-concept-deep-dives)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Risk Register](#9-risk-register)

---

## 1. Executive Summary

ChemScale is an end-to-end Chemical Engineering Design and Sizing SaaS platform that enables process engineers to design, specify, rate, and economically evaluate process equipment. It integrates a rigorous thermodynamic engine, 12 engineering modules, and industry-standard compliance (ASME, API, PIP, ISA, TEMA) into a single coherent platform.

**Key differentiators:**
- Rigorous thermodynamic backbone (Peng-Robinson, SRK, NRTL, UNIQUAC) powering all modules
- Standards-first design — calculations trace back to specific code clauses
- Datasheet-ready outputs with audit trails
- Modular monolith architecture with clear service boundaries, extractable to microservices as scaling demands

---

## 2. Tech Stack & High-Level Architecture

### 2.1 Language & Framework Decisions

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + TypeScript | Component-driven UI, strong typing for engineering data |
| **UI Framework** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| **Charting** | Plotly.js (via react-plotly.js) | Engineering-grade plots (log scales, phase envelopes, system curves) |
| **CAD/Layout** | Konva.js (react-konva) | 2D canvas for P&ID drafting and plot plan layout |
| **API Gateway** | Kong / AWS API Gateway | Rate limiting, auth, request routing |
| **Backend API** | Python 3.12 + FastAPI | Async-first, automatic OpenAPI docs, Pydantic validation |
| **Compute Engine** | Python (NumPy, SciPy) | IEEE 754 numerics, robust ODE/NLE solvers |
| **Thermo Validation** | CoolProp (test-only dependency) | NIST-grade reference data for automated regression testing |
| **Task Queue** | Celery + Redis | Offload long-running calculations (distillation, rating) |
| **Primary DB** | PostgreSQL 16 | ACID compliance for engineering data, JSONB for flexible specs |
| **Cache** | Redis 7 | Session state, intermediate calculation caching |
| **Document Store** | MongoDB (optional) | HAZOP templates, case study archives, unstructured reports |
| **Search** | Meilisearch | Component database full-text search (chemical names, CAS numbers) |
| **Auth** | Keycloak / Auth0 | OAuth2/OIDC, role-based access (Viewer/Engineer/Admin) |
| **Cloud** | AWS (primary) | ECS Fargate for containers, RDS for PostgreSQL, S3 for datasheets |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy pipeline |
| **Containerization** | Docker + Docker Compose | Local dev parity with production |
| **Monitoring** | Prometheus + Grafana | Calculation latency, error rates, queue depth |

> **Note on CoolProp:** CoolProp is used exclusively in the test suite as a source of NIST-validated reference data for regression testing. All production thermodynamic calculations use ChemScale's own PR/SRK/NRTL/UNIQUAC implementations — CoolProp is not a runtime dependency.

### 2.2 High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          CHEMSCALE PLATFORM                                  │
│                                                                              │
│  ┌─────────────┐     ┌──────────────────────────────────────────────┐       │
│  │  React +    │     │              API GATEWAY                     │       │
│  │  TypeScript │────▶│  (Auth · Rate Limit · Route · OpenAPI)      │       │
│  │  Frontend   │◀────│                                              │       │
│  │             │◀·ws·│  (WebSocket for long-running calc progress)  │       │
│  └─────────────┘     └──────┬──────────────────┬───────────────────┘       │
│                             │                  │                            │
│           ┌─── SYNCHRONOUS ─┘                  └── ASYNC (Celery) ──┐      │
│           │  (< 5s calcs)                      (> 5s calcs)         │      │
│           │                                                         │      │
│    ┌──────▼───────┐  ┌──────────────┐                   ┌──────────▼──┐   │
│    │  Property    │  │  Module      │                   │  Celery     │   │
│    │  Service     │  │  Services    │                   │  Workers    │   │
│    │  (Thermo)    │  │  (Pipe,Sep,  │                   │  (Distill,  │   │
│    │              │  │   HX,Pump,   │                   │   Rating,   │   │
│    │  SYNC ONLY:  │  │   PSV,Econ)  │                   │   Reports)  │   │
│    │  No queue    │  │              │                   │             │   │
│    └──────┬───────┘  └──────┬───────┘                   └──────┬──────┘   │
│           │                 │                                   │          │
│    ┌──────▼─────────────────▼───────────────────────────────────▼──────┐   │
│    │                        DATA LAYER                                 │   │
│    │  ┌──────────────┐  ┌───────────┐  ┌──────────────────────────┐   │   │
│    │  │  PostgreSQL  │  │   Redis   │  │  S3 (PDFs, Excel, logs)  │   │   │
│    │  │  (Components,│  │  (Cache,  │  │                          │   │   │
│    │  │   Projects,  │  │  Sessions,│  │                          │   │   │
│    │  │   Results)   │  │  Queue)   │  │                          │   │   │
│    │  └──────────────┘  └───────────┘  └──────────────────────────┘   │   │
│    └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

> **Synchronous vs. Asynchronous:** Property lookups (< 100 ms) and quick estimates (< 1 s) are always synchronous HTTP request/response — they do NOT route through the message queue. Rigorous calculations exceeding ~5 seconds (distillation MESH, full HX rating sweeps, PDF generation) are dispatched to Celery workers. The client receives a `calc_id` immediately and either polls `GET /results/{calc_id}` or subscribes via WebSocket for real-time progress updates.

### 2.3 Service Decomposition

The backend is organized as a **modular monolith** deployed as independently scalable services:

| Service | Responsibility | Scaling Profile |
|---|---|---|
| `chemscale-api` | FastAPI gateway, auth, project CRUD | Horizontal (stateless) |
| `chemscale-thermo` | Thermodynamic property calculations | CPU-intensive, vertical + horizontal |
| `chemscale-modules` | Engineering calculation endpoints | Per-module horizontal scaling |
| `chemscale-worker` | Celery workers for long calculations | Auto-scale on queue depth |
| `chemscale-reports` | PDF/Excel datasheet generation | I/O bound, horizontal |

> **Why modular monolith initially, not full microservices?** For a team of 4-8 engineers, a monorepo with clear module boundaries gives us the isolation benefits without the operational overhead of 15+ independent services. Each module lives in its own Python package (`chemscale.modules.heat_exchanger`, etc.) and can be extracted to a standalone service when scaling demands it.

---

## 3. The Calculation Pipeline

Every engineering calculation in ChemScale follows a deterministic pipeline:

```
USER INPUT          VALIDATION           PROPERTY ENGINE        MODULE SOLVER
───────────         ──────────           ───────────────        ─────────────
│ Process         │ Pydantic          │ Flash calcs          │ Design eqns
│ conditions      │ schema            │ Transport props      │ Iterative
│ (T, P, comp,   │ validation        │ Phase envelope       │ convergence
│  geometry)      │ + unit            │ Mixture rules        │ + standards
│                 │ normalization     │                      │ compliance
▼                 ▼                   ▼                      ▼

┌─────────┐   ┌──────────┐   ┌───────────────┐   ┌──────────────┐
│  JSON   │──▶│ Validated │──▶│  Physical     │──▶│   Sized      │
│  Input  │   │  + SI     │   │  Properties   │   │   Equipment  │
│         │   │  Units    │   │  (ρ,μ,Cp,k,  │   │   Parameters │
│         │   │           │   │   σ, Hvap...) │   │              │
└─────────┘   └──────────┘   └───────────────┘   └──────┬───────┘
                                                         │
                              ┌───────────────┐          │
                              │  DATASHEET    │◀─────────┘
                              │  (PDF/Excel)  │
                              │  + Audit Log  │
                              │  + Standards  │
                              │    Refs       │
                              └───────────────┘
```

### 3.1 Pipeline Steps in Detail

**Step 1 — User Input (JSON)**
The frontend collects process conditions, fluid compositions, geometry constraints, and design preferences. All inputs are structured as typed JSON payloads validated against Pydantic models.

**Step 2 — Validation & Unit Normalization**
Every input passes through:
- Range validation (e.g., temperature ≥ 50 K and ≤ 2000 K, pressure > 0 Pa and ≤ 1000 bar — tighter bounds per module)
- Unit conversion to SI internally (the user sees their preferred units; the engine always computes in SI)
- Composition normalization (mole/mass fractions sum to 1.0 within tolerance of 1e-6; rejected otherwise)
- Cross-field validation (e.g., T_hot_in > T_hot_out for a cooler, T_cold_out > T_cold_in for a heater)

**Step 3 — Thermodynamic Property Engine**
The property engine resolves all physical properties required by the downstream module:
- Phase determination via flash calculations (PT flash, PH flash, TV flash)
- Pure component properties from the Component Database (DIPPR-style correlations)
- Mixture properties via the selected thermodynamic model (EOS or Activity Coefficient)
- Transport properties: viscosity (μ), thermal conductivity (k), surface tension (σ)
- Derived properties: compressibility (Z), Joule-Thomson coefficient, sonic velocity

**Step 4 — Module Solver**
Each module receives validated inputs + resolved properties and executes its domain logic:
- Iterative design calculations (e.g., LMTD correction, Kern/Bell-Delaware method)
- Standards compliance checks (ASME pressure rating, TEMA class selection)
- Convergence tracking with defined tolerances (typically 0.1% on energy balance)

**Step 5 — Output & Datasheet**
Results are persisted to PostgreSQL and rendered as:
- JSON API response (for programmatic consumption)
- PDF datasheet (TEMA-standard format for heat exchangers, API format for vessels)
- Excel export (for further manipulation by the engineer)
- Audit log entry (inputs, model version, standards revision, calculation trace)

---

## 4. Core System Foundations

### 4.1 Thermodynamic & Physical Property Engine

See [THERMO_ENGINE_SPEC.md](./THERMO_ENGINE_SPEC.md) for the full specification.

**Architecture:**

```
chemscale/
└── thermo/
    ├── __init__.py
    ├── eos/
    │   ├── base.py              # Abstract EOS interface
    │   ├── peng_robinson.py     # PR EOS (generalized + Twu alpha)
    │   ├── srk.py               # Soave-Redlich-Kwong
    │   └── mixing_rules.py      # van der Waals, Wong-Sandler
    ├── activity/
    │   ├── base.py              # Abstract activity coefficient interface
    │   ├── nrtl.py              # Non-Random Two-Liquid
    │   ├── uniquac.py           # Universal Quasi-Chemical
    │   └── wilson.py            # Wilson model
    ├── flash/
    │   ├── pt_flash.py          # Isothermal flash (Rachford-Rice)
    │   ├── ph_flash.py          # Isenthalpic flash
    │   ├── bubble_dew.py        # Bubble/dew point calculations
    │   └── phase_envelope.py    # Full phase envelope tracer
    ├── properties/
    │   ├── pure.py              # DIPPR correlations for pure components
    │   ├── mixture.py           # Mixing rules for transport properties
    │   ├── transport.py         # Viscosity, thermal conductivity, diffusivity
    │   └── surface_tension.py   # Parachor method, Macleod-Sugden
    ├── database/
    │   ├── component_db.py      # Component lookup and retrieval
    │   └── binary_params.py     # Binary interaction parameters (kij, NRTL τ, UNIQUAC q/r)
    └── units/
        ├── converter.py         # SI ↔ user-unit conversions
        └── registry.py          # Unit definitions and aliases
```

**Supported Equations of State:**

| Model | Ideal For | Limitations |
|---|---|---|
| **Peng-Robinson (PR)** | Hydrocarbons, gas processing, high-pressure systems | Poor for highly polar/associating compounds |
| **SRK** | Refinery applications, legacy compatibility | Liquid density less accurate than PR |
| **PR + Twu alpha** | Improved accuracy for heavy hydrocarbons | Requires Twu parameters |

**Supported Activity Coefficient Models:**

| Model | Ideal For | Parameters |
|---|---|---|
| **NRTL** | Strongly non-ideal liquid mixtures, LLE | τ12, τ21, α12 (per binary pair) |
| **UNIQUAC** | Mixtures with size/shape differences | r, q (pure), τ (binary) |
| **Wilson** | VLE only, strongly non-ideal | Λ12, Λ21 (per binary pair) |

**Model Selection Logic:**

> **Important:** Model auto-selection is a convenience heuristic, not a substitute for engineering judgment. The user can always override the recommended model. The algorithm below encodes well-known guidelines (e.g., Carlson 1996, Aspen Tech model selection guide) but cannot cover all edge cases.

```python
def select_thermo_model(components, T, P, application):
    """
    Auto-recommend a thermodynamic model.

    Returns a recommendation with confidence level. The user
    may override this selection at any time.
    """
    has_polar = any(c.dipole_moment > 1.0e-30 for c in components)  # > 1 Debye
    has_associating = any(c.is_hydrogen_bonding for c in components)  # alcohols, acids, water, amines
    has_electrolyte = any(c.is_electrolyte for c in components)
    is_high_pressure = P > 10e5  # > 10 bar
    is_vacuum = P < 0.1e5  # < 0.1 bar
    has_lle = application in ["extraction", "decanter", "lle_check"]
    all_hydrocarbons = all(c.family in ["alkane", "naphthene", "aromatic", "olefin"] for c in components)
    has_supercritical = any(T > c.tc_k or P > c.pc_pa for c in components)

    if has_electrolyte:
        return Recommendation("ELECTROLYTE_NRTL", confidence="high",
            reason="Electrolyte system — e-NRTL handles ionic species")

    if has_associating:
        if is_high_pressure:
            return Recommendation("SRK_WITH_WONG_SANDLER", confidence="medium",
                reason="Associating compounds at high pressure — hybrid EOS/activity model")
        elif has_lle:
            return Recommendation("NRTL", confidence="high",
                reason="Associating + LLE — NRTL handles both VLE and LLE")
        else:
            return Recommendation("NRTL", confidence="high",
                reason="Associating compounds (H-bonding) — activity coefficient model required")

    if has_polar and not all_hydrocarbons:
        if is_high_pressure:
            return Recommendation("SRK_WITH_WONG_SANDLER", confidence="medium",
                reason="Polar non-hydrocarbons at high pressure")
        elif has_lle:
            return Recommendation("NRTL", confidence="high",
                reason="Polar mixture with LLE potential")
        else:
            return Recommendation("NRTL", confidence="medium",
                reason="Polar mixture — NRTL preferred; UNIQUAC if size differences are large")

    if all_hydrocarbons or (not has_polar and is_high_pressure):
        return Recommendation("PENG_ROBINSON", confidence="high",
            reason="Hydrocarbon/non-polar system — cubic EOS is standard")

    if is_vacuum and not has_polar:
        return Recommendation("PENG_ROBINSON", confidence="medium",
            reason="Vacuum system with non-polar components")

    # Default fallback
    return Recommendation("PENG_ROBINSON", confidence="low",
        reason="Default selection — review recommended for this system")
```

### 4.2 Component Database

**Schema Overview (PostgreSQL):**

See [COMPONENT_DB_SCHEMA.sql](../schemas/COMPONENT_DB_SCHEMA.sql) for the full DDL.

The database stores:
- **Pure component constants:** Tc, Pc, ω, molecular weight, CAS number, structure (SMILES)
- **Temperature-dependent correlations:** DIPPR equation coefficients for Cp_ig, Pvap, ρ_liq, μ_liq, μ_vap, k_liq, k_vap, σ, ΔHvap
- **Binary interaction parameters:** kij (EOS), NRTL τ/α, UNIQUAC τ, Wilson Λ — indexed by component pair + model + temperature range
- **Material compatibility matrix:** Chemical resistance ratings per material of construction

**Initial Scope:** ~500 components covering:
- Light gases (H2, N2, O2, CO, CO2, H2S)
- C1-C30 hydrocarbons (paraffins, naphthenes, aromatics)
- Common solvents (methanol, ethanol, acetone, MEA, DEA, MDEA)
- Water and steam
- Common acids and bases
- Refrigerants (R-134a, R-410A, ammonia)

**Data Sourcing Strategy:**
- Pure component constants and DIPPR correlations: sourced from NIST TDE (open) and DIPPR 801 (licensed) databases
- Binary interaction parameters: curated from DECHEMA VLE Data Series and published literature
- Data validation: every loaded component passes automated checks against CoolProp reference values
- Data licensing: DIPPR 801 requires institutional license; budget and procurement plan required in Phase 0

---

## 5. Functional Engineering Modules

### Module 1 — Pipe Sizing & Hydraulics

**Standards:** ASME B31.3 (Process Piping), API RP 14E (Erosional Velocity)

**Capabilities:**
- Single-phase liquid: Darcy-Weisbach with Colebrook-White (iterative) or Churchill correlation
- Single-phase gas: Isothermal/adiabatic compressible flow, Weymouth, Panhandle equations
- Two-phase: Lockhart-Martinelli, Beggs-Brill, Dukler correlations
- Erosional velocity check per API RP 14E: `V_e = C / sqrt(ρ_mix)`
- Pipe schedule selection (Sch 10 through Sch XXS)
- Fitting K-factors (Crane TP-410 method) and equivalent length
- Full pressure profile along a piping run (elevation + friction + fittings)

---

### Module 2 — Material Selection & Metallurgy

**Standards:** NACE MR0175/ISO 15156, ASME II Part D

**Capabilities:**
- Material database: Carbon steel (A106/A53), stainless steels (304/304L, 316/316L, 321, 347), duplex (2205, 2507), nickel alloys (Inconel 625, Incoloy 825, Hastelloy C-276), titanium, Monel
- Corrosion rate calculators:
  - Generalized: de Waard-Milliams (CO2 sweet corrosion)
  - Sour service: NACE MR0175 region mapping (SSC, HIC, SOHIC)
  - Localized: Pitting resistance equivalent number (PREN)
- Mechanical property lookup: yield strength, tensile strength, allowable stress at temperature
- Corrosion allowance recommendations
- Material selection matrix (process fluid → recommended MOC)

---

### Module 3 — Plant Layout & Location

**Standards:** API 2510, NFPA 30, PIP PLC00001

**Capabilities:**
- Equipment spacing tables (API/PIP minimum distances)
- Plot plan canvas (2D interactive layout via Konva.js)
- Fire zone classification
- Escape route validation
- Prevailing wind orientation for flare/vent placement
- Area classification (NEC/IEC zone mapping for hazardous areas)

---

### Module 4 — Phase Separator Sizing

**Standards:** API 12J, GPSA Engineering Data Book (Section 7)

**Capabilities:**
- 2-phase (gas-liquid) separators: vertical and horizontal
- 3-phase (gas-oil-water) separators: horizontal with weir/bucket configurations
- Droplet settling: Stokes' law with drag coefficient correction (iterative)
- Souders-Brown velocity: `V_t = K * sqrt((ρ_L - ρ_V) / ρ_V)`
- Retention time sizing (liquid holdup)
- Internals selection: wire mesh demister, vane pack, cyclonic
- Slug catcher preliminary sizing
- Level instrument nozzle placement (HHLL, HLL, NLL, LLL, LLLL)

---

### Module 5 — Pump Selection & Sizing

**Standards:** API 610 (Centrifugal), API 674/675/676 (Positive Displacement), HI Standards

**Capabilities:**
- System head curve: `H_system = ΔZ + ΔP_static/(ρg) + Σ(h_f) + Σ(h_m)`
- NPSH available vs. required (with margin per API 610)
- Pump type selection algorithm (centrifugal vs. reciprocating vs. rotary)
- Affinity laws for speed/impeller diameter changes
- Specific speed (Ns) calculation and impeller type recommendation
- Power consumption: `P = Q × H × ρ × g / (η_pump × η_motor)`
- Multi-pump parallel/series configuration analysis

---

### Module 6 — Heat Exchanger Design

**Standards:** TEMA (9th/10th Ed.), ASME Sec VIII Div 1, API 660 (S&T), API 661 (Air Coolers)

See [HEAT_EXCHANGER_API_SPEC.md](../api-specs/HEAT_EXCHANGER_API_SPEC.md) for the full API specification.

**Capabilities:**
- **Conceptual estimation:** Q = U × A × LMTD × Ft — quick area estimation with U-value lookup
- **Rigorous shell & tube rating:** Bell-Delaware method (Taborek)
  - Shell-side: ideal crossflow + correction factors (Jc, Jl, Jb, Js, Jr)
  - Tube-side: Sieder-Tate or Gnielinski correlation
  - Pressure drop: window, crossflow, end zones
- **TEMA type selection:** AES, BEM, AEP, AKT, etc.
- **Condenser design:** Desuperheating, condensing, subcooling zones with Silver-Bell-Ghaly method
- **Reboiler design:** Kettle (nucleate boiling — Mostinski), thermosiphon (two-phase circulation)
- **Air-cooled exchangers (API 661):** Bay configuration, fan selection, approach temperature
- **Vibration check:** Tubular Exchanger Manufacturers Association flow-induced vibration screening
- **Mechanical design:** Tube-sheet thickness (ASME), shell thickness, nozzle sizing

---

### Module 7 — Rigorous Distillation Column Design

**Standards:** FRI correlations, Stichlmair packing correlations, Koch-Glitsch/Sulzer guidelines

**Capabilities:**
- **Shortcut methods:** Fenske (Nmin), Underwood (Rmin), Gilliland (N vs. R)
- **Rigorous simulation:** MESH equations (Material balance, Equilibrium, Summation, Heat balance) — stage-by-stage using the Naphtali-Sandholm or Inside-Out method
- **Tray hydraulics:** Sieve, valve, bubble cap — weeping, flooding, entrainment checks
- **Packing hydraulics:** Random (Pall, IMTP) and structured (Mellapak) — HETP, pressure drop, capacity (Wallis plot)
- **Internal parameter design:** Downcomer area, weir height, tray spacing, hole diameter/pitch
- **Column internals selection matrix:** Tray vs. packing decision tree based on service

---

### Module 8 — Safety Relief Valves (PSV/PRV)

**Standards:** API 520 Part I (Sizing), API 520 Part II (Installation), API 521 (Guide), ASME Sec VIII

**Capabilities:**
- **Overpressure scenarios:**
  - Fire case (API 521 §5.15): wetted area calculation, heat input, required relief rate
  - Blocked discharge
  - Tube rupture (exchanger tube failure into low-pressure shell)
  - Control valve failure (wide open)
  - Thermal expansion (liquid-filled equipment)
  - Power failure / cooling water failure
- **Sizing equations:**
  - Gas/vapor: `A = W × sqrt(T×Z) / (C × K_d × P_1 × K_b × K_c × sqrt(M))`
  - Liquid: `A = Q / (K_d × K_w × K_c × K_v × sqrt(2 × ΔP × ρ))`
  - Two-phase: Omega method (API 520 Annex C)
- **Valve selection:** Conventional, balanced bellows, pilot-operated
- **Inlet/outlet piping pressure drop check** (3% / 10% rule)

---

### Module 9 — Process Safety & Industrial Hygiene

**Standards:** IEC 61511 (SIS), API 752, OSHA PSM (29 CFR 1910.119)

**Capabilities:**
- Inherent safety design checklist (Minimize, Substitute, Moderate, Simplify)
- Dow Fire & Explosion Index (F&EI) calculator
- Chemical Exposure Index (CEI) calculator
- HAZOP worksheet template with guidewords (No, More, Less, Reverse, As Well As, Part Of, Other Than)
- Bow-tie diagram builder (threats → barriers → top event → barriers → consequences)
- Case study library: Bhopal (MIC release), Texas City (ISOM unit), Deepwater Horizon (blowout), Flixborough (cyclohexane), Piper Alpha (gas leak)
- Layer of Protection Analysis (LOPA) worksheet

---

### Module 10 — Advanced Process Control (APC)

**Standards:** ISA-5.1 (Instrumentation Symbols), ISA-88 (Batch), ISA-95 (MES Integration)

**Capabilities:**
- Control strategy selection matrix by unit operation:
  - Distillation: LV, DV, L/D-V/B, MPC
  - Heat exchangers: Cascade (TT→FC), feedforward on disturbance
  - Reactors: Split-range, cascade (TT→coolant FC), ratio control
  - Compressors: Anti-surge control logic
- PID tuning recommendations: Cohen-Coon, Ziegler-Nichols, Lambda tuning
- Model Predictive Control (MPC) scope definition: MVs, CVs, DVs, constraint matrix
- Control valve sizing (ISA/IEC 60534): Cv calculation, trim selection, noise prediction

---

### Module 11 — P&ID Development

**Standards:** ISA-5.1 (2022), PIP PIC001

**Capabilities:**
- ISA-standard symbol library (150+ symbols): instruments, valves, equipment, piping
- Tag number generator per ISA convention (e.g., FIC-1001A, LT-2003)
- Line numbering convention (size-service-sequence-insulation)
- Automated generation of typical instrument loops (flow, level, pressure, temperature)
- Equipment numbering per PIP convention
- Canvas-based P&ID drafting with snap-to-grid and connection validation
- Export to SVG/PDF

---

### Module 12 — Economic Evaluation & Industrial Utilities

See [ECONOMIC_EVAL_API_SPEC.md](../api-specs/ECONOMIC_EVAL_API_SPEC.md) for the full API specification.

**Capabilities:**
- **Utilities demand:**
  - Steam: Demand from all heat exchangers, reboilers, tracing — categorized by pressure level (LP/MP/HP)
  - Cooling water: Demand from condensers, coolers — ΔT and flow rate
  - Instrument air: Demand from control valves, actuators — per ISA valve count
  - Electrical: Motor loads from pumps, compressors, air coolers
- **CAPEX estimation:**
  - Base cost from correlations: `C_base = a × S^b` (Turton, Seider, Couper references)
  - Cost index scaling: `C_current = C_base × (CEPCI_current / CEPCI_base)`
  - Material factor, pressure factor, installation factor
  - Lang factor total plant cost: `C_total = f_Lang × Σ(C_equipment)`
  - Bare module cost via Guthrie method
- **OPEX estimation:**
  - Raw materials (flow × unit cost × hours/year)
  - Utilities (steam, CW, electricity × unit rates)
  - Labor (operating + maintenance, from staffing guidelines)
  - Maintenance (% of ISBL capital)
  - Depreciation (straight-line, declining balance)
- **Profitability analysis:**
  - Net Present Value (NPV)
  - Internal Rate of Return (IRR)
  - Payback period
  - Sensitivity analysis (tornado chart: ±20% on key variables)

---

## 6. Phased Development Roadmap

See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for the detailed sprint-level breakdown.

### Phase 0 — Foundation (Weeks 1–12)

**Goal:** Establish the platform skeleton, thermodynamic engine, and component database.

```
┌─────────────────────────────────────────────────┐
│  PHASE 0: FOUNDATION                            │
│                                                  │
│  ☐ Project scaffolding (monorepo, CI/CD)        │
│  ☐ PostgreSQL schema + migrations (Alembic)     │
│  ☐ Component Database (500 compounds)           │
│  ☐ Unit conversion engine                       │
│  ☐ Peng-Robinson EOS                            │
│  ☐ NRTL activity coefficient model              │
│  ☐ PT Flash (Rachford-Rice)                     │
│  ☐ Bubble/Dew point calculations                │
│  ☐ Transport property correlations              │
│  ☐ FastAPI skeleton + auth                      │
│  ☐ React shell + component search UI            │
│  ☐ Automated test suite (>90% coverage)         │
│                                                  │
│  Deliverable: Standalone property calculator     │
│  that returns phase + properties for any mixture │
│  at given T, P, composition.                     │
└─────────────────────────────────────────────────┘
```

**Why this first?** Every downstream module depends on the property engine. Shipping this standalone lets us validate thermodynamic accuracy against NIST/DIPPR reference data before building on top.

> **Timeline note:** 12 weeks (expanded from original 8) to account for data sourcing/licensing, DIPPR correlation validation across 500 compounds, and infrastructure maturity. The thermo engine is the single hardest component and must not be rushed.

---

### Phase 1 — MVP Core Modules (Weeks 13–24)

**Goal:** Deliver the three most-used engineering sizing tools.

```
┌─────────────────────────────────────────────────┐
│  PHASE 1: MVP (3 Modules)                       │
│                                                  │
│  ☐ Module 1:  Pipe Sizing & Hydraulics          │
│  ☐ Module 4:  Phase Separator Sizing            │
│  ☐ Module 6:  Heat Exchanger Design             │
│                                                  │
│  Also included:                                  │
│  ☐ PDF datasheet generation framework           │
│  ☐ Project save/load (PostgreSQL)               │
│  ☐ Unit preferences (SI, US Customary, CGS)     │
│                                                  │
│  Deliverable: Engineers can size pipe, vessels,  │
│  and heat exchangers with standards-compliant    │
│  datasheets.                                     │
└─────────────────────────────────────────────────┘
```

**Why these three?** Pipe sizing, separator design, and heat exchanger calculations represent ~60% of daily process engineering work. Delivering these first provides maximum user value and validates the full pipeline from input → thermo → solver → datasheet.

---

### Phase 2 — Equipment Expansion (Weeks 25–36)

**Goal:** Add rotating equipment, safety devices, and economic analysis.

```
┌─────────────────────────────────────────────────┐
│  PHASE 2: EQUIPMENT + ECONOMICS (4 Modules)     │
│                                                  │
│  ☐ Module 2:  Material Selection & Metallurgy   │
│  ☐ Module 5:  Pump Selection & Sizing           │
│  ☐ Module 8:  Safety Relief Valves (PSV/PRV)    │
│  ☐ Module 12: Economic Evaluation & Utilities   │
│                                                  │
│  Also included:                                  │
│  ☐ Cross-module integration (pipe → pump → HX)  │
│  ☐ Project-level equipment list                  │
│  ☐ Cost estimation linked to sized equipment    │
│                                                  │
│  Deliverable: Full equipment sizing loop with   │
│  material selection, safety valves, and CAPEX   │
│  estimation for each piece of equipment.        │
└─────────────────────────────────────────────────┘
```

---

### Phase 3 — Advanced Design (Weeks 37–52)

**Goal:** Rigorous simulation, process safety, and control system design.

```
┌─────────────────────────────────────────────────┐
│  PHASE 3: ADVANCED CAPABILITIES (4 Modules)     │
│                                                  │
│  ☐ Module 7:  Rigorous Distillation Column      │
│  ☐ Module 9:  Process Safety & Ind. Hygiene     │
│  ☐ Module 10: Advanced Process Control (APC)    │
│  ☐ Module 3:  Plant Layout & Location           │
│                                                  │
│  Also included:                                  │
│  ☐ SRK EOS + Wilson activity model              │
│  ☐ Phase envelope tracer                         │
│  ☐ MPC scope builder                             │
│                                                  │
│  Deliverable: Full column design from shortcut  │
│  to rigorous MESH, HAZOP/LOPA templates, and    │
│  control strategy recommendations.              │
└─────────────────────────────────────────────────┘
```

---

### Phase 4 — Platform Maturity (Weeks 53–68)

**Goal:** P&ID drafting, collaboration, and ecosystem.

```
┌─────────────────────────────────────────────────┐
│  PHASE 4: PLATFORM MATURITY (1 Module + Polish) │
│                                                  │
│  ☐ Module 11: P&ID Development (Canvas-based)   │
│  ☐ Multi-user collaboration (real-time)          │
│  ☐ Calculation audit trail & version history     │
│  ☐ API for third-party integrations              │
│  ☐ HYSYS/Aspen import (simulation results)       │
│  ☐ Performance optimization & load testing       │
│                                                  │
│  Deliverable: Full-featured platform with P&ID  │
│  drafting and enterprise-ready collaboration.    │
└─────────────────────────────────────────────────┘
```

---

## 7. Proof of Concept Deep Dives

Detailed API specifications for the two proof-of-concept modules are maintained in separate documents:

- **Module 6 (Heat Exchanger Design):** [HEAT_EXCHANGER_API_SPEC.md](../api-specs/HEAT_EXCHANGER_API_SPEC.md)
- **Module 12 (Economic Evaluation):** [ECONOMIC_EVAL_API_SPEC.md](../api-specs/ECONOMIC_EVAL_API_SPEC.md)

Each spec includes: JSON input schemas, API endpoints, expected outputs, and sample request/response pairs.

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Target |
|---|---|
| Simple property lookup | < 100 ms |
| PT Flash (5-component) | < 500 ms |
| Pipe sizing calculation | < 1 s |
| Heat exchanger rating | < 5 s |
| Rigorous distillation (50 stages) | < 30 s (async via Celery) |
| PDF datasheet generation | < 3 s |

### 8.2 Accuracy

- Thermodynamic properties: ±1% vs. NIST reference data for pure components
- Mixture VLE: ±5% on K-values vs. published experimental data
- Equipment sizing: Results must match hand calculations within ±2%
- Every calculation carries a `confidence` field and `warnings` array

### 8.3 API Contracts

**Versioning Strategy:** URL-path versioning (`/api/v1/`, `/api/v2/`). When a breaking change is required:
1. New version is deployed alongside old version for a minimum 6-month deprecation window
2. `Sunset` HTTP header is added to old version responses with the deprecation date
3. Non-breaking additions (new optional fields, new endpoints) do NOT require a version bump
4. Breaking changes: removing a field, changing a field type, changing validation rules, removing an endpoint

**Standard Error Response Schema (all endpoints):**

```json
{
  "status": "error",
  "error": {
    "code": "CONVERGENCE_FAILURE",
    "message": "PT Flash did not converge after 100 iterations for the given T, P, composition.",
    "details": {
      "module": "thermo",
      "endpoint": "/flash/pt",
      "iterations_attempted": 100,
      "last_tolerance": 2.3e-4,
      "target_tolerance": 1e-10
    },
    "suggestions": [
      "Check if the specified T and P are near the mixture critical point",
      "Try a different thermodynamic model",
      "Verify composition sums to 1.0"
    ]
  },
  "timestamp": "2026-02-26T14:30:00Z",
  "request_id": "uuid-string"
}
```

**HTTP Status Code Usage:**

| Code | Meaning | Example |
|---|---|---|
| 200 | Calculation succeeded | Sizing complete |
| 202 | Accepted (async) | Long calculation queued, poll `calc_id` |
| 400 | Invalid input | Missing required field, composition doesn't sum to 1.0 |
| 404 | Not found | Component CAS not in database, calc_id doesn't exist |
| 422 | Validation failed | Temperature out of correlation range, pressure below triple point |
| 500 | Internal error | Unexpected solver failure |
| 503 | Service unavailable | Worker queue full, try again later |

### 8.4 Security

- All API endpoints behind OAuth2/OIDC
- Role-based access: Viewer (read), Engineer (read/write/calculate), Admin (full)
- Calculation inputs/outputs encrypted at rest (AES-256)
- SOC 2 Type II compliance target for SaaS deployment
- No proprietary formulas exposed to the client — all computation server-side

### 8.5 Reliability

- 99.9% uptime SLA for SaaS tier
- Database backups: daily automated, 30-day retention
- Disaster recovery: cross-region replication (RTO < 1 hour)

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Thermodynamic model inaccuracy | Medium | High | Validate against NIST/DIPPR for 50+ reference systems; automated regression tests using CoolProp |
| Scope creep across 12 modules | High | High | Strict phased delivery; each module has a defined "done" boundary |
| Performance degradation with complex mixtures | Medium | Medium | Celery workers for heavy calculations; caching of repeated property lookups |
| Binary interaction parameter gaps | High | Medium | Predictive methods (UNIFAC) as fallback; user can supply custom kij |
| Standards revision (ASME/API updates) | Low | Medium | Standards version tracked per calculation; abstraction layer for code clauses |
| Single-point-of-failure on thermo engine | Low | High | Stateless design; horizontal scaling; circuit breaker pattern |
| DIPPR data licensing delays | Medium | High | Begin licensing process in Week 1; use NIST open data as fallback for initial dev |
| Phase 0 timeline overrun (thermo engine complexity) | High | High | 12-week Phase 0 (expanded from 8); PR EOS first, defer SRK/Wilson to Phase 3 |

---

*This document is the living reference for ChemScale's architecture. All module specifications, API contracts, and schema definitions branch from this master document.*
