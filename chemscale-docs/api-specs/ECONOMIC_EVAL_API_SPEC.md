# Module 12 — Economic Evaluation & Industrial Utilities: API Specification

**Version:** 1.1.0
**Standards:** AACE International, Turton et al. (6th Ed.), Peters & Timmerhaus, CEPCI
**Status:** Proof of Concept Specification

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [API Endpoints](#2-api-endpoints)
3. [JSON Input Schemas](#3-json-input-schemas)
4. [Calculation Methods](#4-calculation-methods)
5. [JSON Output Schemas](#5-json-output-schemas)
6. [Sample Request/Response](#6-sample-requestresponse)

---

## 1. Module Overview

Module 12 integrates economic analysis across the entire ChemScale platform. It consumes outputs from all other sizing modules (Modules 1–11) to produce CAPEX/OPEX estimates and profitability metrics.

### Sub-modules

| Sub-module | Responsibility |
|---|---|
| **Utilities Demand** | Aggregate steam, CW, instrument air, electricity demand from all sized equipment |
| **CAPEX Estimation** | Equipment purchase cost, installation, Lang/Guthrie factors → Total Plant Cost |
| **OPEX Estimation** | Raw materials, utilities, labor, maintenance, overhead → Annual Operating Cost |
| **Profitability Analysis** | NPV, IRR, payback, sensitivity/tornado charts |

### Cost Estimation Classes (AACE)

| Class | Accuracy | Project Phase | ChemScale Support |
|---|---|---|---|
| Class 5 | -30% to +50% | Screening | Yes (from quick estimates) |
| Class 4 | -20% to +30% | Feasibility | Yes (from rigorous sizing) |
| Class 3 | -10% to +20% | Budget authorization | Partial (needs vendor quotes) |

---

## 2. API Endpoints

### Base URL: `/api/v1/economics`

| Method | Endpoint | Description |
|---|---|---|
| **Utilities** | | |
| `POST` | `/utilities/steam` | Steam demand from heat exchangers, tracing |
| `POST` | `/utilities/cooling-water` | Cooling water demand from condensers, coolers |
| `POST` | `/utilities/instrument-air` | Instrument air from valve count |
| `POST` | `/utilities/electricity` | Electrical load from motors |
| `POST` | `/utilities/summary` | Aggregate all utility demands |
| **CAPEX** | | |
| `POST` | `/capex/equipment-cost` | Single equipment purchase cost |
| `POST` | `/capex/plant-cost` | Total plant cost (Lang/Guthrie) |
| `GET`  | `/capex/cepci` | Get CEPCI index values |
| `POST` | `/capex/scale` | Six-tenths rule scaling |
| **OPEX** | | |
| `POST` | `/opex/estimate` | Annual operating cost breakdown |
| **Profitability** | | |
| `POST` | `/profitability/evaluate` | NPV, IRR, payback analysis |
| `POST` | `/profitability/sensitivity` | Tornado / spider chart data |
| **Reports** | | |
| `GET`  | `/results/{calc_id}` | Retrieve stored calculation |
| `GET`  | `/results/{calc_id}/report` | Download economics report (PDF/Excel) |

---

## 3. JSON Input Schemas

### 3.1 Steam Demand — `POST /utilities/steam`

```json
{
  "project_id": "uuid-string",
  "steam_consumers": [
    {
      "equipment_tag": "E-3001",
      "equipment_type": "reboiler",
      "duty": { "value": 5200.0, "unit": "kW" },
      "steam_pressure_level": "MP",
      "steam_pressure": { "value": 10.0, "unit": "barg" },
      "condensate_return_percent": 90.0
    },
    {
      "equipment_tag": "E-1005",
      "equipment_type": "heater",
      "duty": { "value": 1800.0, "unit": "kW" },
      "steam_pressure_level": "LP",
      "steam_pressure": { "value": 3.5, "unit": "barg" },
      "condensate_return_percent": 85.0
    },
    {
      "equipment_tag": "TRACING-01",
      "equipment_type": "steam_tracing",
      "tracing_length": { "value": 500, "unit": "m" },
      "tracing_duty_per_meter": { "value": 0.05, "unit": "kW/m" },
      "steam_pressure_level": "LP",
      "condensate_return_percent": 0.0
    }
  ],
  "steam_header_losses_percent": 5.0,
  "units_preference": "SI"
}
```

### 3.2 Cooling Water Demand — `POST /utilities/cooling-water`

```json
{
  "project_id": "uuid-string",
  "cw_consumers": [
    {
      "equipment_tag": "E-2001",
      "equipment_type": "condenser",
      "duty": { "value": 8500.0, "unit": "kW" },
      "cw_supply_temperature": { "value": 30.0, "unit": "°C" },
      "cw_return_temperature": { "value": 45.0, "unit": "°C" }
    },
    {
      "equipment_tag": "E-1001",
      "equipment_type": "cooler",
      "duty": { "value": 3850.0, "unit": "kW" },
      "cw_supply_temperature": { "value": 30.0, "unit": "°C" },
      "cw_return_temperature": { "value": 45.0, "unit": "°C" }
    }
  ],
  "cw_specific_heat": { "value": 4.18, "unit": "kJ/(kg·K)" },
  "system_losses_percent": 3.0,
  "units_preference": "SI"
}
```

### 3.3 Instrument Air Demand — `POST /utilities/instrument-air`

```json
{
  "project_id": "uuid-string",
  "control_valves": [
    { "tag": "FCV-1001", "size_inches": 4, "type": "globe", "action": "air_to_close" },
    { "tag": "LCV-2001", "size_inches": 6, "type": "butterfly", "action": "air_to_open" },
    { "tag": "PCV-3001", "size_inches": 3, "type": "globe", "action": "air_to_close" }
  ],
  "on_off_valves": [
    { "tag": "XV-1001", "size_inches": 8, "type": "ball", "action": "air_to_close" },
    { "tag": "XV-1002", "size_inches": 6, "type": "ball", "action": "air_to_close" }
  ],
  "other_consumers": [
    { "description": "Pneumatic tools", "demand": { "value": 5.0, "unit": "Nm³/min" } }
  ],
  "simultaneous_use_factor": 0.6,
  "system_leakage_percent": 10.0,
  "supply_pressure": { "value": 7.0, "unit": "barg" }
}
```

### 3.4 Equipment Purchase Cost — `POST /capex/equipment-cost`

```json
{
  "project_id": "uuid-string",
  "equipment_list": [
    {
      "tag": "E-1001",
      "type": "shell_and_tube_heat_exchanger",
      "sizing_parameter": {
        "name": "heat_transfer_area",
        "value": 132.5,
        "unit": "m²"
      },
      "material_of_construction": "CS_shell_CS_tubes",
      "design_pressure": { "value": 10.0, "unit": "barg" },
      "design_temperature": { "value": 175.0, "unit": "°C" },
      "cost_source": "turton_2018"
    },
    {
      "tag": "V-1001",
      "type": "horizontal_pressure_vessel",
      "sizing_parameter": {
        "name": "weight",
        "value": 8500,
        "unit": "kg"
      },
      "material_of_construction": "CS_A516_Gr70",
      "design_pressure": { "value": 15.0, "unit": "barg" },
      "cost_source": "turton_2018"
    },
    {
      "tag": "P-1001A/B",
      "type": "centrifugal_pump",
      "sizing_parameter": {
        "name": "power",
        "value": 45.0,
        "unit": "kW"
      },
      "material_of_construction": "CS",
      "includes_spare": true,
      "cost_source": "turton_2018"
    },
    {
      "tag": "C-1001",
      "type": "distillation_column_trayed",
      "sizing_parameter": {
        "name": "diameter_and_height",
        "diameter": { "value": 2.0, "unit": "m" },
        "height": { "value": 25.0, "unit": "m" }
      },
      "material_of_construction": "SS_316L",
      "number_of_trays": 40,
      "tray_type": "sieve",
      "cost_source": "turton_2018"
    }
  ],
  "cepci_base_year": 2018,
  "cepci_base_value": 603.1,
  "cepci_current_year": 2026,
  "cepci_current_value": 830.0,
  "currency": "USD"
}
```

### 3.5 Total Plant Cost — `POST /capex/plant-cost`

```json
{
  "project_id": "uuid-string",
  "method": "lang_factor",
  "total_equipment_purchase_cost": { "value": 2850000, "unit": "USD" },
  "plant_type": "fluid_processing",
  "lang_factor_override": null,
  "additional_factors": {
    "engineering_and_supervision_percent": 8.0,
    "contingency_percent": 15.0,
    "contractor_fee_percent": 3.0,
    "land_cost": { "value": 500000, "unit": "USD" },
    "working_capital_percent_of_tci": 15.0
  },
  "currency": "USD"
}
```

Alternative Guthrie method:

```json
{
  "project_id": "uuid-string",
  "method": "guthrie_bare_module",
  "equipment_list": [
    {
      "tag": "E-1001",
      "base_purchase_cost": { "value": 85000, "unit": "USD" },
      "material_factor": 1.0,
      "pressure_factor": 1.15,
      "bare_module_factor": 3.17
    },
    {
      "tag": "V-1001",
      "base_purchase_cost": { "value": 120000, "unit": "USD" },
      "material_factor": 1.0,
      "pressure_factor": 1.30,
      "bare_module_factor": 4.16
    }
  ],
  "additional_factors": {
    "contingency_percent": 15.0,
    "contractor_fee_percent": 3.0
  },
  "currency": "USD"
}
```

### 3.6 Six-Tenths Rule Scaling — `POST /capex/scale`

```json
{
  "known_cost": { "value": 500000, "unit": "USD" },
  "known_capacity": { "value": 50.0, "unit": "m²" },
  "target_capacity": { "value": 120.0, "unit": "m²" },
  "scaling_exponent": 0.6,
  "cepci_known_year": 2020,
  "cepci_known_value": 596.2,
  "cepci_target_year": 2026,
  "cepci_target_value": 830.0
}
```

### 3.7 OPEX Estimation — `POST /opex/estimate`

```json
{
  "project_id": "uuid-string",
  "annual_operating_hours": 8400,

  "raw_materials": [
    {
      "name": "MDEA Solution (50 wt%)",
      "consumption_rate": { "value": 50.0, "unit": "kg/h" },
      "unit_cost": { "value": 2.50, "unit": "USD/kg" }
    },
    {
      "name": "Anti-foam Agent",
      "consumption_rate": { "value": 0.5, "unit": "kg/h" },
      "unit_cost": { "value": 15.0, "unit": "USD/kg" }
    }
  ],

  "utilities": {
    "steam_lp": {
      "demand": { "value": 5.2, "unit": "t/h" },
      "unit_cost": { "value": 18.0, "unit": "USD/t" }
    },
    "steam_mp": {
      "demand": { "value": 2.1, "unit": "t/h" },
      "unit_cost": { "value": 22.0, "unit": "USD/t" }
    },
    "cooling_water": {
      "demand": { "value": 800.0, "unit": "m³/h" },
      "unit_cost": { "value": 0.05, "unit": "USD/m³" }
    },
    "electricity": {
      "demand": { "value": 450.0, "unit": "kW" },
      "unit_cost": { "value": 0.08, "unit": "USD/kWh" }
    },
    "instrument_air": {
      "demand": { "value": 20.0, "unit": "Nm³/min" },
      "unit_cost": { "value": 0.02, "unit": "USD/Nm³" }
    }
  },

  "labor": {
    "operators_per_shift": 3,
    "number_of_shifts": 5,
    "annual_salary_per_operator": { "value": 65000, "unit": "USD" },
    "supervision_factor": 0.15,
    "benefits_factor": 0.40
  },

  "maintenance": {
    "percent_of_isbl": 4.0,
    "isbl_capital": { "value": 15000000, "unit": "USD" }
  },

  "overhead": {
    "plant_overhead_percent_of_labor_and_maintenance": 50.0,
    "insurance_percent_of_fixed_capital": 1.0,
    "property_tax_percent_of_fixed_capital": 2.0,
    "fixed_capital": { "value": 20000000, "unit": "USD" }
  },

  "currency": "USD"
}
```

### 3.8 Profitability Analysis — `POST /profitability/evaluate`

```json
{
  "project_id": "uuid-string",

  "investment": {
    "total_capital_investment": { "value": 23000000, "unit": "USD" },
    "working_capital": { "value": 3450000, "unit": "USD" },
    "salvage_value": { "value": 1150000, "unit": "USD" }
  },

  "revenue": {
    "annual_production": { "value": 200000, "unit": "t/year" },
    "product_price": { "value": 650, "unit": "USD/t" }
  },

  "annual_operating_cost": { "value": 98500000, "unit": "USD" },

  "project_parameters": {
    "project_life_years": 20,
    "construction_period_years": 2,
    "construction_spending_profile": [0.40, 0.60],
    "depreciation_method": "straight_line",
    "depreciation_years": 10,
    "tax_rate_percent": 25.0,
    "discount_rate_percent": 10.0,
    "inflation_rate_percent": 2.5,
    "startup_cost_percent_of_fci": 10.0
  },

  "currency": "USD"
}
```

### 3.9 Sensitivity Analysis — `POST /profitability/sensitivity`

```json
{
  "project_id": "uuid-string",
  "base_case_calc_id": "uuid-of-profitability-result",

  "variables_to_vary": [
    {
      "name": "product_price",
      "display_name": "Product Selling Price",
      "variation_percent": [-20, -10, 0, 10, 20]
    },
    {
      "name": "total_capital_investment",
      "display_name": "Total Capital Investment",
      "variation_percent": [-20, -10, 0, 10, 20]
    },
    {
      "name": "annual_operating_cost",
      "display_name": "Annual Operating Cost",
      "variation_percent": [-20, -10, 0, 10, 20]
    },
    {
      "name": "discount_rate_percent",
      "display_name": "Discount Rate",
      "variation_absolute": [8.0, 9.0, 10.0, 12.0, 15.0]
    }
  ],

  "output_metric": "npv"
}
```

---

## 4. Calculation Methods

### 4.1 Equipment Purchase Cost (Turton Correlation)

```
For each equipment type, the base purchase cost at ambient pressure in carbon steel:

  log10(C_p0) = K1 + K2 × log10(A) + K3 × [log10(A)]²

Where:
  A = sizing parameter (area for HX, power for pump, weight for vessel)
  K1, K2, K3 = correlation constants from Turton Table A.1

Pressure factor:
  log10(F_p) = C1 + C2 × log10(P) + C3 × [log10(P)]²

Material factor:
  F_M = from Table A.3 (indexed by equipment type and material)

Bare module cost:
  C_BM = C_p0 × (B1 + B2 × F_M × F_p)

CEPCI escalation:
  C_current = C_BM × (CEPCI_current / CEPCI_base)
```

**Correlation constants (subset):**

| Equipment | K1 | K2 | K3 | Size Range | Size Unit |
|---|---|---|---|---|---|
| S&T Heat Exchanger (floating head) | 4.8306 | -0.8509 | 0.3187 | 10–1000 | m² |
| S&T Heat Exchanger (fixed tube) | 4.3247 | -0.3030 | 0.1634 | 10–1000 | m² |
| Centrifugal Pump | 3.3892 | 0.0536 | 0.1538 | 1–300 | kW |
| Vertical Pressure Vessel | 3.4974 | 0.4485 | 0.1074 | 100–520,000 | kg |
| Tray Column (vessel) | 3.4974 | 0.4485 | 0.1074 | 100–520,000 | kg |
| Sieve Tray | 2.9949 | 0.4465 | 0.3961 | 0.07–12.3 | m² |

### 4.2 Lang Factor Method

```
Total Plant Cost = f_Lang × Σ(C_equipment_delivered)

Lang Factors:
  Solid processing plant:  f_Lang = 3.10
  Solid-fluid plant:       f_Lang = 3.63
  Fluid processing plant:  f_Lang = 4.74

Breakdown of Lang factor (fluid processing):
  Equipment purchase (delivered):  1.00
  Installation:                    0.47
  Instrumentation & controls:      0.36
  Piping:                          0.68
  Electrical:                      0.11
  Buildings:                       0.18
  Yard improvements:               0.10
  Service facilities:              0.70
  Engineering & supervision:       0.33
  Construction expenses:           0.41
  Legal expenses:                  0.04
  Contractor fee:                  0.22
  Contingency:                     0.44
  ─────────────────────────────────────
  Total (Lang factor):             4.74 × C_equipment
```

### 4.3 Guthrie Bare Module Method

```
For each piece of equipment:
  C_BM = C_p0 × F_BM

Where F_BM includes direct + indirect costs:
  F_BM = B1 + B2 × F_M × F_p

| Equipment Type | B1 | B2 |
|---|---|---|
| Heat Exchanger (floating head) | 1.63 | 1.66 |
| Heat Exchanger (fixed tube) | 1.63 | 1.66 |
| Centrifugal Pump + Motor | 1.89 | 1.35 |
| Pressure Vessel (vertical) | 2.25 | 1.82 |
| Tray (per tray, for N ≥ 20) | F_q × F_BM_tray |

Total Bare Module Cost = Σ C_BM,i

Total Module Cost (with contingency):
  C_TM = 1.18 × Σ C_BM,i    (18% contingency + fees)

Grassroots Cost:
  C_GR = C_TM + 0.50 × Σ C_p0,i    (auxiliary facilities)
```

### 4.4 Six-Tenths Rule

```
C_target = C_known × (S_target / S_known)^n × (CEPCI_target / CEPCI_known)

Default exponent n = 0.6 (can be overridden per equipment type)

Typical exponents:
  Heat exchangers:   0.59
  Pumps:             0.55
  Pressure vessels:  0.62
  Distillation cols: 0.62
  Compressors:       0.69
```

### 4.5 OPEX Calculation

```
Annual Operating Cost = Σ(all categories below)

1. Raw Materials:
   C_raw = Σ (rate_i × unit_cost_i × annual_hours)

2. Utilities:
   C_util = Σ (demand_j × unit_cost_j × annual_hours)

3. Operating Labor:
   C_labor = N_operators × N_shifts × salary × (1 + benefits_factor) × (1 + supervision_factor)

4. Maintenance:
   C_maint = maintenance_percent × ISBL_capital

5. Operating Overhead:
   C_overhead = overhead_percent × (C_labor + C_maint)

6. Fixed Charges:
   C_fixed = (insurance% + property_tax%) × fixed_capital

7. General & Administrative (G&A):
   C_ga = ga_percent × (C_raw + C_util + C_labor + C_maint)

Total OPEX = C_raw + C_util + C_labor + C_maint + C_overhead + C_fixed + C_ga
```

### 4.6 Profitability Metrics

```
Net Present Value (NPV):
  NPV = Σ [CF_t / (1 + r)^t]  for t = 0 to project_life
  Where CF_t = (Revenue - OPEX - Depreciation) × (1 - tax) + Depreciation - CAPEX_t

Internal Rate of Return (IRR):
  Find r such that NPV = 0  (solved iteratively via Brent's method)

Payback Period:
  Undiscounted: Find t where Σ CF_t ≥ 0
  Discounted:   Find t where Σ [CF_t / (1+r)^t] ≥ 0

Return on Investment (ROI):
  ROI = Average_Annual_Profit / Total_Capital_Investment × 100%
```

---

## 5. JSON Output Schemas

### 5.1 Equipment Purchase Cost Output

```json
{
  "calc_id": "uuid-string",
  "timestamp": "2026-02-26T16:00:00Z",
  "status": "success",
  "warnings": [],

  "equipment_costs": [
    {
      "tag": "E-1001",
      "type": "shell_and_tube_heat_exchanger",
      "sizing_parameter": { "value": 132.5, "unit": "m²" },
      "base_cost_cp0": { "value": 68500, "unit": "USD", "year": 2018 },
      "pressure_factor_fp": 1.15,
      "material_factor_fm": 1.00,
      "bare_module_factor_fbm": 3.17,
      "bare_module_cost_cbm": { "value": 217100, "unit": "USD", "year": 2018 },
      "cepci_escalated_cost": { "value": 298800, "unit": "USD", "year": 2026 },
      "method": "turton_2018"
    },
    {
      "tag": "V-1001",
      "type": "horizontal_pressure_vessel",
      "sizing_parameter": { "value": 8500, "unit": "kg" },
      "base_cost_cp0": { "value": 95200, "unit": "USD", "year": 2018 },
      "pressure_factor_fp": 1.30,
      "material_factor_fm": 1.00,
      "bare_module_factor_fbm": 4.16,
      "bare_module_cost_cbm": { "value": 396000, "unit": "USD", "year": 2018 },
      "cepci_escalated_cost": { "value": 545100, "unit": "USD", "year": 2026 },
      "method": "turton_2018"
    },
    {
      "tag": "P-1001A/B",
      "type": "centrifugal_pump",
      "sizing_parameter": { "value": 45.0, "unit": "kW" },
      "base_cost_cp0": { "value": 18200, "unit": "USD", "year": 2018 },
      "includes_spare": true,
      "spare_factor": 2.0,
      "bare_module_cost_cbm": { "value": 93700, "unit": "USD", "year": 2018 },
      "cepci_escalated_cost": { "value": 129000, "unit": "USD", "year": 2026 },
      "method": "turton_2018"
    },
    {
      "tag": "C-1001",
      "type": "distillation_column_trayed",
      "vessel_cost": { "value": 285000, "unit": "USD", "year": 2018 },
      "tray_cost_total": { "value": 64000, "unit": "USD", "year": 2018 },
      "bare_module_cost_cbm": { "value": 1254000, "unit": "USD", "year": 2018 },
      "cepci_escalated_cost": { "value": 1726000, "unit": "USD", "year": 2026 },
      "method": "turton_2018"
    }
  ],

  "summary": {
    "total_bare_module_cost_base_year": { "value": 1960800, "unit": "USD", "year": 2018 },
    "total_bare_module_cost_current": { "value": 2698900, "unit": "USD", "year": 2026 },
    "cepci_base": { "year": 2018, "value": 603.1 },
    "cepci_current": { "year": 2026, "value": 830.0 },
    "escalation_factor": 1.376,
    "aace_class": "Class 4 (±20-30%)",
    "number_of_items": 4
  }
}
```

### 5.2 Total Plant Cost Output (Lang Method)

```json
{
  "calc_id": "uuid-string",
  "status": "success",
  "method": "lang_factor",

  "cost_breakdown": {
    "total_equipment_purchase_cost": { "value": 2850000, "unit": "USD" },
    "lang_factor_applied": 4.74,
    "plant_type": "fluid_processing",

    "direct_costs": {
      "purchased_equipment_delivered": { "value": 2850000, "unit": "USD" },
      "installation": { "value": 1339500, "unit": "USD" },
      "instrumentation_and_controls": { "value": 1026000, "unit": "USD" },
      "piping": { "value": 1938000, "unit": "USD" },
      "electrical": { "value": 313500, "unit": "USD" },
      "buildings": { "value": 513000, "unit": "USD" },
      "yard_improvements": { "value": 285000, "unit": "USD" },
      "service_facilities": { "value": 1995000, "unit": "USD" },
      "total_direct_costs": { "value": 10260000, "unit": "USD" }
    },
    "indirect_costs": {
      "engineering_and_supervision": { "value": 940500, "unit": "USD" },
      "construction_expenses": { "value": 1168500, "unit": "USD" },
      "legal_expenses": { "value": 114000, "unit": "USD" },
      "contractor_fee": { "value": 627000, "unit": "USD" },
      "contingency": { "value": 1254000, "unit": "USD" },
      "total_indirect_costs": { "value": 4104000, "unit": "USD" }
    },

    "fixed_capital_investment": { "value": 13509000, "unit": "USD" },
    "land": { "value": 500000, "unit": "USD" },
    "working_capital": { "value": 2101350, "unit": "USD" },
    "total_capital_investment": { "value": 16110350, "unit": "USD" }
  }
}
```

### 5.3 OPEX Output

```json
{
  "calc_id": "uuid-string",
  "status": "success",
  "annual_operating_hours": 8400,

  "cost_breakdown": {
    "raw_materials": {
      "items": [
        { "name": "MDEA Solution", "annual_cost": { "value": 1050000, "unit": "USD" } },
        { "name": "Anti-foam Agent", "annual_cost": { "value": 63000, "unit": "USD" } }
      ],
      "total": { "value": 1113000, "unit": "USD" }
    },
    "utilities": {
      "items": [
        { "name": "LP Steam", "demand_annual": "43,680 t/yr", "annual_cost": { "value": 786240, "unit": "USD" } },
        { "name": "MP Steam", "demand_annual": "17,640 t/yr", "annual_cost": { "value": 388080, "unit": "USD" } },
        { "name": "Cooling Water", "demand_annual": "6,720,000 m³/yr", "annual_cost": { "value": 336000, "unit": "USD" } },
        { "name": "Electricity", "demand_annual": "3,780,000 kWh/yr", "annual_cost": { "value": 302400, "unit": "USD" } },
        { "name": "Instrument Air", "demand_annual": "10,080,000 Nm³/yr", "annual_cost": { "value": 201600, "unit": "USD" } }
      ],
      "total": { "value": 2014320, "unit": "USD" }
    },
    "operating_labor": {
      "total_operators": 15,
      "total_with_supervision_and_benefits": { "value": 1491750, "unit": "USD" }
    },
    "maintenance": { "value": 600000, "unit": "USD" },
    "overhead": { "value": 1045875, "unit": "USD" },
    "fixed_charges": {
      "insurance": { "value": 200000, "unit": "USD" },
      "property_tax": { "value": 400000, "unit": "USD" },
      "total": { "value": 600000, "unit": "USD" }
    },
    "general_and_administrative": {
      "ga_percent_applied": 5.0,
      "base_costs": "(raw_materials + utilities + labor + maintenance)",
      "total": { "value": 260954, "unit": "USD" }
    }
  },

  "total_annual_operating_cost": { "value": 7125899, "unit": "USD" },

  "cost_pie_chart_data": [
    { "category": "Raw Materials", "value": 1113000, "percent": 15.6 },
    { "category": "Utilities", "value": 2014320, "percent": 28.3 },
    { "category": "Labor", "value": 1491750, "percent": 20.9 },
    { "category": "Maintenance", "value": 600000, "percent": 8.4 },
    { "category": "Overhead", "value": 1045875, "percent": 14.7 },
    { "category": "Fixed Charges", "value": 600000, "percent": 8.4 },
    { "category": "G&A", "value": 260954, "percent": 3.7 }
  ]
}
```

### 5.4 Profitability Output

```json
{
  "calc_id": "uuid-string",
  "status": "success",

  "summary_metrics": {
    "npv": { "value": 18250000, "unit": "USD" },
    "irr": { "value": 22.4, "unit": "%" },
    "payback_undiscounted": { "value": 4.2, "unit": "years" },
    "payback_discounted": { "value": 5.8, "unit": "years" },
    "roi": { "value": 28.5, "unit": "%" },
    "profitability_index": 1.79
  },

  "cash_flow_notes": [
    "Year 0-1: Construction period. CAPEX split per construction_spending_profile [40%, 60%].",
    "Year 2: First operating year. Working capital ($3.45M) is charged at startup and recovered in the final project year.",
    "Working capital is shown separately from fixed CAPEX to reflect its recoverable nature."
  ],

  "annual_cash_flow_table": [
    {
      "year": 0,
      "capex": -9200000,
      "working_capital": 0,
      "revenue": 0,
      "opex": 0,
      "depreciation": 0,
      "tax": 0,
      "net_cash_flow": -9200000,
      "cumulative_cf": -9200000,
      "discounted_cf": -9200000,
      "cumulative_dcf": -9200000
    },
    {
      "year": 1,
      "capex": -13800000,
      "working_capital": 0,
      "revenue": 0,
      "opex": 0,
      "depreciation": 0,
      "tax": 0,
      "net_cash_flow": -13800000,
      "cumulative_cf": -23000000,
      "discounted_cf": -12545455,
      "cumulative_dcf": -21745455
    },
    {
      "year": 2,
      "capex": 0,
      "working_capital": -3450000,
      "revenue": 130000000,
      "opex": -98500000,
      "depreciation": -1955000,
      "tax": -7386250,
      "net_cash_flow": 22668750,
      "cumulative_cf": -3781250,
      "discounted_cf": 18735330,
      "cumulative_dcf": -3010125
    }
  ],

  "chart_data": {
    "cumulative_cash_flow": {
      "x_label": "Year",
      "y_label": "Cumulative Cash Flow (USD)",
      "series": [
        { "name": "Undiscounted", "data": [[-23000000], [-3781250], [18887500]] },
        { "name": "Discounted", "data": [[-21745455], [-3010125], [15725205]] }
      ]
    }
  }
}
```

### 5.5 Sensitivity Output

```json
{
  "calc_id": "uuid-string",
  "status": "success",
  "base_case_npv": { "value": 18250000, "unit": "USD" },

  "tornado_chart_data": [
    {
      "variable": "Product Selling Price",
      "low_variation": -20,
      "low_npv": { "value": -2100000, "unit": "USD" },
      "high_variation": 20,
      "high_npv": { "value": 38600000, "unit": "USD" },
      "sensitivity_range": 40700000,
      "rank": 1
    },
    {
      "variable": "Annual Operating Cost",
      "low_variation": -20,
      "low_npv": { "value": 35800000, "unit": "USD" },
      "high_variation": 20,
      "high_npv": { "value": 700000, "unit": "USD" },
      "sensitivity_range": 35100000,
      "rank": 2
    },
    {
      "variable": "Total Capital Investment",
      "low_variation": -20,
      "low_npv": { "value": 22850000, "unit": "USD" },
      "high_variation": 20,
      "high_npv": { "value": 13650000, "unit": "USD" },
      "sensitivity_range": 9200000,
      "rank": 3
    },
    {
      "variable": "Discount Rate",
      "variation_type": "absolute",
      "values": [8.0, 9.0, 10.0, 12.0, 15.0],
      "npv_values": [25400000, 21600000, 18250000, 12200000, 5100000]
    }
  ],

  "spider_chart_data": {
    "x_label": "Variation (%)",
    "y_label": "NPV (USD)",
    "series": [
      {
        "variable": "Product Selling Price",
        "points": [
          { "variation": -20, "npv": -2100000 },
          { "variation": -10, "npv": 8075000 },
          { "variation": 0, "npv": 18250000 },
          { "variation": 10, "npv": 28425000 },
          { "variation": 20, "npv": 38600000 }
        ]
      }
    ]
  }
}
```

---

## 6. Sample Request/Response

### 6.1 Complete CAPEX Workflow Example

**Step 1 — Size the equipment using Modules 4, 5, 6:**
(Use Module 6 API to get heat exchanger area = 132.5 m², Module 4 for vessel weight, Module 5 for pump power)

**Step 2 — Estimate equipment costs:**

```bash
curl -X POST https://api.chemscale.io/v1/economics/capex/equipment-cost \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj-001",
    "equipment_list": [
      {
        "tag": "E-1001",
        "type": "shell_and_tube_heat_exchanger",
        "sizing_parameter": {"name": "heat_transfer_area", "value": 132.5, "unit": "m²"},
        "material_of_construction": "CS_shell_CS_tubes",
        "design_pressure": {"value": 10.0, "unit": "barg"},
        "cost_source": "turton_2018"
      }
    ],
    "cepci_base_year": 2018,
    "cepci_base_value": 603.1,
    "cepci_current_year": 2026,
    "cepci_current_value": 830.0,
    "currency": "USD"
  }'
```

**Response (200 OK):**
```json
{
  "calc_id": "cost-uuid-001",
  "status": "success",
  "equipment_costs": [
    {
      "tag": "E-1001",
      "type": "shell_and_tube_heat_exchanger",
      "base_cost_cp0": {"value": 68500, "unit": "USD", "year": 2018},
      "pressure_factor_fp": 1.15,
      "material_factor_fm": 1.00,
      "bare_module_cost_cbm": {"value": 217100, "unit": "USD", "year": 2018},
      "cepci_escalated_cost": {"value": 298800, "unit": "USD", "year": 2026}
    }
  ],
  "summary": {
    "total_bare_module_cost_current": {"value": 298800, "unit": "USD", "year": 2026},
    "aace_class": "Class 4 (±20-30%)"
  }
}
```

**Step 3 — Scale to Total Plant Cost:**

```bash
curl -X POST https://api.chemscale.io/v1/economics/capex/plant-cost \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj-001",
    "method": "lang_factor",
    "total_equipment_purchase_cost": {"value": 2850000, "unit": "USD"},
    "plant_type": "fluid_processing",
    "additional_factors": {
      "contingency_percent": 15.0,
      "land_cost": {"value": 500000, "unit": "USD"},
      "working_capital_percent_of_tci": 15.0
    },
    "currency": "USD"
  }'
```

### 6.2 Complete OPEX + Profitability Flow

```bash
# Step 1: Calculate OPEX
curl -X POST https://api.chemscale.io/v1/economics/opex/estimate \
  -H "Authorization: Bearer <token>" \
  -d '{ ...OPEX input from Section 3.7... }'

# Step 2: Run profitability with OPEX result
curl -X POST https://api.chemscale.io/v1/economics/profitability/evaluate \
  -H "Authorization: Bearer <token>" \
  -d '{ ...profitability input from Section 3.8... }'

# Step 3: Sensitivity analysis
curl -X POST https://api.chemscale.io/v1/economics/profitability/sensitivity \
  -H "Authorization: Bearer <token>" \
  -d '{
    "base_case_calc_id": "profitability-calc-uuid",
    "variables_to_vary": [
      {"name": "product_price", "display_name": "Product Price", "variation_percent": [-20,-10,0,10,20]},
      {"name": "total_capital_investment", "display_name": "CAPEX", "variation_percent": [-20,-10,0,10,20]},
      {"name": "annual_operating_cost", "display_name": "OPEX", "variation_percent": [-20,-10,0,10,20]}
    ],
    "output_metric": "npv"
  }'

# Step 4: Download report
curl -X GET https://api.chemscale.io/v1/economics/results/{calc_id}/report?format=pdf \
  -H "Authorization: Bearer <token>" \
  -o economics_report.pdf
```

---

*This specification defines the contract between the frontend and the Economic Evaluation service. All cost correlations are traceable to published references (Turton 6th Ed., Peters & Timmerhaus 5th Ed., Couper 5th Ed.).*
