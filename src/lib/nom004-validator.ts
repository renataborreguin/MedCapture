import type {
  GenerateResponse,
  NOM004Validation,
  SignosVitales,
} from "@/types/expediente";

// Referencia: NOM-004-SSA3-2012 §6.2 (Nota de evolución)
export function validateNOM004(
  data: GenerateResponse
): NOM004Validation {
  const presentes: string[] = [];
  const faltantes: string[] = [];
  const advertencias: string[] = [];

  // §6.2.1 - Evolución y actualización del cuadro clínico
  if (data.padecimiento_actual && data.padecimiento_actual.trim().length > 0) {
    presentes.push("Padecimiento actual / evolución del cuadro clínico");
  } else {
    faltantes.push("Padecimiento actual / evolución del cuadro clínico");
  }

  // §6.2.2 - Signos vitales
  const sv = data.signos_vitales;
  const signosPresentes = checkSignosVitales(sv);
  if (signosPresentes >= 3) {
    presentes.push("Signos vitales");
  } else if (signosPresentes > 0) {
    presentes.push("Signos vitales (parcial)");
    advertencias.push(
      "Signos vitales incompletos: se recomienda registrar TA, FC, FR, temperatura, peso y talla"
    );
  } else {
    faltantes.push("Signos vitales");
  }

  // §6.2.3 - Resultados de estudios auxiliares
  // Opcional, no siempre aplica
  presentes.push("Resultados de estudios (no aplica o pendiente)");

  // §6.2.4 - Diagnósticos o problemas clínicos
  if (data.diagnosticos && data.diagnosticos.length > 0) {
    presentes.push("Diagnósticos o problemas clínicos");

    const sinCie10 = data.diagnosticos.filter(
      (d) => !d.codigo_cie10 || d.codigo_cie10.trim() === ""
    );
    if (sinCie10.length > 0) {
      advertencias.push(
        `${sinCie10.length} diagnóstico(s) sin código CIE-10`
      );
    }
  } else {
    faltantes.push("Diagnósticos o problemas clínicos");
  }

  // §6.2.5 - Pronóstico
  if (data.pronostico && data.pronostico.trim().length > 0) {
    presentes.push("Pronóstico");
  } else {
    faltantes.push("Pronóstico");
  }

  // §6.2.6 - Tratamiento e indicaciones médicas
  if (
    data.indicaciones_terapeuticas &&
    data.indicaciones_terapeuticas.length > 0
  ) {
    presentes.push("Indicaciones terapéuticas");

    data.indicaciones_terapeuticas.forEach((ind) => {
      if (!ind.dosis || !ind.via_administracion || !ind.periodicidad) {
        advertencias.push(
          `Medicamento "${ind.medicamento}" incompleto: verificar dosis, vía y periodicidad`
        );
      }
    });
  } else {
    faltantes.push("Indicaciones terapéuticas");
  }

  // §6.1.2 - Exploración física
  if (data.exploracion_fisica && data.exploracion_fisica.trim().length > 0) {
    presentes.push("Exploración física");
  } else {
    faltantes.push("Exploración física");
  }

  // §5.10 - Fecha, hora, nombre y firma
  // Estos se agregan a nivel de sistema, no del LLM
  advertencias.push(
    "Verificar: fecha, hora, nombre completo y firma digital del médico (§5.10)"
  );

  const totalCampos = presentes.length + faltantes.length;
  const porcentaje = Math.round((presentes.length / totalCampos) * 100);

  return {
    porcentaje_completitud: porcentaje,
    campos_presentes: presentes,
    campos_faltantes: faltantes,
    advertencias,
  };
}

function checkSignosVitales(sv: SignosVitales): number {
  let count = 0;
  if (sv.tension_arterial_sistolica != null) count++;
  if (sv.frecuencia_cardiaca != null) count++;
  if (sv.frecuencia_respiratoria != null) count++;
  if (sv.temperatura != null) count++;
  if (sv.peso != null) count++;
  if (sv.talla != null) count++;
  if (sv.saturacion_oxigeno != null) count++;
  return count;
}
