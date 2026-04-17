import { AppError } from "../utils/appError.js";

const ALLOWED_TYPES = new Set([
  "general",
  "cardiovascular",
  "respiratoria",
  "metabolica",
  "neurologica",
  "digestiva",
  "infecciosa",
]);

const ALLOWED_AGE_GROUPS = new Set([
  "pediatrico",
  "adulto",
  "adulto_mayor",
]);

const ALLOWED_SEX = new Set(["femenino", "masculino", "otro"]);
const ALLOWED_URGENCY = new Set(["baja", "media", "alta"]);
const ALLOWED_CHAT_ROLES = new Set(["user", "assistant"]);

function assertObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(
      400,
      "El cuerpo de la solicitud debe ser un objeto JSON.",
      "INVALID_INPUT",
    );
  }
}

function sanitizeString(value, fieldName, { required = false, fallback = "" } = {}) {
  if (value == null || value === "") {
    if (required) {
      throw new AppError(
        400,
        `El campo "${fieldName}" es obligatorio.`,
        "INVALID_INPUT",
      );
    }
    return fallback;
  }

  if (typeof value !== "string") {
    throw new AppError(
      400,
      `El campo "${fieldName}" debe ser un texto.`,
      "INVALID_INPUT",
    );
  }

  return value.trim();
}

function sanitizeStringArray(value, fieldName, { required = false, max = 12 } = {}) {
  if (value == null) {
    if (required) {
      throw new AppError(
        400,
        `El campo "${fieldName}" es obligatorio.`,
        "INVALID_INPUT",
      );
    }
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(
      400,
      `El campo "${fieldName}" debe ser un arreglo.`,
      "INVALID_INPUT",
    );
  }

  const sanitized = [...new Set(value)]
    .map((item) => sanitizeString(item, fieldName, { required: true }))
    .filter(Boolean)
    .slice(0, max);

  if (required && sanitized.length === 0) {
    throw new AppError(
      400,
      `Debes enviar al menos un elemento en "${fieldName}".`,
      "INVALID_INPUT",
    );
  }

  return sanitized;
}

function sanitizeEnum(value, fieldName, allowedValues, fallback) {
  const normalized = sanitizeString(value, fieldName, { fallback }).toLowerCase();

  if (!allowedValues.has(normalized)) {
    throw new AppError(
      400,
      `El campo "${fieldName}" debe ser uno de: ${[...allowedValues].join(", ")}.`,
      "INVALID_INPUT",
    );
  }

  return normalized;
}

export function validateDiagnosisInput(payload) {
  assertObject(payload);

  return {
    sintomas: sanitizeStringArray(payload.sintomas, "sintomas", {
      required: true,
      max: 14,
    }),
    tipoEnfermedad: sanitizeEnum(
      payload.tipoEnfermedad,
      "tipoEnfermedad",
      ALLOWED_TYPES,
      "general",
    ),
    grupoEdad: sanitizeEnum(
      payload.grupoEdad,
      "grupoEdad",
      ALLOWED_AGE_GROUPS,
      "adulto",
    ),
    sexo: sanitizeEnum(payload.sexo, "sexo", ALLOWED_SEX, "otro"),
    nivelUrgencia: sanitizeEnum(
      payload.nivelUrgencia,
      "nivelUrgencia",
      ALLOWED_URGENCY,
      "media",
    ),
    contextoClinico: sanitizeString(payload.contextoClinico, "contextoClinico", {
      fallback: "consulta general",
    }),
    objetosDetectados: sanitizeStringArray(
      payload.objetosDetectados,
      "objetosDetectados",
      { max: 6 },
    ),
  };
}

export function validateChatInput(payload) {
  assertObject(payload);

  const mensaje = sanitizeString(payload.mensaje, "mensaje", {
    required: true,
  }).slice(0, 1600);

  if (payload.historial != null && !Array.isArray(payload.historial)) {
    throw new AppError(
      400,
      'El campo "historial" debe ser un arreglo.',
      "INVALID_INPUT",
    );
  }

  const historial = (payload.historial ?? [])
    .slice(-10)
    .map((entry, index) => {
      assertObject(entry);

      return {
        role: sanitizeEnum(
          entry.role,
          `historial[${index}].role`,
          ALLOWED_CHAT_ROLES,
          "user",
        ),
        content: sanitizeString(entry.content, `historial[${index}].content`, {
          required: true,
        }).slice(0, 1600),
      };
    });

  return {
    mensaje,
    historial,
  };
}
