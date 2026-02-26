# Module 6 — Heat Exchanger Design: API Specification

**Version:** 1.0.0
**Standards:** TEMA 10th Ed., ASME Sec VIII Div 1, API 660, API 661
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

The Heat Exchanger module provides three tiers of calculation fidelity:

| Tier | Method | Use Case | Response Time |
|---|---|---|---|
| **Quick Estimate** | Q = U·A·LMTD·Ft with tabulated U-values | Feasibility studies, early-phase design | < 500 ms |
| **Design (Sizing)** | Bell-Delaware (shell) + Gnielinski (tube) | New exchanger specification | < 3 s |
| **Rating (Checking)** | Full Bell-Delaware with geometry input | Verify existing exchanger performance | < 5 s |

**Exchanger types supported:**
- Shell & Tube (TEMA E, F, G, H, J, K, X shells)
- Air-Cooled (forced draft, induced draft)
- Condenser (total, partial, integral subcooling)
- Reboiler (kettle, thermosiphon — vertical/horizontal)

---

## 2. API Endpoints

### Base URL: `/api/v1/heat-exchanger`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/estimate` | Quick U·A·LMTD estimation |
| `POST` | `/design` | Rigorous sizing (new exchanger) |
| `POST` | `/rate` | Rating check (existing geometry) |
| `GET`  | `/u-values` | Tabulated overall U-value ranges |
| `GET`  | `/tema-types` | TEMA nomenclature reference |
| `POST` | `/condenser/design` | Multi-zone condenser design |
| `POST` | `/reboiler/design` | Kettle or thermosiphon reboiler |
| `POST` | `/air-cooler/design` | Air-cooled exchanger sizing |
| `GET`  | `/results/{calc_id}` | Retrieve stored calculation |
| `GET`  | `/results/{calc_id}/datasheet` | Download TEMA datasheet (PDF) |

---

## 3. JSON Input Schemas

### 3.1 Quick Estimate — `POST /estimate`

```json
{
  "project_id": "string (UUID, optional)",
  "tag": "E-1001",
  "service": "Crude Oil / Cooling Water",

  "hot_side": {
    "fluid_name": "Crude Oil",
    "components": [
      { "name": "n-hexane", "cas": "110-54-3", "mole_fraction": 0.15 },
      { "name": "n-heptane", "cas": "142-82-5", "mole_fraction": 0.25 },
      { "name": "n-octane", "cas": "111-65-9", "mole_fraction": 0.30 },
      { "name": "n-decane", "cas": "124-18-5", "mole_fraction": 0.20 },
      { "name": "toluene", "cas": "108-88-3", "mole_fraction": 0.10 }
    ],
    "inlet_temperature": { "value": 150.0, "unit": "°C" },
    "outlet_temperature": { "value": 60.0, "unit": "°C" },
    "mass_flow_rate": { "value": 50000.0, "unit": "kg/h" },
    "pressure": { "value": 5.0, "unit": "barg" },
    "fouling_resistance": { "value": 0.00035, "unit": "m²·K/W" }
  },

  "cold_side": {
    "fluid_name": "Cooling Water",
    "components": [
      { "name": "water", "cas": "7732-18-5", "mole_fraction": 1.0 }
    ],
    "inlet_temperature": { "value": 30.0, "unit": "°C" },
    "outlet_temperature": { "value": 45.0, "unit": "°C" },
    "pressure": { "value": 4.0, "unit": "barg" },
    "fouling_resistance": { "value": 0.00018, "unit": "m²·K/W" }
  },

  "configuration": {
    "flow_arrangement": "counter_current",
    "exchanger_type": "shell_and_tube",
    "tema_shell": "E",
    "number_of_shell_passes": 1,
    "number_of_tube_passes": 2
  },

  "thermo_model": "PENG_ROBINSON",

  "units_preference": "SI"
}
```

### 3.2 Rigorous Design — `POST /design`

Extends the estimate input with geometric constraints and optimization targets:

```json
{
  "...all fields from /estimate...",

  "design_constraints": {
    "max_shell_diameter": { "value": 1500, "unit": "mm" },
    "max_tube_length": { "value": 6096, "unit": "mm" },
    "max_shell_side_pressure_drop": { "value": 0.7, "unit": "bar" },
    "max_tube_side_pressure_drop": { "value": 0.7, "unit": "bar" },
    "min_overdesign": 10.0,
    "max_overdesign": 30.0
  },

  "tube_specification": {
    "outer_diameter": { "value": 19.05, "unit": "mm" },
    "wall_thickness": { "value": 2.11, "unit": "mm" },
    "pitch": { "value": 25.4, "unit": "mm" },
    "pitch_type": "triangular",
    "material": "CS_A179"
  },

  "shell_specification": {
    "material": "CS_A516_GR70",
    "baffle_type": "single_segmental",
    "baffle_cut_percent": 25,
    "baffle_spacing_ratio": null
  },

  "allocation": {
    "shell_side": "hot",
    "tube_side": "cold",
    "reason": "Cooling water on tube side for easy cleaning"
  },

  "optimization_objective": "min_area"
}
```

### 3.3 Rating Check — `POST /rate`

Provides exact geometry of an existing exchanger:

```json
{
  "...all fluid fields from /estimate...",

  "geometry": {
    "tema_type": "AES",
    "shell_inside_diameter": { "value": 787, "unit": "mm" },
    "tube_outer_diameter": { "value": 19.05, "unit": "mm" },
    "tube_wall_thickness": { "value": 2.11, "unit": "mm" },
    "tube_length": { "value": 4877, "unit": "mm" },
    "tube_pitch": { "value": 25.4, "unit": "mm" },
    "pitch_type": "triangular",
    "number_of_tubes": 468,
    "number_of_tube_passes": 2,
    "number_of_shell_passes": 1,
    "baffle_type": "single_segmental",
    "baffle_cut_percent": 25,
    "baffle_spacing": { "value": 400, "unit": "mm" },
    "inlet_baffle_spacing": { "value": 500, "unit": "mm" },
    "outlet_baffle_spacing": { "value": 500, "unit": "mm" },
    "number_of_baffles": 10,
    "shell_nozzle_id": { "value": 254, "unit": "mm" },
    "tube_nozzle_id": { "value": 254, "unit": "mm" },
    "seal_strip_pairs": 1,
    "tube_to_baffle_clearance": { "value": 0.4, "unit": "mm" },
    "shell_to_baffle_clearance": { "value": 3.2, "unit": "mm" },
    "bundle_to_shell_clearance": { "value": 12.0, "unit": "mm" }
  }
}
```

### 3.4 Condenser Design — `POST /condenser/design`

```json
{
  "project_id": "string (UUID, optional)",
  "tag": "E-2001",
  "service": "Column Overhead Condenser",

  "vapor_inlet": {
    "components": [
      { "name": "propane", "cas": "74-98-6", "mole_fraction": 0.35 },
      { "name": "n-butane", "cas": "106-97-8", "mole_fraction": 0.40 },
      { "name": "n-pentane", "cas": "109-66-0", "mole_fraction": 0.25 }
    ],
    "temperature": { "value": 65.0, "unit": "°C" },
    "pressure": { "value": 8.0, "unit": "barg" },
    "mass_flow_rate": { "value": 25000.0, "unit": "kg/h" },
    "vapor_fraction": 1.0
  },

  "condensate_outlet": {
    "subcooling": { "value": 5.0, "unit": "°C" },
    "target_vapor_fraction": 0.0
  },

  "coolant": {
    "fluid": "cooling_water",
    "inlet_temperature": { "value": 30.0, "unit": "°C" },
    "outlet_temperature": { "value": 45.0, "unit": "°C" },
    "fouling_resistance": { "value": 0.00018, "unit": "m²·K/W" }
  },

  "condenser_type": "total",
  "orientation": "horizontal",
  "condensation_side": "shell",
  "method": "silver_bell_ghaly",
  "thermo_model": "PENG_ROBINSON"
}
```

### 3.5 Reboiler Design — `POST /reboiler/design`

```json
{
  "project_id": "string (UUID, optional)",
  "tag": "E-3001",
  "service": "Column Reboiler",

  "process_side": {
    "components": [
      { "name": "n-butane", "cas": "106-97-8", "mole_fraction": 0.30 },
      { "name": "n-pentane", "cas": "109-66-0", "mole_fraction": 0.45 },
      { "name": "n-hexane", "cas": "110-54-3", "mole_fraction": 0.25 }
    ],
    "inlet_temperature": { "value": 120.0, "unit": "°C" },
    "pressure": { "value": 3.5, "unit": "barg" },
    "mass_flow_rate": { "value": 40000.0, "unit": "kg/h" },
    "target_vaporization_fraction": 0.30,
    "fouling_resistance": { "value": 0.00035, "unit": "m²·K/W" }
  },

  "heating_medium": {
    "type": "steam",
    "steam_pressure": { "value": 6.0, "unit": "barg" },
    "fouling_resistance": { "value": 0.0001, "unit": "m²·K/W" }
  },

  "reboiler_type": "kettle",
  "boiling_correlation": "mostinski",
  "thermo_model": "PENG_ROBINSON"
}
```

---

## 4. Calculation Methods

### 4.1 Quick Estimate

```
1. Resolve physical properties at mean temperatures
   - Hot side: T_mean = (T_h1 + T_h2) / 2
   - Cold side: T_mean = (T_c1 + T_c2) / 2
   - Call thermo engine for ρ, Cp, μ, k at each T_mean

2. Heat duty
   Q = m_hot × Cp_hot_avg × (T_h1 - T_h2)

3. Cold-side flow rate (if not given)
   m_cold = Q / (Cp_cold_avg × (T_c2 - T_c1))

4. Log-Mean Temperature Difference
   ΔT1 = T_h1 - T_c2  (counter-current)
   ΔT2 = T_h2 - T_c1
   LMTD = (ΔT1 - ΔT2) / ln(ΔT1 / ΔT2)

5. LMTD Correction Factor (Ft)
   R = (T_h1 - T_h2) / (T_c2 - T_c1)
   P = (T_c2 - T_c1) / (T_h1 - T_c1)
   Ft = f(R, P, shell_passes, tube_passes)  — Bowman formula
   WARNING if Ft < 0.75

6. Overall U-value (from lookup table or user input)
   U_assumed = lookup(hot_fluid_type, cold_fluid_type)

7. Required area
   A_required = Q / (U_assumed × LMTD × Ft)

8. Apply fouling
   1/U_clean = 1/U_assumed
   1/U_dirty = 1/U_clean + R_f_hot + R_f_cold
   A_dirty = Q / (U_dirty × LMTD × Ft)
```

### 4.2 Rigorous Design — Bell-Delaware Method

```
SHELL SIDE (Bell-Delaware):
─────────────────────────────
1. Ideal crossflow coefficient (h_id):
   j_H = a1 × (1.33 / (pt/do))^a × Re_s^a2  — Taborek correlation
   h_id = j_H × Cp × m_s / (A_s × Pr^(2/3))

2. Correction factors:
   Jc = baffle window correction (function of baffle cut)
   Jl = leakage correction (tube-baffle + shell-baffle clearances)
   Jb = bundle bypass correction (bundle-shell clearance, seal strips)
   Js = baffle spacing correction (inlet/outlet vs. central spacing)
   Jr = adverse temperature gradient correction (Re < 100)

3. Corrected shell-side coefficient:
   h_shell = h_id × Jc × Jl × Jb × Js × Jr

4. Shell-side pressure drop:
   ΔP_shell = ΔP_crossflow × (N_b - 1) × Rl × Rb
              + ΔP_window × N_b
              + ΔP_end_zones × 2 × Rb × Rs

TUBE SIDE:
──────────
1. Velocity:
   V_tube = m_tube / (ρ × N_tubes/N_passes × A_tube_cross)

2. Heat transfer (Gnielinski for 2300 < Re < 5×10⁶):
   Nu = (f/8)(Re - 1000)Pr / [1 + 12.7(f/8)^0.5(Pr^(2/3) - 1)]
   h_tube = Nu × k / d_i

   (Sieder-Tate for Re < 2300):
   Nu = 1.86 × (Re × Pr × d_i/L)^(1/3) × (μ/μ_w)^0.14

3. Pressure drop:
   ΔP_tube = N_passes × [f × L/d_i × ρV²/2 + 2.5 × ρV²/2]

OVERALL:
────────
1. Overall coefficient:
   1/U_clean = 1/h_shell + (d_o/d_i)/h_tube + R_wall
   1/U_dirty = 1/U_clean + R_f_shell + (d_o/d_i) × R_f_tube

2. Overdesign:
   Overdesign% = (U_dirty × A_actual - Q/LMTD/Ft) / (Q/LMTD/Ft) × 100

3. Iterate on:
   - Baffle spacing (to hit ΔP target)
   - Tube length (within max constraint)
   - Shell diameter (tube count lookup from TEMA tube-count tables)
   - Number of tube passes (1, 2, 4, 6)
```

### 4.3 Condenser Design — Silver-Bell-Ghaly

```
1. Generate condensation curve:
   - Flash the feed at multiple T values between T_bubble and T_dew
   - At each T: vapor fraction, vapor Cp, liquid Cp, latent heat
   - Build Q vs. T curve (enthalpy integration)

2. Divide into zones:
   Zone 1: Desuperheating (if T_in > T_dew)
   Zone 2: Condensing (T_dew → T_bubble)
   Zone 3: Subcooling (T_bubble → T_out)

3. For the condensing zone (Silver-Bell-Ghaly):
   h_eff = h_condensation / (1 + Z_SBG)
   Z_SBG = (Cp_vapor × (T_vapor - T_interface)) / h_fg × (h_condensation / h_vapor_sensible)

4. Sum areas across all zones:
   A_total = Σ (Q_zone / (U_zone × LMTD_zone))
```

### 4.4 Vibration Analysis

```
Per TEMA Section 6 / HTRI guidelines:

1. Natural frequency of tubes:
   fn = (Cn / (2π)) × √(E×I / (ρ_eff × A × L_span⁴))

2. Vortex shedding frequency:
   fvs = St × V_crossflow / d_o    (St ≈ 0.2 for Re > 1000)

3. Fluid-elastic instability:
   V_critical = K × fn × d_o × √(m_eff × 2πζ / (ρ × d_o²))

4. Check: V_crossflow < 0.8 × V_critical  →  PASS
   Check: fvs / fn > 1.3 or < 0.7  →  PASS (outside lock-in range)
```

---

## 5. JSON Output Schemas

### 5.1 Estimate Output

```json
{
  "calc_id": "uuid-string",
  "timestamp": "2026-02-26T14:30:00Z",
  "status": "success",
  "tag": "E-1001",
  "method": "quick_estimate",
  "warnings": [],

  "thermal_summary": {
    "duty": { "value": 3850.0, "unit": "kW" },
    "lmtd": { "value": 42.3, "unit": "°C" },
    "ft_correction": 0.87,
    "effective_mdt": { "value": 36.8, "unit": "°C" },
    "u_assumed_clean": { "value": 450.0, "unit": "W/(m²·K)" },
    "u_dirty": { "value": 320.0, "unit": "W/(m²·K)" },
    "area_clean": { "value": 232.5, "unit": "m²" },
    "area_dirty": { "value": 327.4, "unit": "m²" }
  },

  "cold_side_flow": {
    "mass_flow_rate": { "value": 220500.0, "unit": "kg/h" },
    "volumetric_flow_rate": { "value": 221.3, "unit": "m³/h" }
  },

  "properties_used": {
    "hot_side": {
      "mean_temperature": { "value": 105.0, "unit": "°C" },
      "density": { "value": 650.2, "unit": "kg/m³" },
      "specific_heat": { "value": 2.35, "unit": "kJ/(kg·K)" },
      "viscosity": { "value": 0.42e-3, "unit": "Pa·s" },
      "thermal_conductivity": { "value": 0.115, "unit": "W/(m·K)" }
    },
    "cold_side": {
      "mean_temperature": { "value": 37.5, "unit": "°C" },
      "density": { "value": 993.0, "unit": "kg/m³" },
      "specific_heat": { "value": 4.18, "unit": "kJ/(kg·K)" },
      "viscosity": { "value": 0.69e-3, "unit": "Pa·s" },
      "thermal_conductivity": { "value": 0.628, "unit": "W/(m·K)" }
    }
  },

  "thermo_model": "PENG_ROBINSON",
  "standards_references": ["TEMA 10th Ed. §5", "API 660 §7"]
}
```

### 5.2 Rigorous Design Output

```json
{
  "calc_id": "uuid-string",
  "timestamp": "2026-02-26T14:35:00Z",
  "status": "success",
  "tag": "E-1001",
  "method": "bell_delaware_design",
  "convergence": {
    "iterations": 12,
    "tolerance_achieved": 0.08,
    "tolerance_target": 0.1,
    "converged": true
  },
  "warnings": [
    "Ft = 0.82; consider increasing shell passes if Ft < 0.80"
  ],

  "geometry_selected": {
    "tema_type": "AES",
    "shell_inside_diameter": { "value": 787, "unit": "mm" },
    "tube_outer_diameter": { "value": 19.05, "unit": "mm" },
    "tube_inner_diameter": { "value": 14.83, "unit": "mm" },
    "tube_length": { "value": 4877, "unit": "mm" },
    "tube_pitch": { "value": 25.4, "unit": "mm" },
    "pitch_type": "triangular_30",
    "number_of_tubes": 468,
    "number_of_tube_passes": 2,
    "number_of_shell_passes": 1,
    "baffle_type": "single_segmental",
    "baffle_cut_percent": 25,
    "central_baffle_spacing": { "value": 395, "unit": "mm" },
    "inlet_baffle_spacing": { "value": 500, "unit": "mm" },
    "outlet_baffle_spacing": { "value": 500, "unit": "mm" },
    "number_of_baffles": 10,
    "seal_strip_pairs": 1,
    "effective_tube_length": { "value": 4677, "unit": "mm" },
    "heat_transfer_area": { "value": 132.5, "unit": "m²" }
  },

  "thermal_results": {
    "duty": { "value": 3850.0, "unit": "kW" },
    "lmtd": { "value": 42.3, "unit": "°C" },
    "ft_correction": 0.87,
    "effective_mdt": { "value": 36.8, "unit": "°C" },

    "shell_side": {
      "h_ideal": { "value": 1850.0, "unit": "W/(m²·K)" },
      "Jc": 0.98,
      "Jl": 0.85,
      "Jb": 0.91,
      "Js": 0.95,
      "Jr": 1.00,
      "h_corrected": { "value": 1365.0, "unit": "W/(m²·K)" },
      "reynolds_number": 18500,
      "flow_regime": "turbulent"
    },

    "tube_side": {
      "h_coefficient": { "value": 5200.0, "unit": "W/(m²·K)" },
      "velocity": { "value": 1.85, "unit": "m/s" },
      "reynolds_number": 42300,
      "flow_regime": "turbulent",
      "correlation_used": "gnielinski"
    },

    "overall_coefficients": {
      "U_clean": { "value": 485.0, "unit": "W/(m²·K)" },
      "U_dirty": { "value": 352.0, "unit": "W/(m²·K)" },
      "U_required": { "value": 315.0, "unit": "W/(m²·K)" }
    },

    "overdesign_percent": 11.7,
    "overdesign_status": "ACCEPTABLE"
  },

  "hydraulic_results": {
    "shell_side": {
      "pressure_drop_crossflow": { "value": 0.28, "unit": "bar" },
      "pressure_drop_window": { "value": 0.09, "unit": "bar" },
      "pressure_drop_end_zones": { "value": 0.06, "unit": "bar" },
      "pressure_drop_nozzles": { "value": 0.04, "unit": "bar" },
      "pressure_drop_total": { "value": 0.47, "unit": "bar" },
      "status": "WITHIN_LIMIT"
    },
    "tube_side": {
      "pressure_drop_friction": { "value": 0.31, "unit": "bar" },
      "pressure_drop_return": { "value": 0.08, "unit": "bar" },
      "pressure_drop_nozzles": { "value": 0.05, "unit": "bar" },
      "pressure_drop_total": { "value": 0.44, "unit": "bar" },
      "status": "WITHIN_LIMIT"
    }
  },

  "vibration_check": {
    "natural_frequency_tubes": { "value": 45.2, "unit": "Hz" },
    "vortex_shedding_frequency": { "value": 22.1, "unit": "Hz" },
    "critical_velocity": { "value": 4.8, "unit": "m/s" },
    "max_crossflow_velocity": { "value": 1.2, "unit": "m/s" },
    "velocity_ratio": 0.25,
    "frequency_ratio": 0.49,
    "status": "SAFE"
  },

  "mechanical_design": {
    "shell_thickness_required": { "value": 8.2, "unit": "mm" },
    "shell_thickness_selected": { "value": 9.53, "unit": "mm" },
    "tubesheet_thickness": { "value": 55.0, "unit": "mm" },
    "design_pressure_shell": { "value": 10.0, "unit": "barg" },
    "design_pressure_tube": { "value": 10.0, "unit": "barg" },
    "design_temperature": { "value": 175.0, "unit": "°C" },
    "shell_material": "SA-516 Gr.70",
    "tube_material": "SA-179",
    "tubesheet_material": "SA-516 Gr.70"
  },

  "weight_estimate": {
    "shell_dry": { "value": 4200, "unit": "kg" },
    "tube_bundle": { "value": 2800, "unit": "kg" },
    "operating_weight": { "value": 8500, "unit": "kg" }
  },

  "standards_references": [
    "TEMA 10th Ed. — Shell type E, Class R",
    "ASME Sec VIII Div 1 — UG-27 (shell thickness)",
    "ASME Sec VIII Div 1 — UG-34 (tubesheet)",
    "API 660 — Table 5 (nozzle sizing)",
    "Bell-Delaware method — Taborek (1983)"
  ]
}
```

### 5.3 Rating Output

Same structure as Design Output, but with an additional verdict:

```json
{
  "...all fields from design output...",

  "rating_verdict": {
    "thermally_adequate": true,
    "hydraulically_adequate": true,
    "vibration_safe": true,
    "overall_verdict": "ACCEPTABLE",
    "remarks": [
      "Overdesign of 11.7% is within target range (10-30%)",
      "Shell-side ΔP uses 67% of allowable",
      "Tube-side ΔP uses 63% of allowable"
    ]
  }
}
```

---

## 6. Sample Request/Response

### 6.1 Complete Quick Estimate Example

**Request:**
```bash
curl -X POST https://api.chemscale.io/v1/heat-exchanger/estimate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "E-1001",
    "service": "Lean Amine Cooler",
    "hot_side": {
      "fluid_name": "Lean MDEA",
      "components": [
        {"name": "water", "cas": "7732-18-5", "mole_fraction": 0.70},
        {"name": "MDEA", "cas": "105-59-9", "mole_fraction": 0.30}
      ],
      "inlet_temperature": {"value": 80.0, "unit": "°C"},
      "outlet_temperature": {"value": 45.0, "unit": "°C"},
      "mass_flow_rate": {"value": 120000.0, "unit": "kg/h"},
      "pressure": {"value": 3.0, "unit": "barg"},
      "fouling_resistance": {"value": 0.00035, "unit": "m²·K/W"}
    },
    "cold_side": {
      "fluid_name": "Cooling Water",
      "components": [
        {"name": "water", "cas": "7732-18-5", "mole_fraction": 1.0}
      ],
      "inlet_temperature": {"value": 30.0, "unit": "°C"},
      "pressure": {"value": 4.0, "unit": "barg"},
      "fouling_resistance": {"value": 0.00018, "unit": "m²·K/W"}
    },
    "configuration": {
      "flow_arrangement": "counter_current",
      "exchanger_type": "shell_and_tube",
      "tema_shell": "E",
      "number_of_shell_passes": 1,
      "number_of_tube_passes": 2
    },
    "thermo_model": "NRTL",
    "units_preference": "SI"
  }'
```

**Response (200 OK):**
```json
{
  "calc_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-02-26T15:00:00Z",
  "status": "success",
  "tag": "E-1001",
  "method": "quick_estimate",
  "warnings": [
    "MDEA solution: NRTL model selected — ensure binary parameters are available for H2O-MDEA pair"
  ],
  "thermal_summary": {
    "duty": {"value": 4872.0, "unit": "kW"},
    "lmtd": {"value": 22.4, "unit": "°C"},
    "ft_correction": 0.88,
    "effective_mdt": {"value": 19.7, "unit": "°C"},
    "u_assumed_clean": {"value": 800.0, "unit": "W/(m²·K)"},
    "u_dirty": {"value": 485.0, "unit": "W/(m²·K)"},
    "area_clean": {"value": 309.2, "unit": "m²"},
    "area_dirty": {"value": 509.4, "unit": "m²"}
  },
  "cold_side_flow": {
    "mass_flow_rate": {"value": 279800.0, "unit": "kg/h"},
    "outlet_temperature": {"value": 45.0, "unit": "°C"}
  },
  "standards_references": ["TEMA 10th Ed. §RCB-4", "API 660"]
}
```

### 6.2 U-Value Reference Lookup

**Request:**
```bash
curl -X GET https://api.chemscale.io/v1/heat-exchanger/u-values?hot=organic_liquid&cold=water
```

**Response:**
```json
{
  "hot_fluid": "organic_liquid",
  "cold_fluid": "water",
  "u_range_clean": {
    "low": {"value": 350, "unit": "W/(m²·K)"},
    "typical": {"value": 600, "unit": "W/(m²·K)"},
    "high": {"value": 900, "unit": "W/(m²·K)"}
  },
  "source": "Coulson & Richardson Vol. 6, Table 12.1; Perry's 9th Ed. Table 11-5"
}
```

---

*This specification defines the contract between the frontend and the Heat Exchanger calculation service. All implementations must satisfy these input/output schemas and the calculation methods described herein.*
