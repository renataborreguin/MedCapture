import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "expediente.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const fs = require("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- Médicos (simplificado para MVP)
    CREATE TABLE IF NOT EXISTS medicos (
      id TEXT PRIMARY KEY,
      nombre_completo TEXT NOT NULL,
      cedula_profesional TEXT NOT NULL UNIQUE,
      especialidad TEXT,
      email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Pacientes (NOM-004 §5.2.3)
    CREATE TABLE IF NOT EXISTS pacientes (
      id TEXT PRIMARY KEY,
      nombre_completo TEXT NOT NULL,
      sexo TEXT NOT NULL CHECK (sexo IN ('masculino','femenino','otro')),
      fecha_nacimiento TEXT NOT NULL,
      domicilio TEXT NOT NULL DEFAULT '',
      telefono TEXT,
      email TEXT,
      curp TEXT,
      alergias TEXT DEFAULT '',
      antecedentes_heredofamiliares TEXT DEFAULT '',
      antecedentes_patologicos TEXT DEFAULT '',
      antecedentes_no_patologicos TEXT DEFAULT '',
      antecedentes_quirurgicos TEXT DEFAULT '',
      contacto_emergencia TEXT DEFAULT '',
      telefono_emergencia TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT NOT NULL
    );

    -- Notas de evolución (NOM-004 §6.2)
    CREATE TABLE IF NOT EXISTS notas_evolucion (
      id TEXT PRIMARY KEY,
      paciente_id TEXT NOT NULL REFERENCES pacientes(id),
      fecha TEXT NOT NULL DEFAULT (date('now')),
      hora TEXT NOT NULL DEFAULT (time('now')),
      keywords_originales TEXT,
      padecimiento_actual TEXT NOT NULL,
      exploracion_fisica TEXT,
      signos_vitales TEXT DEFAULT '{}',
      diagnosticos TEXT NOT NULL DEFAULT '[]',
      pronostico TEXT,
      indicaciones_terapeuticas TEXT DEFAULT '[]',
      nota_narrativa TEXT,
      nom004_porcentaje INTEGER DEFAULT 0,
      generado_por_ia INTEGER NOT NULL DEFAULT 0,
      firma_digital INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_by TEXT NOT NULL
    );

    -- Catálogo CIE-10
    CREATE TABLE IF NOT EXISTS catalogo_cie10 (
      codigo TEXT PRIMARY KEY,
      descripcion TEXT NOT NULL,
      categoria TEXT
    );

    -- Snippets personalizados por médico
    CREATE TABLE IF NOT EXISTS snippets_personalizados (
      id TEXT PRIMARY KEY,
      medico_id TEXT NOT NULL REFERENCES medicos(id),
      atajo TEXT NOT NULL,
      texto TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(medico_id, atajo)
    );

    CREATE INDEX IF NOT EXISTS idx_pacientes_nombre ON pacientes(nombre_completo);
    CREATE INDEX IF NOT EXISTS idx_pacientes_created_by ON pacientes(created_by);
    CREATE INDEX IF NOT EXISTS idx_notas_paciente ON notas_evolucion(paciente_id);
    CREATE INDEX IF NOT EXISTS idx_notas_created ON notas_evolucion(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_cie10_desc ON catalogo_cie10(descripcion);
    CREATE INDEX IF NOT EXISTS idx_snippets_medico ON snippets_personalizados(medico_id);
  `);

  const count = db.prepare("SELECT COUNT(*) as n FROM catalogo_cie10").get() as { n: number };
  if (count.n === 0) {
    const insert = db.prepare(
      "INSERT INTO catalogo_cie10 (codigo, descripcion, categoria) VALUES (?, ?, ?)"
    );
    const seedMany = db.transaction((rows: [string, string, string][]) => {
      for (const row of rows) insert.run(...row);
    });
    seedMany(CIE10_SEED);
  }

  const docCount = db.prepare("SELECT COUNT(*) as n FROM medicos").get() as { n: number };
  if (docCount.n === 0) {
    db.prepare(
      "INSERT INTO medicos (id, nombre_completo, cedula_profesional, especialidad, email) VALUES (?, ?, ?, ?, ?)"
    ).run("demo-doc-1", "Dr. Demo García", "12345678", "Medicina General", "demo@expediente.local");
  }

  const patientCount = db.prepare("SELECT COUNT(*) as n FROM pacientes").get() as { n: number };
  if (patientCount.n === 0) {
    const insertPat = db.prepare(
      `INSERT INTO pacientes (id, nombre_completo, sexo, fecha_nacimiento, domicilio, telefono, curp,
        alergias, antecedentes_heredofamiliares, antecedentes_patologicos,
        antecedentes_no_patologicos, antecedentes_quirurgicos, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    insertPat.run("p1", "Ana García López", "femenino", "1983-03-15",
      "Calle 60 #234, Col. Centro, Mérida, Yucatán", "(999) 123 4567", "GALA830315MYNRCN09",
      "Latex, Ibuprofeno", "Diabetes (padre), Hipertensión (madre)",
      "Gastritis crónica desde 2019", "No fuma, alcohol social ocasional",
      "Apendicectomía 2015", "demo-doc-1");
    insertPat.run("p2", "Juan Pérez Martínez", "masculino", "1990-01-01",
      "Av. Itzáes #456, Col. Centro, Mérida", "(999) 555 1234", "PEMJ900101HYNRRN01",
      "Penicilina", "Hipertensión (abuelo paterno), Cáncer de colon (abuela materna)",
      "Fractura de tibia derecha 2018", "Exfumador (dejó en 2020), sedentario",
      "Reducción abierta de fractura tibial 2018", "demo-doc-1");
    insertPat.run("p3", "María López Hernández", "femenino", "1985-07-22",
      "Calle 45 #789, Col. San Marcos, Mérida", "(999) 888 4321", "LOHM850722MYNPRR05",
      "", "Asma (madre), Diabetes tipo 2 (padre)",
      "Migraña crónica desde 2017", "No fuma, no alcohol, ejercicio regular",
      "", "demo-doc-1");
  }

  const snippetCount = db.prepare("SELECT COUNT(*) as n FROM snippets_personalizados").get() as { n: number };
  if (snippetCount.n === 0) {
    const insertSnippet = db.prepare(
      "INSERT INTO snippets_personalizados (id, medico_id, atajo, texto, categoria) VALUES (?, ?, ?, ?, ?)"
    );
    const seedSnippets = db.transaction((rows: [string, string, string, string, string][]) => {
      for (const row of rows) insertSnippet.run(...row);
    });
    seedSnippets(SNIPPETS_SEED);
  }
}

const SNIPPETS_SEED: [string, string, string, string, string][] = [
  ["snip-1", "demo-doc-1", "#normal", "Sin alteraciones aparentes. Paciente consciente, orientado, cooperador, bien hidratado, con adecuada coloración de tegumentos.", "exploracion"],
  ["snip-2", "demo-doc-1", "#svsn", "Signos vitales dentro de parámetros normales.", "signos_vitales"],
  ["snip-3", "demo-doc-1", "#abdomen", "Abdomen blando, depresible, no doloroso a la palpación superficial ni profunda, sin visceromegalias, peristalsis presente.", "exploracion"],
  ["snip-4", "demo-doc-1", "#torax", "Tórax simétrico, campos pulmonares bien ventilados, sin estertores ni sibilancias. Ruidos cardiacos rítmicos, sin soplos.", "exploracion"],
  ["snip-5", "demo-doc-1", "#neuro", "Paciente consciente, alerta, orientado en tiempo, persona y espacio. Pares craneales sin alteraciones. Fuerza y sensibilidad conservadas en las cuatro extremidades.", "exploracion"],
  ["snip-6", "demo-doc-1", "#mgral", "Medidas generales: dieta blanda, abundantes líquidos, reposo relativo, evitar cambios bruscos de temperatura.", "indicaciones"],
  ["snip-7", "demo-doc-1", "#cita", "Se agenda cita de seguimiento en 2 semanas. Acudir antes si presenta datos de alarma.", "indicaciones"],
  ["snip-8", "demo-doc-1", "#alarma", "Se explican datos de alarma: fiebre persistente mayor a 38.5°C, dificultad respiratoria, dolor torácico, deterioro del estado general. En caso de presentar alguno, acudir a urgencias.", "indicaciones"],
];

const CIE10_SEED: [string, string, string][] = [
  ["E11", "Diabetes mellitus tipo 2", "Enfermedades endocrinas"],
  ["E11.9", "Diabetes mellitus tipo 2, sin complicaciones", "Enfermedades endocrinas"],
  ["E66.9", "Obesidad, no especificada", "Enfermedades endocrinas"],
  ["I10", "Hipertensión esencial (primaria)", "Enfermedades del sistema circulatorio"],
  ["J06.9", "Infección aguda de vías respiratorias superiores, no especificada", "Enfermedades del sistema respiratorio"],
  ["J20.9", "Bronquitis aguda, no especificada", "Enfermedades del sistema respiratorio"],
  ["J45.9", "Asma, no especificada", "Enfermedades del sistema respiratorio"],
  ["J18.9", "Neumonía, no especificada", "Enfermedades del sistema respiratorio"],
  ["K29.7", "Gastritis, no especificada", "Enfermedades del aparato digestivo"],
  ["K21.0", "Enfermedad por reflujo gastroesofágico con esofagitis", "Enfermedades del aparato digestivo"],
  ["N39.0", "Infección de vías urinarias, sitio no especificado", "Enfermedades del aparato genitourinario"],
  ["M54.5", "Lumbago no especificado", "Enfermedades del sistema osteomuscular"],
  ["R51", "Cefalea", "Síntomas y signos"],
  ["R50.9", "Fiebre, no especificada", "Síntomas y signos"],
  ["R10.4", "Otros dolores abdominales y los no especificados", "Síntomas y signos"],
  ["F41.1", "Trastorno de ansiedad generalizada", "Trastornos mentales"],
  ["F32.9", "Episodio depresivo, no especificado", "Trastornos mentales"],
  ["A09", "Diarrea y gastroenteritis de presunto origen infeccioso", "Enfermedades infecciosas"],
  ["J02.9", "Faringitis aguda, no especificada", "Enfermedades del sistema respiratorio"],
  ["J03.9", "Amigdalitis aguda, no especificada", "Enfermedades del sistema respiratorio"],
  ["O14.0", "Preeclampsia moderada", "Embarazo, parto y puerperio"],
  ["Z00.0", "Examen médico general", "Factores que influyen en el estado de salud"],
];
