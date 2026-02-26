-- ============================================================================
-- ChemScale Component Database Schema
-- PostgreSQL 16+
-- ============================================================================
-- This schema stores pure component properties, temperature-dependent
-- correlations (DIPPR-style), binary interaction parameters, and material
-- compatibility data required by the Thermodynamic Engine and all
-- engineering modules.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PURE COMPONENT CONSTANTS
-- ============================================================================

CREATE TABLE components (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    cas_number      VARCHAR(20) UNIQUE NOT NULL,       -- e.g., '74-82-8'
    formula         VARCHAR(100),                       -- e.g., 'CH4'
    smiles          VARCHAR(500),                       -- SMILES notation
    iupac_name      VARCHAR(300),
    common_names    TEXT[],                             -- array of aliases
    family          VARCHAR(100),                       -- e.g., 'alkane', 'aromatic', 'amine'

    -- Critical properties
    tc_k            DOUBLE PRECISION NOT NULL,          -- Critical temperature [K]
    pc_pa           DOUBLE PRECISION NOT NULL,          -- Critical pressure [Pa]
    vc_m3mol        DOUBLE PRECISION,                   -- Critical volume [m³/mol]
    zc              DOUBLE PRECISION,                   -- Critical compressibility factor [-]
    acentric_factor DOUBLE PRECISION NOT NULL,          -- Pitzer acentric factor ω [-]

    -- Basic physical properties
    molecular_weight DOUBLE PRECISION NOT NULL,         -- [g/mol]
    normal_bp_k     DOUBLE PRECISION,                   -- Normal boiling point [K]
    normal_mp_k     DOUBLE PRECISION,                   -- Normal melting point [K]
    triple_point_t_k DOUBLE PRECISION,                  -- Triple point temperature [K]
    triple_point_p_pa DOUBLE PRECISION,                 -- Triple point pressure [Pa]

    -- Polarity and association
    dipole_moment_cm DOUBLE PRECISION DEFAULT 0.0,      -- Dipole moment [C·m] (×3.336e-30 for Debye)
    radius_of_gyration_m DOUBLE PRECISION,              -- [m]
    solubility_parameter DOUBLE PRECISION,              -- Hildebrand [Pa^0.5]

    -- UNIQUAC parameters (pure component)
    uniquac_r       DOUBLE PRECISION,                   -- Volume parameter
    uniquac_q       DOUBLE PRECISION,                   -- Surface area parameter
    uniquac_q_prime DOUBLE PRECISION,                   -- Modified q for UNIFAC

    -- Standard state
    hf_ig_jmol      DOUBLE PRECISION,                   -- Std heat of formation (ideal gas) [J/mol]
    gf_ig_jmol      DOUBLE PRECISION,                   -- Std Gibbs energy of formation [J/mol]
    sf_ig_jmolK     DOUBLE PRECISION,                   -- Std entropy (ideal gas) [J/(mol·K)]

    -- Classification flags
    is_electrolyte  BOOLEAN DEFAULT FALSE,
    is_solid_at_25c BOOLEAN DEFAULT FALSE,
    is_gas_at_25c   BOOLEAN DEFAULT FALSE,

    -- Metadata
    data_source     VARCHAR(100) DEFAULT 'DIPPR_801',
    data_quality    VARCHAR(20) DEFAULT 'recommended',  -- recommended, estimated, predicted
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_components_cas ON components(cas_number);
CREATE INDEX idx_components_name ON components(name);
CREATE INDEX idx_components_family ON components(family);

-- Full-text search index for component lookup
CREATE INDEX idx_components_search ON components
    USING GIN (to_tsvector('english', name || ' ' || COALESCE(iupac_name, '') || ' ' || COALESCE(formula, '')));

-- ============================================================================
-- 2. TEMPERATURE-DEPENDENT CORRELATIONS
-- ============================================================================
-- Each correlation follows a DIPPR equation form.
-- The equation_number maps to a specific functional form.

CREATE TABLE property_correlations (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_id      UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    property_name     VARCHAR(50) NOT NULL,

    -- Property names:
    -- 'vapor_pressure'            [Pa]
    -- 'liquid_density'            [kmol/m³]
    -- 'heat_of_vaporization'      [J/kmol]
    -- 'ideal_gas_cp'              [J/(kmol·K)]
    -- 'liquid_viscosity'          [Pa·s]
    -- 'vapor_viscosity'           [Pa·s]
    -- 'liquid_thermal_conductivity' [W/(m·K)]
    -- 'vapor_thermal_conductivity'  [W/(m·K)]
    -- 'surface_tension'           [N/m]
    -- 'second_virial_coefficient' [m³/mol]

    equation_number   INTEGER NOT NULL,
    -- DIPPR equation forms:
    -- 100: Y = A + B*T + C*T^2 + D*T^3 + E*T^4
    -- 101: Y = exp(A + B/T + C*ln(T) + D*T^E)
    -- 102: Y = A*T^B / (1 + C/T + D/T^2)
    -- 105: Y = A / B^(1 + (1-T/C)^D)
    -- 106: Y = A * (1-Tr)^(B + C*Tr + D*Tr^2)
    -- 107: Y = A + B*((C/T)/sinh(C/T))^2 + D*((E/T)/cosh(E/T))^2

    coeff_a           DOUBLE PRECISION NOT NULL,
    coeff_b           DOUBLE PRECISION,
    coeff_c           DOUBLE PRECISION,
    coeff_d           DOUBLE PRECISION,
    coeff_e           DOUBLE PRECISION,

    t_min_k           DOUBLE PRECISION NOT NULL,        -- Minimum valid temperature [K]
    t_max_k           DOUBLE PRECISION NOT NULL,        -- Maximum valid temperature [K]
    result_unit       VARCHAR(30) NOT NULL,              -- Unit of the calculated property

    data_source       VARCHAR(100) DEFAULT 'DIPPR_801',
    data_quality      VARCHAR(20) DEFAULT 'recommended',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_correlations_component ON property_correlations(component_id);
CREATE INDEX idx_correlations_property ON property_correlations(property_name);
-- Note: A component may have multiple correlations for the same property with
-- different temperature ranges (e.g., low-T and high-T vapor pressure).
-- The unique constraint includes t_min_k to allow this.
CREATE UNIQUE INDEX idx_correlations_unique
    ON property_correlations(component_id, property_name, equation_number, t_min_k);

-- ============================================================================
-- 3. BINARY INTERACTION PARAMETERS
-- ============================================================================

CREATE TABLE binary_interaction_params (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_1_id    UUID NOT NULL REFERENCES components(id),
    component_2_id    UUID NOT NULL REFERENCES components(id),
    model             VARCHAR(30) NOT NULL,
    -- Models: 'PR', 'SRK', 'NRTL', 'UNIQUAC', 'WILSON'

    -- EOS binary interaction parameter (kij)
    kij               DOUBLE PRECISION,                  -- Symmetric: kij = kji

    -- NRTL parameters
    nrtl_tau_12       DOUBLE PRECISION,                  -- τ₁₂ = a₁₂ + b₁₂/T
    nrtl_tau_21       DOUBLE PRECISION,                  -- τ₂₁ = a₂₁ + b₂₁/T
    nrtl_tau_12_b     DOUBLE PRECISION,                  -- b₁₂ (temperature dependent)
    nrtl_tau_21_b     DOUBLE PRECISION,                  -- b₂₁ (temperature dependent)
    nrtl_alpha        DOUBLE PRECISION DEFAULT 0.3,      -- Non-randomness parameter

    -- UNIQUAC parameters
    uniquac_du_12     DOUBLE PRECISION,                  -- Δu₁₂ [J/mol]
    uniquac_du_21     DOUBLE PRECISION,                  -- Δu₂₁ [J/mol]

    -- Wilson parameters
    wilson_lambda_12  DOUBLE PRECISION,                  -- Λ₁₂
    wilson_lambda_21  DOUBLE PRECISION,                  -- Λ₂₁

    -- Temperature range of validity
    t_min_k           DOUBLE PRECISION,
    t_max_k           DOUBLE PRECISION,
    p_min_pa          DOUBLE PRECISION,
    p_max_pa          DOUBLE PRECISION,

    data_source       VARCHAR(200),                      -- Publication or database reference
    data_quality      VARCHAR(20) DEFAULT 'experimental', -- experimental, correlated, predicted
    created_at        TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure canonical ordering to avoid duplicate pairs stored both ways.
    -- We compare the text representation of UUIDs. The application layer must
    -- enforce this ordering before INSERT (swap if component_1_id > component_2_id).
    -- Alternative: use a trigger or generated column based on CAS number ordering.
    CONSTRAINT chk_component_order CHECK (component_1_id::text < component_2_id::text),
    CONSTRAINT uq_binary_pair UNIQUE (component_1_id, component_2_id, model)
);

CREATE INDEX idx_binary_comp1 ON binary_interaction_params(component_1_id);
CREATE INDEX idx_binary_comp2 ON binary_interaction_params(component_2_id);
CREATE INDEX idx_binary_model ON binary_interaction_params(model);

-- ============================================================================
-- 4. MATERIAL OF CONSTRUCTION DATABASE
-- ============================================================================

CREATE TABLE materials (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                  VARCHAR(200) NOT NULL,
    specification         VARCHAR(100),                   -- e.g., 'SA-516 Gr.70', 'SA-240 TP316L'
    uns_number            VARCHAR(20),                    -- e.g., 'K02700', 'S31603'
    material_class        VARCHAR(50) NOT NULL,
    -- Classes: 'carbon_steel', 'low_alloy_steel', 'stainless_austenitic',
    --          'stainless_duplex', 'nickel_alloy', 'titanium', 'copper_alloy',
    --          'aluminum', 'non_metallic'

    -- Mechanical properties (at ambient)
    yield_strength_mpa    DOUBLE PRECISION,
    tensile_strength_mpa  DOUBLE PRECISION,
    elongation_percent    DOUBLE PRECISION,
    hardness_brinell      DOUBLE PRECISION,
    density_kgm3          DOUBLE PRECISION,

    -- Corrosion resistance indicators
    pren                  DOUBLE PRECISION,               -- Pitting Resistance Equivalent Number
    max_service_temp_k    DOUBLE PRECISION,               -- Maximum continuous service temperature
    min_service_temp_k    DOUBLE PRECISION,               -- Minimum (MDMT) before impact testing

    -- NACE compliance
    nace_mr0175_compliant BOOLEAN DEFAULT FALSE,
    max_hardness_hrc_sour INTEGER,                        -- Per NACE MR0175

    -- Cost index (relative to carbon steel = 1.0)
    relative_cost_factor  DOUBLE PRECISION DEFAULT 1.0,

    created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ALLOWABLE STRESS TABLE (ASME SEC II PART D)
-- ============================================================================

CREATE TABLE allowable_stress (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id       UUID NOT NULL REFERENCES materials(id),
    temperature_k     DOUBLE PRECISION NOT NULL,
    allowable_stress_mpa DOUBLE PRECISION NOT NULL,      -- Section II, Part D, Table 1A
    data_source       VARCHAR(100) DEFAULT 'ASME_II_D_2023',

    CONSTRAINT uq_stress_point UNIQUE (material_id, temperature_k)
);

CREATE INDEX idx_stress_material ON allowable_stress(material_id);

-- ============================================================================
-- 6. CHEMICAL COMPATIBILITY MATRIX
-- ============================================================================

CREATE TABLE chemical_compatibility (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component_id      UUID NOT NULL REFERENCES components(id),
    material_id       UUID NOT NULL REFERENCES materials(id),
    temperature_k     DOUBLE PRECISION,                   -- At this temperature
    concentration      DOUBLE PRECISION,                   -- Weight percent (if applicable)

    rating            VARCHAR(1) NOT NULL,
    -- 'A' = Excellent (< 0.05 mm/yr)
    -- 'B' = Good (0.05–0.5 mm/yr)
    -- 'C' = Fair (0.5–1.3 mm/yr)
    -- 'D' = Not recommended (> 1.3 mm/yr)

    corrosion_rate_mmyr DOUBLE PRECISION,                 -- Measured/estimated rate [mm/yr]
    notes             TEXT,
    data_source       VARCHAR(200),

    CONSTRAINT uq_compatibility UNIQUE (component_id, material_id, temperature_k, concentration)
);

-- ============================================================================
-- 7. EQUIPMENT COST CORRELATIONS
-- ============================================================================

CREATE TABLE cost_correlations (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type    VARCHAR(100) NOT NULL,
    equipment_subtype VARCHAR(100),                       -- e.g., 'floating_head', 'fixed_tube'

    -- Turton correlation: log10(Cp0) = K1 + K2*log10(A) + K3*(log10(A))^2
    k1                DOUBLE PRECISION NOT NULL,
    k2                DOUBLE PRECISION NOT NULL,
    k3                DOUBLE PRECISION NOT NULL,

    -- Pressure factor: log10(Fp) = C1 + C2*log10(P) + C3*(log10(P))^2
    c1                DOUBLE PRECISION DEFAULT 0.0,
    c2                DOUBLE PRECISION DEFAULT 0.0,
    c3                DOUBLE PRECISION DEFAULT 0.0,

    -- Bare module factor: CBM = Cp0 * (B1 + B2*FM*FP)
    b1                DOUBLE PRECISION,
    b2                DOUBLE PRECISION,

    -- Size range
    size_parameter    VARCHAR(50) NOT NULL,               -- 'area_m2', 'power_kW', 'weight_kg'
    size_min          DOUBLE PRECISION NOT NULL,
    size_max          DOUBLE PRECISION NOT NULL,

    -- Pressure range for Fp correlation
    pressure_min_barg DOUBLE PRECISION,
    pressure_max_barg DOUBLE PRECISION,

    base_year         INTEGER NOT NULL DEFAULT 2018,
    base_cepci        DOUBLE PRECISION NOT NULL DEFAULT 603.1,
    data_source       VARCHAR(200) DEFAULT 'Turton_2018',

    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_equipment_type ON cost_correlations(equipment_type);

-- ============================================================================
-- 8. MATERIAL FACTORS FOR COST ESTIMATION
-- ============================================================================

CREATE TABLE material_factors (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_type    VARCHAR(100) NOT NULL,
    material_class    VARCHAR(50) NOT NULL,               -- Matches materials.material_class
    factor_fm         DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    data_source       VARCHAR(200) DEFAULT 'Turton_2018',

    CONSTRAINT uq_material_factor UNIQUE (equipment_type, material_class)
);

-- ============================================================================
-- 9. CEPCI HISTORICAL DATA
-- ============================================================================

CREATE TABLE cepci_index (
    year              INTEGER PRIMARY KEY,
    annual_index      DOUBLE PRECISION NOT NULL,
    equipment_index   DOUBLE PRECISION,
    construction_index DOUBLE PRECISION,
    engineering_index DOUBLE PRECISION,
    data_source       VARCHAR(100) DEFAULT 'Chemical Engineering Magazine'
);

-- Seed data: recent CEPCI values
INSERT INTO cepci_index (year, annual_index) VALUES
    (2000, 394.1),
    (2005, 468.2),
    (2010, 550.8),
    (2015, 556.8),
    (2016, 541.7),
    (2017, 567.5),
    (2018, 603.1),
    (2019, 607.5),
    (2020, 596.2),
    (2021, 708.8),
    (2022, 816.0),
    (2023, 797.9),
    (2024, 810.0),
    (2025, 822.0),
    (2026, 830.0);

-- ============================================================================
-- 10. PROJECT & CALCULATION TRACKING
-- ============================================================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    owner_id        UUID NOT NULL,                       -- References auth service user
    company         VARCHAR(200),
    project_number  VARCHAR(50),

    -- Default preferences
    unit_system     VARCHAR(20) DEFAULT 'SI',            -- SI, US_CUSTOMARY, CGS
    thermo_model    VARCHAR(30) DEFAULT 'PENG_ROBINSON',
    currency        VARCHAR(3) DEFAULT 'USD',

    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calculations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id),
    module          VARCHAR(50) NOT NULL,                 -- 'heat_exchanger', 'pipe_sizing', etc.
    endpoint        VARCHAR(100) NOT NULL,                -- '/design', '/rate', '/estimate'
    tag             VARCHAR(50),                          -- Equipment tag (e.g., 'E-1001')

    -- Full input/output stored as JSONB for audit trail
    input_json      JSONB NOT NULL,
    output_json     JSONB,

    status          VARCHAR(20) DEFAULT 'pending',       -- pending, running, success, failed
    error_message   TEXT,

    -- Versioning
    engine_version  VARCHAR(20),
    thermo_model    VARCHAR(30),
    standards_refs  TEXT[],                               -- Array of standards cited

    -- Timing
    compute_time_ms INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_calc_project ON calculations(project_id);
CREATE INDEX idx_calc_module ON calculations(module);
CREATE INDEX idx_calc_tag ON calculations(tag);
CREATE INDEX idx_calc_created ON calculations(created_at DESC);

-- ============================================================================
-- 11. EQUIPMENT LIST (PROJECT-LEVEL)
-- ============================================================================

CREATE TABLE equipment_list (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    tag             VARCHAR(50) NOT NULL,
    description     VARCHAR(300),
    equipment_type  VARCHAR(100) NOT NULL,
    service         VARCHAR(300),

    -- Link to latest calculation
    latest_calc_id  UUID REFERENCES calculations(id),

    -- Key sizing parameters (denormalized for quick access)
    sizing_summary  JSONB,                               -- e.g., {"area_m2": 132.5, "duty_kW": 3850}

    -- Material
    material_shell  VARCHAR(100),
    material_internals VARCHAR(100),

    -- Cost (from Module 12)
    estimated_cost  JSONB,                               -- {"bare_module_usd": 298800, "year": 2026}

    -- Status
    status          VARCHAR(30) DEFAULT 'preliminary',   -- preliminary, sized, checked, approved
    revision        INTEGER DEFAULT 0,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_equipment_tag UNIQUE (project_id, tag)
);

CREATE INDEX idx_equip_project ON equipment_list(project_id);

-- ============================================================================
-- 12. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Component search with key properties
CREATE VIEW v_component_summary AS
SELECT
    c.id,
    c.name,
    c.cas_number,
    c.formula,
    c.molecular_weight,
    c.tc_k,
    c.pc_pa / 1e5 AS pc_bar,
    c.acentric_factor,
    c.normal_bp_k,
    c.family,
    c.data_quality
FROM components c
ORDER BY c.name;

-- View: Equipment list with cost summary
CREATE VIEW v_equipment_with_cost AS
SELECT
    e.project_id,
    e.tag,
    e.description,
    e.equipment_type,
    e.service,
    e.sizing_summary,
    e.estimated_cost,
    e.status,
    p.name AS project_name
FROM equipment_list e
JOIN projects p ON p.id = e.project_id
ORDER BY e.tag;

-- ============================================================================
-- 13. FUNCTIONS
-- ============================================================================

-- Function: Evaluate a DIPPR correlation at a given temperature
-- Note: For DIPPR 106 (heat of vaporization, surface tension), the critical
-- temperature Tc must be passed as the p_tc parameter. For all other equations,
-- p_tc is ignored and can be NULL.
CREATE OR REPLACE FUNCTION eval_dippr(
    p_equation_number INTEGER,
    p_a DOUBLE PRECISION,
    p_b DOUBLE PRECISION,
    p_c DOUBLE PRECISION,
    p_d DOUBLE PRECISION,
    p_e DOUBLE PRECISION,
    p_t DOUBLE PRECISION,             -- Temperature in Kelvin
    p_tc DOUBLE PRECISION DEFAULT NULL -- Critical temperature [K], required for eq 106
) RETURNS DOUBLE PRECISION AS $$
DECLARE
    v_tr DOUBLE PRECISION;
BEGIN
    IF p_equation_number = 100 THEN
        -- Y = A + B*T + C*T^2 + D*T^3 + E*T^4
        RETURN p_a + p_b*p_t + p_c*p_t^2 + COALESCE(p_d,0)*p_t^3 + COALESCE(p_e,0)*p_t^4;

    ELSIF p_equation_number = 101 THEN
        -- Y = exp(A + B/T + C*ln(T) + D*T^E)
        RETURN exp(p_a + p_b/p_t + p_c*ln(p_t) + COALESCE(p_d,0)*p_t^COALESCE(p_e,0));

    ELSIF p_equation_number = 102 THEN
        -- Y = A*T^B / (1 + C/T + D/T^2)
        RETURN p_a * p_t^p_b / (1.0 + COALESCE(p_c,0)/p_t + COALESCE(p_d,0)/p_t^2);

    ELSIF p_equation_number = 105 THEN
        -- Y = A / B^(1 + (1-T/C)^D)   [Rackett-type liquid density]
        RETURN p_a / p_b^(1.0 + (1.0 - p_t/p_c)^p_d);

    ELSIF p_equation_number = 106 THEN
        -- Y = A * (1-Tr)^(B + C*Tr + D*Tr^2)
        -- Requires critical temperature (Tc) passed as p_tc
        IF p_tc IS NULL OR p_tc <= 0 THEN
            RAISE EXCEPTION 'DIPPR 106 requires critical temperature (p_tc) > 0, got: %', p_tc;
        END IF;
        v_tr := p_t / p_tc;
        IF v_tr >= 1.0 THEN
            RETURN 0.0;  -- At or above Tc, property (e.g., surface tension, Hvap) is zero
        END IF;
        RETURN p_a * (1.0 - v_tr)^(p_b + p_c*v_tr + COALESCE(p_d,0)*v_tr^2);

    ELSIF p_equation_number = 107 THEN
        -- Y = A + B*((C/T)/sinh(C/T))^2 + D*((E/T)/cosh(E/T))^2
        RETURN p_a + p_b*((p_c/p_t)/sinh(p_c/p_t))^2
             + COALESCE(p_d,0)*((COALESCE(p_e,0)/p_t)/cosh(COALESCE(p_e,0)/p_t))^2;

    ELSE
        RAISE EXCEPTION 'Unknown DIPPR equation number: %', p_equation_number;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- SEED: Example component (Methane)
-- ============================================================================

INSERT INTO components (
    name, cas_number, formula, smiles, iupac_name, family,
    tc_k, pc_pa, vc_m3mol, zc, acentric_factor,
    molecular_weight, normal_bp_k, normal_mp_k,
    dipole_moment_cm, uniquac_r, uniquac_q,
    hf_ig_jmol, gf_ig_jmol
) VALUES (
    'Methane', '74-82-8', 'CH4', 'C', 'methane', 'alkane',
    190.56, 4599000, 9.86e-5, 0.286, 0.0115,
    16.043, 111.66, 90.69,
    0.0, 1.1290, 1.1240,
    -74520, -50460
);

-- Methane ideal gas Cp (DIPPR 107)
INSERT INTO property_correlations (
    component_id, property_name, equation_number,
    coeff_a, coeff_b, coeff_c, coeff_d, coeff_e,
    t_min_k, t_max_k, result_unit
) VALUES (
    (SELECT id FROM components WHERE cas_number = '74-82-8'),
    'ideal_gas_cp', 107,
    33298, 79933, 2086.9, 41602, 991.96,
    50, 1500, 'J/(kmol·K)'
);

-- Methane vapor pressure (DIPPR 101)
INSERT INTO property_correlations (
    component_id, property_name, equation_number,
    coeff_a, coeff_b, coeff_c, coeff_d, coeff_e,
    t_min_k, t_max_k, result_unit
) VALUES (
    (SELECT id FROM components WHERE cas_number = '74-82-8'),
    'vapor_pressure', 101,
    39.205, -1324.4, -3.4366, 3.1019e-5, 2.0,
    90.69, 190.56, 'Pa'
);
