/** Datos del paciente (NOM-004 §5.2.3) */
export interface Paciente {
  id: string;
  nombre_completo: string;
  sexo: "masculino" | "femenino" | "otro";
  fecha_nacimiento: string;
  edad: number;
  domicilio: string;
  grupo_etnico?: string;
  telefono?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  created_by: string; // audit trail
}

/** Datos del establecimiento (NOM-004 §5.2.1) */
export interface Establecimiento {
  id: string;
  tipo: string;
  nombre: string;
  domicilio: string;
  institucion?: string;
  razon_social?: string;
}

/** Signos vitales (NOM-004 §6.1.2) */
export interface SignosVitales {
  temperatura?: number; // °C
  tension_arterial_sistolica?: number; // mmHg
  tension_arterial_diastolica?: number; // mmHg
  frecuencia_cardiaca?: number; // lpm
  frecuencia_respiratoria?: number; // rpm
  peso?: number; // kg
  talla?: number; // cm
  saturacion_oxigeno?: number; // %
}

/** Diagnóstico con código CIE-10 (NOM-004 §6.1.4) */
export interface Diagnostico {
  descripcion: string;
  codigo_cie10: string;
  tipo: "principal" | "secundario";
}

/** Indicación terapéutica (NOM-004 §6.1.6) */
export interface IndicacionTerapeutica {
  medicamento: string;
  dosis: string;
  via_administracion: string;
  periodicidad: string;
  duracion?: string;
  notas?: string;
}

/** Antecedentes (NOM-004 §6.1.1) */
export interface Antecedentes {
  heredofamiliares: string;
  personales_patologicos: string;
  personales_no_patologicos: string;
  tabaco?: string;
  alcohol?: string;
  otras_sustancias?: string;
}

/** Interrogatorio (NOM-004 §6.1.1) */
export interface Interrogatorio {
  padecimiento_actual: string;
  interrogatorio_por_aparatos_y_sistemas?: string;
  tratamientos_previos?: string;
}

/** Exploración física (NOM-004 §6.1.2) */
export interface ExploracionFisica {
  habitus_exterior: string;
  signos_vitales: SignosVitales;
  cabeza?: string;
  cuello?: string;
  torax?: string;
  abdomen?: string;
  miembros?: string;
  genitales?: string;
  otros?: string;
}

/** Resultado de estudio auxiliar (NOM-004 §6.1.3) */
export interface ResultadoEstudio {
  tipo: "laboratorio" | "gabinete" | "otro";
  nombre: string;
  resultado: string;
  fecha: string;
}

/** Nota de evolución (NOM-004 §6.2) */
export interface NotaEvolucion {
  id: string;
  expediente_id: string;
  fecha: string;
  hora: string;
  evolucion_cuadro_clinico: string;
  signos_vitales: SignosVitales;
  resultados_estudios?: ResultadoEstudio[];
  diagnosticos: Diagnostico[];
  pronostico: string;
  indicaciones_terapeuticas: IndicacionTerapeutica[];
  medico_nombre: string;
  medico_cedula: string;
  firma_digital: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

/** Historia clínica completa (NOM-004 §6.1) */
export interface HistoriaClinica {
  interrogatorio: Interrogatorio;
  antecedentes: Antecedentes;
  exploracion_fisica: ExploracionFisica;
  resultados_estudios: ResultadoEstudio[];
  diagnosticos: Diagnostico[];
  pronostico: string;
  indicacion_terapeutica: IndicacionTerapeutica[];
}

/** Expediente clínico completo (NOM-004 §4.4) */
export interface ExpedienteClinico {
  id: string;
  paciente_id: string;
  paciente: Paciente;
  establecimiento: Establecimiento;
  historia_clinica: HistoriaClinica;
  notas_evolucion: NotaEvolucion[];
  consentimiento_informado: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface GenerateRequest {
  keywords: string;
  paciente_id?: string;
  contexto_previo?: string; // resumen de última consulta
  tipo_nota: "nueva_consulta" | "evolucion" | "urgencia";
}

export interface GenerateResponse {
  signos_vitales: SignosVitales;
  padecimiento_actual: string;
  exploracion_fisica: string;
  diagnosticos: Diagnostico[];
  pronostico: string;
  indicaciones_terapeuticas: IndicacionTerapeutica[];
  nota_narrativa: string; // nota completa en lenguaje técnico-médico
  campos_faltantes: string[]; // campos NOM-004 que no se pudieron inferir
}

export interface SnippetPersonalizado {
  id: string;
  medico_id: string;
  atajo: string;          // e.g. "#normal", "#abdomen"
  texto: string;          // expanded text
  categoria: string;      // "exploracion" | "indicaciones" | "signos_vitales" | "general"
  created_at: string;
  updated_at: string;
}

export interface NOM004Validation {
  porcentaje_completitud: number;
  campos_presentes: string[];
  campos_faltantes: string[];
  advertencias: string[];
}
