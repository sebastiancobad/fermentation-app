# Thermodynamic & Physical Property Engine — Technical Specification

**Version:** 1.1.0
**Status:** Architecture Design Phase

---

## 1. Purpose

The Thermodynamic Engine is the computational backbone of ChemScale. Every engineering module depends on it for:
- Phase determination (vapor, liquid, two-phase, three-phase)
- Pure component properties (density, Cp, viscosity, thermal conductivity, surface tension, latent heat)
- Mixture properties via rigorous thermodynamic models
- Flash calculations (PT, PH, PS, TV, bubble/dew points)
- Phase envelopes and critical point estimation for mixtures

---

## 2. API Endpoints

### Base URL: `/api/v1/thermo`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/flash/pt` | PT flash — given T, P, composition |
| `POST` | `/flash/ph` | PH flash — given P, H, composition |
| `POST` | `/flash/bubble-point` | Bubble point T (given P) or P (given T) |
| `POST` | `/flash/dew-point` | Dew point T (given P) or P (given T) |
| `POST` | `/phase-envelope` | Full phase envelope (bubble + dew curves) |
| `POST` | `/properties/pure` | Pure component properties at T, P |
| `POST` | `/properties/mixture` | Mixture properties at T, P, composition, phase |
| `POST` | `/properties/transport` | Transport properties (μ, k, σ, D) |
| `GET`  | `/models` | List available thermo models and their applicability |
| `POST` | `/model/recommend` | Auto-recommend model for given components |

---

## 3. Equations of State Implementation

### 3.1 Generalized Cubic EOS

All cubic EOS share the form:

```
P = RT / (V - b) - a(T) / [(V + δ₁b)(V + δ₂b)]
```

| Parameter | Peng-Robinson | SRK |
|---|---|---|
| δ₁ | 1 + √2 | 1 |
| δ₂ | 1 - √2 | 0 |
| Ωa | 0.45724 | 0.42748 |
| Ωb | 0.07780 | 0.08664 |

**Pure component parameters:**
```
a_i(T) = Ωa × (R²Tc²/Pc) × α(T)
b_i     = Ωb × (RTc/Pc)
```

**Alpha functions:**

Standard (Soave):
```
α(T) = [1 + m(1 - √Tr)]²
m_PR = 0.37464 + 1.54226ω - 0.26992ω²          (ω ≤ 0.491)
m_PR = 0.379642 + 1.48503ω - 0.164423ω² + 0.016666ω³  (ω > 0.491)
m_SRK = 0.480 + 1.574ω - 0.176ω²
```

Twu (for improved heavy hydrocarbon accuracy):
```
α(T) = Tr^(N(M-1)) × exp[L(1 - Tr^(NM))]
Parameters L, M, N are component-specific (from regression)
```

**Mixing rules (van der Waals one-fluid):**
```
a_mix = ΣΣ x_i × x_j × (a_i × a_j)^0.5 × (1 - k_ij)
b_mix = Σ x_i × b_i
```

### 3.2 Cubic Equation Solution

The EOS in terms of compressibility factor Z:

```
PR:  Z³ - (1 - B)Z² + (A - 2B - 3B²)Z - (AB - B² - B³) = 0
SRK: Z³ - Z² + (A - B - B²)Z - AB = 0

Where: A = a_mix × P / (R²T²),  B = b_mix × P / (RT)
```

Solution procedure:
1. Compute discriminant to determine number of real roots
2. If 3 real roots: smallest Z → liquid, largest Z → vapor
3. Select correct root by minimizing the departure Gibbs energy **using the EOS-specific formula:**

**Peng-Robinson:**
```
G_dep/(RT) = (Z - 1) - ln(Z - B) - A/(2√2·B) × ln[(Z + (1+√2)B) / (Z + (1-√2)B)]
```

**SRK:**
```
G_dep/(RT) = (Z - 1) - ln(Z - B) - (A/B) × ln[(Z + B) / Z]
```

> **Implementation note:** The root-selection formula is EOS-specific. Do NOT use the PR formula for SRK or vice versa — the `δ₁, δ₂` parameters change the logarithmic term structure.

### 3.3 Derived Properties from EOS

All departure functions below are **EOS-specific**. Both PR and SRK forms are provided.

**Peng-Robinson departure functions:**
```
Fugacity coefficient (component i in mixture):
  ln(φ_i) = (b_i/b_mix)(Z - 1) - ln(Z - B)
           - A/(2√2·B) × [2Σ_j(x_j·a_ij)/a_mix - b_i/b_mix]
           × ln[(Z + (1+√2)B) / (Z + (1-√2)B)]

Enthalpy departure:
  (H - H_ig) = RT(Z - 1)
             + [T(da_mix/dT) - a_mix] / (2√2·b_mix)
             × ln[(Z + (1+√2)B) / (Z + (1-√2)B)]

Entropy departure (at constant T, P):
  (S - S_ig)_TP = R·ln(Z - B)
                + (da_mix/dT) / (2√2·b_mix)
                × ln[(Z + (1+√2)B) / (Z + (1-√2)B)]

  Note: This is the departure from an ideal gas at the SAME T and P.
  When computing absolute entropy, add the ideal-gas contribution:
  S_ig(T,P) = S_ig(T_ref, P_ref) + ∫Cp_ig/T dT - R·ln(P/P_ref)
```

**SRK departure functions:**
```
Fugacity coefficient:
  ln(φ_i) = (b_i/b_mix)(Z - 1) - ln(Z - B)
           - (A/B) × [2Σ_j(x_j·a_ij)/a_mix - b_i/b_mix]
           × ln[(Z + B) / Z]

Enthalpy departure:
  (H - H_ig) = RT(Z - 1)
             + [T(da_mix/dT) - a_mix] / b_mix
             × ln[(Z + B) / Z]

Entropy departure (at constant T, P):
  (S - S_ig)_TP = R·ln(Z - B)
                + (da_mix/dT) / b_mix
                × ln[(Z + B) / Z]
```

**Common derived properties:**
```
Molar volume:  V = ZRT/P
Density:       ρ = MW / V
Compressibility factor: Z = PV/(RT)
```

---

## 4. Activity Coefficient Models

### 4.1 NRTL (Non-Random Two-Liquid)

```
ln(γ_i) = [Σ_j(τ_ji × G_ji × x_j) / Σ_k(G_ki × x_k)]
         + Σ_j{(x_j × G_ij / Σ_k(G_kj × x_k)) × [τ_ij - Σ_m(x_m × τ_mj × G_mj) / Σ_k(G_kj × x_k)]}

Where:
  G_ij = exp(-α_ij × τ_ij)
  τ_ij = a_ij + b_ij/T + c_ij × ln(T) + d_ij × T
  α_ij = α_ji (typically 0.2–0.47, commonly 0.3)
```

**Parameters needed per binary pair:** τ_ij, τ_ji, α_ij (stored in `binary_interaction_params` table)

### 4.2 UNIQUAC (Universal Quasi-Chemical)

```
ln(γ_i) = ln(γ_i^combinatorial) + ln(γ_i^residual)

Combinatorial:
  ln(γ_i^C) = ln(Φ_i/x_i) + (z/2)q_i × ln(θ_i/Φ_i) + l_i - (Φ_i/x_i)Σ_j(x_j × l_j)

  Φ_i = r_i × x_i / Σ(r_j × x_j)     (volume fraction)
  θ_i = q_i × x_i / Σ(q_j × x_j)     (surface fraction)
  l_i = (z/2)(r_i - q_i) - (r_i - 1)  (z = 10)

Residual:
  ln(γ_i^R) = q_i[1 - ln(Σ_j(θ_j × τ_ji)) - Σ_j(θ_j × τ_ij / Σ_k(θ_k × τ_kj))]

  τ_ij = exp(-Δu_ij / RT)
```

**Parameters needed:**
- Per component: r_i (volume), q_i (surface area) — from van der Waals group contributions
- Per binary pair: Δu_ij, Δu_ji (energy interaction parameters)

### 4.3 Wilson

```
ln(γ_i) = 1 - ln(Σ_j x_j × Λ_ij) - Σ_k [x_k × Λ_ki / Σ_j(x_j × Λ_kj)]

Λ_ij = (V_j^L / V_i^L) × exp[-(λ_ij - λ_ii) / RT]
```

**Limitation:** Cannot predict liquid-liquid equilibrium. Use NRTL for LLE.

---

## 5. Flash Calculations

### 5.1 PT Flash (Rachford-Rice)

Given: T, P, overall composition z_i
Find: Vapor fraction β, vapor composition y_i, liquid composition x_i

```
Algorithm:
1. Estimate K-values:
   K_i = (Pc_i / P) × exp[5.373(1 + ω_i)(1 - Tc_i/T)]  (Wilson correlation)

2. Check phase:
   If Σ z_i × K_i < 1 → subcooled liquid (β = 0)
   If Σ z_i / K_i < 1 → superheated vapor (β = 1)
   Otherwise → two-phase

3. Solve Rachford-Rice equation for β:
   f(β) = Σ z_i(K_i - 1) / [1 + β(K_i - 1)] = 0
   Use Brent's method or Newton-Raphson

4. Update compositions:
   x_i = z_i / [1 + β(K_i - 1)]
   y_i = K_i × x_i

5. Update K-values from fugacity coefficients:
   K_i = φ_i^L / φ_i^V

6. Repeat steps 3–5 until |K_new - K_old| / K_old < tolerance (1e-10)
```

**Convergence criteria:**
- Max iterations: 100
- K-value tolerance: 1 × 10⁻¹⁰
- Rachford-Rice tolerance: 1 × 10⁻¹²

### 5.2 Bubble / Dew Point

**Bubble point pressure (given T):**
```
P_bubble = Σ x_i × γ_i × P_sat_i   (activity model)
P_bubble: Σ x_i × φ_i^L / φ_i^V = 1  (EOS model, iterative)
```

**Dew point pressure (given T):**
```
1/P_dew = Σ y_i / (γ_i × P_sat_i)   (activity model)
P_dew: Σ y_i × φ_i^V / φ_i^L = 1    (EOS model, iterative)
```

### 5.3 Phase Envelope Tracer

Uses the method of Michelsen (1980):
1. Start at a known bubble or dew point
2. Step along the envelope using a parametric continuation method
3. Switch independent variable near the cricondentherm/cricondenbar
4. Detect the mixture critical point where liquid and vapor compositions converge

---

## 6. Pure Component Property Correlations

All temperature-dependent properties use DIPPR-style polynomial forms:

### Vapor Pressure (Antoine / Wagner)

```
DIPPR 101: ln(Pvap) = A + B/T + C×ln(T) + D×T^E
Valid range: T_triple to T_critical
```

### Liquid Density

```
DIPPR 105: ρ_L = A / B^[1 + (1 - T/C)^D]     (Rackett modification)
```

### Ideal Gas Heat Capacity

```
DIPPR 107: Cp_ig = A + B[(C/T)/sinh(C/T)]² + D[(E/T)/cosh(E/T)]²
```

### Liquid Viscosity

```
DIPPR 101: ln(μ_L) = A + B/T + C×ln(T) + D×T^E
```

### Vapor Viscosity

```
DIPPR 102: μ_V = A×T^B / (1 + C/T + D/T²)
```

### Liquid Thermal Conductivity

```
DIPPR 100: k_L = A + B×T + C×T² + D×T³ + E×T⁴
```

### Heat of Vaporization

```
DIPPR 106: ΔH_vap = A × (1 - Tr)^(B + C×Tr + D×Tr² + E×Tr³)
Note: Tr = T/Tc — the critical temperature must be supplied separately
(not encoded in the ABCDE coefficients). See implementation note in
COMPONENT_DB_SCHEMA.sql. The E×Tr³ term is zero for many compounds
but must be supported for generality.
```

### Surface Tension

```
DIPPR 106: σ = A × (1 - Tr)^(B + C×Tr + D×Tr² + E×Tr³)
Note: Same Tc requirement and E×Tr³ note as heat of vaporization above.
```

---

## 7. Mixture Property Methods

### Transport Properties

**Liquid viscosity (mixture):**
- Grunberg-Nissan: ln(μ_mix) = Σ x_i × ln(μ_i) + ΣΣ x_i × x_j × d_ij

**Vapor viscosity (mixture):**
- Wilke method: μ_mix = Σ [x_i × μ_i / Σ(x_j × Φ_ij)]

**Liquid thermal conductivity (mixture):**
- Li method: k_mix = ΣΣ Φ_i × Φ_j × 2/(1/k_i + 1/k_j)

**Surface tension (mixture):**
- Macleod-Sugden: σ^(1/4) = Σ [P_i] × (x_i × ρ_L/M_L - y_i × ρ_V/M_V)
  where M_L, M_V are the liquid and vapor phase molecular weights respectively
  (each phase has different composition and thus different MW)

---

## 8. JSON Schemas

### 8.1 PT Flash Input

```json
{
  "components": [
    { "name": "methane", "cas": "74-82-8", "mole_fraction": 0.70 },
    { "name": "ethane", "cas": "74-84-0", "mole_fraction": 0.15 },
    { "name": "propane", "cas": "74-98-6", "mole_fraction": 0.10 },
    { "name": "n-butane", "cas": "106-97-8", "mole_fraction": 0.05 }
  ],
  "temperature": { "value": -30.0, "unit": "°C" },
  "pressure": { "value": 30.0, "unit": "bar" },
  "thermo_model": "PENG_ROBINSON",
  "properties_requested": ["density", "viscosity", "specific_heat", "thermal_conductivity", "compressibility", "enthalpy", "entropy"],
  "units_preference": "SI"
}
```

### 8.2 PT Flash Output

> **IMPLEMENTATION NOTE:** The numerical values below illustrate the output JSON
> **structure and field names only**. They are placeholder values assembled for
> schema documentation purposes and are **not** the output of a converged PR flash.
> Before using this document as a test reference, regenerate all values from a
> validated flash engine. Known inconsistencies in the placeholder data include:
> K-values that do not match y_i/x_i, molecular weights that do not match
> compositions, and compressibility factors inconsistent with molar volumes.

```json
{
  "calc_id": "uuid-string",
  "status": "success",
  "convergence": {
    "iterations": 8,
    "k_value_tolerance": 2.3e-11,
    "converged": true
  },

  "phase_result": "two_phase",
  "vapor_fraction": 0.823,
  "liquid_fraction": 0.177,

  "vapor_phase": {
    "composition": [
      { "name": "methane", "mole_fraction": 0.8012 },
      { "name": "ethane", "mole_fraction": 0.1289 },
      { "name": "propane", "mole_fraction": 0.0534 },
      { "name": "n-butane", "mole_fraction": 0.0165 }
    ],
    "properties": {
      "density": { "value": 32.5, "unit": "kg/m³" },
      "molar_volume": { "value": 5.62e-4, "unit": "m³/mol" },
      "compressibility": 0.842,
      "viscosity": { "value": 1.02e-5, "unit": "Pa·s" },
      "specific_heat_cp": { "value": 2.45, "unit": "kJ/(kg·K)" },
      "thermal_conductivity": { "value": 0.032, "unit": "W/(m·K)" },
      "enthalpy": { "value": -4520, "unit": "J/mol" },
      "entropy": { "value": -28.3, "unit": "J/(mol·K)" },
      "molecular_weight": { "value": 20.04, "unit": "g/mol" }
    },
    "k_values": [3.15, 0.54, 0.17, 0.087],
    "fugacity_coefficients": [0.812, 0.785, 0.725, 0.660]
  },

  "liquid_phase": {
    "composition": [
      { "name": "methane", "mole_fraction": 0.2544 },
      { "name": "ethane", "mole_fraction": 0.2367 },
      { "name": "propane", "mole_fraction": 0.3189 },
      { "name": "n-butane", "mole_fraction": 0.1900 }
    ],
    "properties": {
      "density": { "value": 462.0, "unit": "kg/m³" },
      "molar_volume": { "value": 8.45e-5, "unit": "m³/mol" },
      "compressibility": 0.125,
      "viscosity": { "value": 1.35e-4, "unit": "Pa·s" },
      "specific_heat_cp": { "value": 2.82, "unit": "kJ/(kg·K)" },
      "thermal_conductivity": { "value": 0.098, "unit": "W/(m·K)" },
      "surface_tension": { "value": 0.0085, "unit": "N/m" },
      "enthalpy": { "value": -18200, "unit": "J/mol" },
      "entropy": { "value": -85.2, "unit": "J/(mol·K)" },
      "molecular_weight": { "value": 36.30, "unit": "g/mol" }
    },
    "fugacity_coefficients": [2.560, 1.208, 0.495, 0.198]
  },

  "thermo_model_used": "PENG_ROBINSON",
  "binary_kij_matrix": [
    [0.0000, 0.0026, 0.0140, 0.0133],
    [0.0026, 0.0000, 0.0011, 0.0096],
    [0.0140, 0.0011, 0.0000, 0.0033],
    [0.0133, 0.0096, 0.0033, 0.0000]
  ]
}
```

### 8.3 Phase Envelope Input/Output

**Input:**
```json
{
  "components": [
    { "name": "methane", "cas": "74-82-8", "mole_fraction": 0.85 },
    { "name": "ethane", "cas": "74-84-0", "mole_fraction": 0.10 },
    { "name": "propane", "cas": "74-98-6", "mole_fraction": 0.05 }
  ],
  "thermo_model": "PENG_ROBINSON",
  "number_of_points": 100,
  "units_preference": "SI"
}
```

**Output:**
```json
{
  "calc_id": "uuid-string",
  "status": "success",

  "units": { "temperature": "°C", "pressure": "bar" },

  "bubble_curve": [
    { "temperature": -159.0, "pressure": 1.013 },
    { "temperature": -140.0, "pressure": 5.2 },
    "...100 points..."
  ],
  "dew_curve": [
    { "temperature": -105.0, "pressure": 1.013 },
    { "temperature": -95.0, "pressure": 3.5 },
    "...100 points..."
  ],
  "critical_point": {
    "temperature": { "value": -68.2, "unit": "°C" },
    "pressure": { "value": 52.8, "unit": "bar" }
  },
  "cricondentherm": {
    "temperature": { "value": -55.3, "unit": "°C" },
    "pressure": { "value": 48.1, "unit": "bar" }
  },
  "cricondenbar": {
    "temperature": { "value": -72.0, "unit": "°C" },
    "pressure": { "value": 55.2, "unit": "bar" }
  }
}
```

---

## 9. Validation Strategy

All thermodynamic calculations must pass automated regression tests against:

| Source | Data Type | Tolerance |
|---|---|---|
| NIST WebBook | Pure component Pvap, ρ, Cp | ±1% |
| NIST TDE | Mixture VLE (K-values) | ±5% |
| DIPPR 801 | Correlation coefficients (direct match) | Exact |
| Smith, Van Ness & Abbott (8th Ed.) | Textbook examples (flash, bubble/dew) | ±0.1% |
| Prausnitz et al. (Molecular Thermo) | Activity coefficient reference values | ±2% |
| CoolProp (NIST backend) | Cross-validation for pure component properties | ±1% |

**Test suite structure:**
```
tests/
├── thermo/
│   ├── test_peng_robinson.py         # 50+ test cases
│   ├── test_srk.py                   # 30+ test cases
│   ├── test_nrtl.py                  # 40+ test cases (including LLE)
│   ├── test_uniquac.py               # 30+ test cases
│   ├── test_pt_flash.py              # 25+ systems (light gas to heavy oil)
│   ├── test_bubble_dew.py            # 20+ binary and multicomponent
│   ├── test_phase_envelope.py        # 10+ mixture envelopes
│   ├── test_pure_properties.py       # All 500 components × 6 properties
│   └── test_transport_properties.py  # Viscosity, conductivity validation
```

---

*This specification ensures that all downstream engineering modules receive thermodynamically consistent and validated physical properties.*
