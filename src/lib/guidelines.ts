export type BloodPressureCategory = {
  category:
    | "Ottimale"
    | "Normale"
    | "Normale-Alta"
    | "Ipertensione Grado 1"
    | "Ipertensione Grado 2"
    | "Ipertensione Grado 3"
    | "Crisi Ipertensiva";
  level: "normal" | "warning" | "danger" | "critical";
  colorText: string;
  colorBg: string;
  colorBorder: string;
  badgeClass: string;
  reportBadgeClass: string;
  description: string;
};

/**
 * Classificazione unificata ESC/ESH condivisa tra diario live, tabelle medico e referto stampabile A4.
 */
export function classifyBloodPressure(max: number, min: number): BloodPressureCategory {
  if (max >= 180 || min >= 120) {
    return {
      category: "Crisi Ipertensiva",
      level: "critical",
      colorText: "#b83230",
      colorBg: "#ffdad8",
      colorBorder: "#b83230",
      badgeClass: "bg-error text-on-error font-bold",
      reportBadgeClass: "bg-red-100 text-red-800 border border-red-300",
      description: "Valori critici di allerta sanitaria.",
    };
  }
  if (max >= 160 || min >= 100) {
    return {
      category: "Ipertensione Grado 2",
      level: "danger",
      colorText: "#b83230",
      colorBg: "#ffdad8",
      colorBorder: "#b83230",
      badgeClass: "bg-error text-on-error font-semibold",
      reportBadgeClass: "bg-red-100 text-red-800",
      description: "Pressione arteriosa moderatamente elevata.",
    };
  }
  if (max >= 140 || min >= 90) {
    return {
      category: "Ipertensione Grado 1",
      level: "danger",
      colorText: "#b83230",
      colorBg: "#ffdad8",
      colorBorder: "#b83230",
      badgeClass: "bg-error-container text-on-error-container border border-error/30 font-semibold",
      reportBadgeClass: "bg-orange-100 text-orange-800",
      description: "Pressione arteriosa lievemente elevata.",
    };
  }
  if ((max >= 130 && max <= 139) || (min >= 85 && min <= 89)) {
    return {
      category: "Normale-Alta",
      level: "warning",
      colorText: "#705c30",
      colorBg: "#f8e0a8",
      colorBorder: "#c4a66a",
      badgeClass: "bg-tertiary-fixed text-on-tertiary-fixed font-semibold",
      reportBadgeClass: "bg-amber-100 text-amber-800",
      description: "Pressione nella fascia normale-alta (pre-ipertensione).",
    };
  }
  if (max < 120 && min < 80) {
    return {
      category: "Ottimale",
      level: "normal",
      colorText: "#2a6038",
      colorBg: "#d8f0de",
      colorBorder: "#78a886",
      badgeClass: "bg-primary-container/45 text-on-primary-fixed-variant font-semibold",
      reportBadgeClass: "bg-emerald-100 text-emerald-800",
      description: "Valori pressori ottimali.",
    };
  }
  return {
    category: "Normale",
    level: "normal",
    colorText: "#4a7c59",
    colorBg: "#d8f0de",
    colorBorder: "#78a886",
    badgeClass: "bg-primary-container/40 text-primary font-semibold",
    reportBadgeClass: "bg-green-100 text-green-800",
    description: "Pressione nei limiti normali.",
  };
}

export function isCriticalValue(max: number, min: number): boolean {
  return max >= 180 || min >= 110;
}
