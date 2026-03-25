export function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export function formatSexo(s: string): string {
  if (s === "masculino") return "Masculino";
  if (s === "femenino") return "Femenino";
  return "Otro";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function calcAge(fechaNacimiento: string): number | null {
  if (!fechaNacimiento) return null;
  let d: Date;
  if (fechaNacimiento.includes("/")) {
    const [day, month, year] = fechaNacimiento.split("/").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(fechaNacimiento + "T00:00:00");
  }
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
