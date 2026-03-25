-- ============================================================
-- Expediente Médico - Schema conforme a NOM-004-SSA3-2012
-- Supabase (PostgreSQL)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tabla: establecimientos (NOM-004 §5.2.1)
-- ============================================================
CREATE TABLE establecimientos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) NOT NULL, -- consultorio, hospital, clínica
  nombre VARCHAR(255) NOT NULL,
  domicilio TEXT NOT NULL,
  institucion VARCHAR(255),
  razon_social VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabla: medicos (profesionales de salud)
-- ============================================================
CREATE TABLE medicos (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(255) NOT NULL,
  cedula_profesional VARCHAR(50) NOT NULL UNIQUE,
  especialidad VARCHAR(100),
  establecimiento_id UUID REFERENCES establecimientos(id),
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Tabla: pacientes (NOM-004 §5.2.3)
-- ============================================================
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_completo VARCHAR(255) NOT NULL,
  sexo VARCHAR(20) NOT NULL CHECK (sexo IN ('masculino', 'femenino', 'otro')),
  fecha_nacimiento DATE NOT NULL,
  edad INTEGER GENERATED ALWAYS AS (
    EXTRACT(YEAR FROM AGE(fecha_nacimiento))::INTEGER
  ) STORED,
  domicilio TEXT NOT NULL,
  grupo_etnico VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES medicos(id),
  updated_by UUID NOT NULL REFERENCES medicos(id)
);

-- ============================================================
-- Tabla: expedientes (NOM-004 §4.4 - expediente clínico)
-- ============================================================
CREATE TABLE expedientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  establecimiento_id UUID NOT NULL REFERENCES establecimientos(id),
  -- Historia clínica (NOM-004 §6.1)
  antecedentes_heredofamiliares TEXT,
  antecedentes_personales_patologicos TEXT,
  antecedentes_personales_no_patologicos TEXT,
  uso_tabaco TEXT,
  uso_alcohol TEXT,
  uso_otras_sustancias TEXT,
  -- Consentimiento
  consentimiento_informado BOOLEAN NOT NULL DEFAULT FALSE,
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES medicos(id),
  updated_by UUID NOT NULL REFERENCES medicos(id)
);

-- ============================================================
-- Tabla: notas_evolucion (NOM-004 §6.2)
-- ============================================================
CREATE TABLE notas_evolucion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id UUID NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
  -- Datos de la nota
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  -- Keywords originales (para auditoría de lo que escribió el médico)
  keywords_originales TEXT,
  -- Contenido estructurado (NOM-004 §6.2.1-6.2.6)
  padecimiento_actual TEXT NOT NULL,
  exploracion_fisica TEXT,
  -- Signos vitales (NOM-004 §6.2.2)
  signos_vitales JSONB DEFAULT '{}',
  -- Resultados de estudios (NOM-004 §6.2.3)
  resultados_estudios JSONB DEFAULT '[]',
  -- Diagnósticos con CIE-10 (NOM-004 §6.2.4)
  diagnosticos JSONB NOT NULL DEFAULT '[]',
  -- Pronóstico (NOM-004 §6.2.5)
  pronostico TEXT,
  -- Tratamiento (NOM-004 §6.2.6)
  indicaciones_terapeuticas JSONB DEFAULT '[]',
  -- Nota narrativa completa
  nota_narrativa TEXT,
  -- Validación NOM-004
  nom004_porcentaje INTEGER DEFAULT 0,
  nom004_campos_faltantes JSONB DEFAULT '[]',
  -- Firma digital (NOM-004 §5.10)
  firma_digital BOOLEAN NOT NULL DEFAULT FALSE,
  firmado_at TIMESTAMPTZ,
  -- Metadatos IA
  generado_por_ia BOOLEAN NOT NULL DEFAULT FALSE,
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES medicos(id),
  updated_by UUID NOT NULL REFERENCES medicos(id)
);

-- ============================================================
-- Tabla: audit_log (trazabilidad NOM-004 §5.10)
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  accion VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  usuario_id UUID NOT NULL REFERENCES medicos(id),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Catálogo CIE-10 (subset para MVP)
-- ============================================================
CREATE TABLE catalogo_cie10 (
  codigo VARCHAR(10) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  categoria VARCHAR(100)
);

-- Insertar diagnósticos comunes
INSERT INTO catalogo_cie10 (codigo, descripcion, categoria) VALUES
  ('E11', 'Diabetes mellitus tipo 2', 'Enfermedades endocrinas'),
  ('E11.9', 'Diabetes mellitus tipo 2, sin complicaciones', 'Enfermedades endocrinas'),
  ('E66.9', 'Obesidad, no especificada', 'Enfermedades endocrinas'),
  ('I10', 'Hipertensión esencial (primaria)', 'Enfermedades del sistema circulatorio'),
  ('I25.9', 'Cardiopatía isquémica crónica, no especificada', 'Enfermedades del sistema circulatorio'),
  ('J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada', 'Enfermedades del sistema respiratorio'),
  ('J20.9', 'Bronquitis aguda, no especificada', 'Enfermedades del sistema respiratorio'),
  ('J45.9', 'Asma, no especificada', 'Enfermedades del sistema respiratorio'),
  ('J18.9', 'Neumonía, no especificada', 'Enfermedades del sistema respiratorio'),
  ('K29.7', 'Gastritis, no especificada', 'Enfermedades del aparato digestivo'),
  ('K21.0', 'Enfermedad por reflujo gastroesofágico con esofagitis', 'Enfermedades del aparato digestivo'),
  ('K59.0', 'Estreñimiento', 'Enfermedades del aparato digestivo'),
  ('N39.0', 'Infección de vías urinarias, sitio no especificado', 'Enfermedades del aparato genitourinario'),
  ('M54.5', 'Lumbago no especificado', 'Enfermedades del sistema osteomuscular'),
  ('M79.3', 'Paniculitis, no especificada', 'Enfermedades del sistema osteomuscular'),
  ('R51', 'Cefalea', 'Síntomas y signos'),
  ('R50.9', 'Fiebre, no especificada', 'Síntomas y signos'),
  ('R10.4', 'Otros dolores abdominales y los no especificados', 'Síntomas y signos'),
  ('R42', 'Mareo y desvanecimiento', 'Síntomas y signos'),
  ('F41.1', 'Trastorno de ansiedad generalizada', 'Trastornos mentales'),
  ('F32.9', 'Episodio depresivo, no especificado', 'Trastornos mentales'),
  ('F51.0', 'Insomnio no orgánico', 'Trastornos mentales'),
  ('L30.9', 'Dermatitis, no especificada', 'Enfermedades de la piel'),
  ('H10.9', 'Conjuntivitis, no especificada', 'Enfermedades del ojo'),
  ('B34.9', 'Infección viral, no especificada', 'Enfermedades infecciosas'),
  ('A09', 'Diarrea y gastroenteritis de presunto origen infeccioso', 'Enfermedades infecciosas'),
  ('J02.9', 'Faringitis aguda, no especificada', 'Enfermedades del sistema respiratorio'),
  ('J03.9', 'Amigdalitis aguda, no especificada', 'Enfermedades del sistema respiratorio'),
  ('O14.0', 'Preeclampsia moderada', 'Embarazo, parto y puerperio'),
  ('O13', 'Hipertensión gestacional sin proteinuria significativa', 'Embarazo, parto y puerperio'),
  ('Z00.0', 'Examen médico general', 'Factores que influyen en el estado de salud');

-- ============================================================
-- Índices para rendimiento
-- ============================================================
CREATE INDEX idx_pacientes_nombre ON pacientes(nombre_completo);
CREATE INDEX idx_pacientes_created_by ON pacientes(created_by);
CREATE INDEX idx_expedientes_paciente ON expedientes(paciente_id);
CREATE INDEX idx_expedientes_created_by ON expedientes(created_by);
CREATE INDEX idx_notas_expediente ON notas_evolucion(expediente_id);
CREATE INDEX idx_notas_fecha ON notas_evolucion(fecha DESC);
CREATE INDEX idx_notas_created_by ON notas_evolucion(created_by);
CREATE INDEX idx_audit_registro ON audit_log(tabla, registro_id);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_id);
CREATE INDEX idx_cie10_descripcion ON catalogo_cie10 USING gin(to_tsvector('spanish', descripcion));

-- ============================================================
-- Row Level Security (RLS) - Seguridad NOM-004 §5.5
-- ============================================================
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_evolucion ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas: cada médico solo ve los pacientes que él creó
CREATE POLICY "Médicos ven sus pacientes"
  ON pacientes FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Médicos crean pacientes"
  ON pacientes FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Médicos actualizan sus pacientes"
  ON pacientes FOR UPDATE
  USING (created_by = auth.uid());

-- Políticas para expedientes
CREATE POLICY "Médicos ven sus expedientes"
  ON expedientes FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Médicos crean expedientes"
  ON expedientes FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Médicos actualizan sus expedientes"
  ON expedientes FOR UPDATE
  USING (created_by = auth.uid());

-- Políticas para notas de evolución
CREATE POLICY "Médicos ven sus notas"
  ON notas_evolucion FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Médicos crean notas"
  ON notas_evolucion FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Médicos actualizan sus notas"
  ON notas_evolucion FOR UPDATE
  USING (created_by = auth.uid());

-- Catálogo CIE-10 es público (lectura)
ALTER TABLE catalogo_cie10 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CIE-10 lectura pública"
  ON catalogo_cie10 FOR SELECT
  USING (true);

-- ============================================================
-- Triggers para audit trail automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_pacientes
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_expedientes
  BEFORE UPDATE ON expedientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_notas
  BEFORE UPDATE ON notas_evolucion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
