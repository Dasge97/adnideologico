import type { AxisScores } from "./api";

export type AxisKey = keyof AxisScores;

export interface AxisMeta {
  key: AxisKey;
  code: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
  guideQuestion: string;
}

interface AxisRank {
  meta: AxisMeta;
  value: number;
  abs: number;
}

export interface ResultNarrativePack {
  profileName: string;
  profileSubtitle: string;
  opening: string;
  themes: Array<{ title: string; text: string }>;
  strengths: string[];
  tensions: string[];
  reflectionQuestions: string[];
  closing: string;
}

export const AXES: AxisMeta[] = [
  {
    key: "economy",
    code: "ECON",
    label: "Economia",
    leftLabel: "Mas mercado",
    rightLabel: "Mas redistribucion",
    guideQuestion: "Que papel debe tener el Estado en la economia?",
  },
  {
    key: "liberties",
    code: "LIB",
    label: "Libertades civiles",
    leftLabel: "Mas control",
    rightLabel: "Mas libertades",
    guideQuestion: "Como equilibras derechos individuales y seguridad?",
  },
  {
    key: "culture",
    code: "CULT",
    label: "Valores culturales",
    leftLabel: "Mas tradicion",
    rightLabel: "Mas progresismo",
    guideQuestion: "Como te posicionas ante el cambio cultural?",
  },
  {
    key: "global",
    code: "GLOB",
    label: "Globalizacion",
    leftLabel: "Mas soberania",
    rightLabel: "Mas cooperacion",
    guideQuestion: "Que peso das a cooperar fuera frente a decidir dentro?",
  },
  {
    key: "tech",
    code: "TECH",
    label: "Tecnologia",
    leftLabel: "Mas precaucion",
    rightLabel: "Mas innovacion",
    guideQuestion: "Prefieres acelerar innovacion o regular antes?",
  },
  {
    key: "ecology",
    code: "ECO",
    label: "Medio ambiente",
    leftLabel: "Mas crecimiento",
    rightLabel: "Mas sostenibilidad",
    guideQuestion: "Como equilibras crecimiento y sostenibilidad?",
  },
];

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function intensity(value: number) {
  const abs = Math.abs(value);
  if (abs >= 0.65) return "alta";
  if (abs >= 0.35) return "media";
  return "moderada";
}

function topAxes(scores: AxisScores, count = 3): AxisRank[] {
  return [...AXES]
    .map((meta) => ({ meta, value: scores[meta.key], abs: Math.abs(scores[meta.key]) }))
    .sort((a, b) => b.abs - a.abs)
    .slice(0, count);
}

function buildProfileIdentity(scores: AxisScores) {
  if (scores.liberties >= 0.35 && scores.ecology >= 0.35) {
    return {
      profileName: "Humanismo de libertades y sostenibilidad",
      profileSubtitle: "Pones en el centro derechos individuales y responsabilidad ambiental.",
    };
  }

  if (scores.economy <= -0.35 && scores.tech >= 0.35) {
    return {
      profileName: "Innovacion pragmatica de mercado",
      profileSubtitle: "Tiendes a priorizar dinamismo economico con apuesta por tecnologia.",
    };
  }

  if (scores.economy >= 0.35 && scores.liberties >= 0.35) {
    return {
      profileName: "Progreso social con base en libertades",
      profileSubtitle: "Combinas sensibilidad redistributiva con defensa de derechos civiles.",
    };
  }

  if (scores.culture <= -0.35 && scores.global <= -0.35) {
    return {
      profileName: "Comunidad y soberania",
      profileSubtitle: "Muestras preferencia por cohesion cultural y autonomia politica.",
    };
  }

  return {
    profileName: "Perfil hibrido en construccion",
    profileSubtitle: "Tu mapa mezcla posiciones que rara vez aparecen juntas en etiquetas clasicas.",
  };
}

function buildStrengths(scores: AxisScores): string[] {
  const strongest = topAxes(scores, 3);
  return strongest.map(({ meta, value }) => {
    const side = value >= 0 ? meta.rightLabel : meta.leftLabel;
    return `En ${meta.label.toLowerCase()} aparece una preferencia ${intensity(value)} hacia "${side}".`;
  });
}

function buildTensions(scores: AxisScores): string[] {
  const tensions: string[] = [];

  if (scores.economy <= -0.25 && scores.ecology >= 0.35) {
    tensions.push("Buscas equilibrio entre dinamismo economico y transicion ecologica exigente.");
  }
  if (scores.liberties >= 0.35 && scores.global <= -0.25) {
    tensions.push("Defiendes libertades amplias, pero con una mirada cauta hacia apertura global.");
  }
  if (scores.tech >= 0.35 && scores.culture <= -0.25) {
    tensions.push("Aparece una mezcla interesante: apertura tecnologica junto a cautela cultural.");
  }

  if (tensions.length === 0) {
    tensions.push(
      "Tu principal tension no esta en extremos opuestos, sino en como priorizas temas distintos segun el contexto."
    );
  }

  return tensions.slice(0, 3);
}

function buildReflectionQuestions(scores: AxisScores): string[] {
  const strongest = topAxes(scores, 2);
  const weakest = [...AXES]
    .map((meta) => ({ meta, abs: Math.abs(scores[meta.key]) }))
    .sort((a, b) => a.abs - b.abs)[0];

  return [
    `Si tuvieras que decidir hoy, mantendrias igual tu prioridad en ${strongest[0].meta.label.toLowerCase()}?`,
    `Que evento real podria hacerte revisar tu postura en ${strongest[1].meta.label.toLowerCase()}?`,
    `En ${weakest.meta.label.toLowerCase()} estas en zona intermedia: que criterio te falta para definirte mejor?`,
  ];
}

export function describeAxisValue(meta: AxisMeta, rawValue: number) {
  const value = clamp(rawValue);
  const abs = Math.abs(value);

  if (abs < 0.2) {
    return {
      stance: "equilibrio",
      summary: `En ${meta.label.toLowerCase()} aparece una posicion de equilibrio, sin inclinacion fuerte hacia ninguno de los extremos.`,
      sideLabel: "Posicion intermedia",
      intensity: "moderada",
    };
  }

  const sideLabel = value > 0 ? meta.rightLabel : meta.leftLabel;
  const tone = intensity(value);

  return {
    stance: value > 0 ? "hacia el polo derecho" : "hacia el polo izquierdo",
    summary: `En ${meta.label.toLowerCase()} muestras una inclinacion ${tone} hacia "${sideLabel}".`,
    sideLabel,
    intensity: tone,
  };
}

export function buildCombinationInsights(scores: AxisScores): string[] {
  const top = topAxes(scores, 3);
  return [
    `Tus ejes mas marcados son ${top[0].meta.label.toLowerCase()}, ${top[1].meta.label.toLowerCase()} y ${top[2].meta.label.toLowerCase()}.`,
    "La combinacion sugiere una forma de pensar por prioridades, no por bloques rigidos.",
    "En la practica, este perfil suele cambiar segun el tema concreto y la experiencia vital.",
  ];
}

export function buildNarrative(scores: AxisScores) {
  const strongest = topAxes(scores, 3);
  const labels = strongest.map(({ meta }) => meta.label.toLowerCase());

  return `Tu mapa prioriza ${labels[0]}, ${labels[1]} y ${labels[2]}. No es una etiqueta cerrada: es una fotografia de como ponderas dilemas politicos hoy.`;
}

export function buildResultNarrativePack(scores: AxisScores): ResultNarrativePack {
  const identity = buildProfileIdentity(scores);
  const top = topAxes(scores, 2);

  return {
    profileName: identity.profileName,
    profileSubtitle: identity.profileSubtitle,
    opening: `Tu resultado dibuja una combinacion poco estandar: ${top[0].meta.label.toLowerCase()} y ${top[1].meta.label.toLowerCase()} aparecen como ejes directores de tu mirada politica actual.`,
    themes: [
      {
        title: "Como se lee este mapa",
        text: "No mide si una postura es mejor que otra. Mide que valores sueles priorizar cuando hay tensiones reales.",
      },
      {
        title: "Lo que hace unico tu perfil",
        text: "Tu mezcla rompe el esquema izquierda/derecha clasico y muestra una identidad ideologica mas matizada.",
      },
    ],
    strengths: buildStrengths(scores),
    tensions: buildTensions(scores),
    reflectionQuestions: buildReflectionQuestions(scores),
    closing:
      "Toma este resultado como una conversacion contigo mismo. Lo valioso no es encajar en una etiqueta, sino entender por que decides como decides.",
  };
}

export function buildShareCopy(scores: AxisScores) {
  const strongest = topAxes(scores, 2);
  const first = strongest[0];
  const second = strongest[1];
  const firstAxis = describeAxisValue(first.meta, first.value);
  const secondAxis = describeAxisValue(second.meta, second.value);

  return `Este es mi mapa en ADN Ideologico: ${first.meta.label} (${firstAxis.sideLabel}) y ${second.meta.label} (${secondAxis.sideLabel}) son mis ejes mas marcados. Haz el test y compara tu perfil.`;
}

export function buildCombinationCode(scores: AxisScores) {
  return AXES.map((axis) => {
    const value = scores[axis.key];
    if (value >= 0.25) return `${axis.code}+`;
    if (value <= -0.25) return `${axis.code}-`;
    return `${axis.code}0`;
  }).join(" ");
}
