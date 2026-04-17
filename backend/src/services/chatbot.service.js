import { env } from "../config/env.js";
import { buildChatbotSystemPrompt } from "../prompts/chatbotPrompt.js";
import { AppError } from "../utils/appError.js";
import { callGeneralChat } from "./deepseek.client.js";

const RECOVERABLE_CODES = new Set([
  "LLM_CONNECTION_ERROR",
  "LLM_TIMEOUT",
  "LLM_API_ERROR",
  "LLM_INVALID_RESPONSE",
  "LLM_EMPTY_CONTENT",
]);

function buildFallbackReply(input, reason) {
  const reasonText = reason
    ? `No pude consultar ${env.llmProviderName} en este momento (${reason}).`
    : `No pude consultar ${env.llmProviderName} en este momento.`;

  return `${reasonText}

Mientras se restablece el modelo externo, puedo darte una orientacion local:

- Reformula tu pregunta en una sola idea principal para obtener una respuesta mas precisa.
- Si es una duda medica urgente, busca atencion profesional de inmediato.
- Si quieres, intenta nuevamente con mas contexto, sintomas, tiempo de evolucion o tu objetivo exacto.

Tu pregunta fue: "${input.mensaje}"`;
}

function buildSuggestions(message) {
  const normalized = message.toLowerCase();

  if (normalized.includes("diabetes")) {
    return [
      "Explicame los sintomas mas comunes",
      "Que pruebas se usan para diagnosticarla",
      "Como prevenir complicaciones",
    ];
  }

  if (
    normalized.includes("dolor") ||
    normalized.includes("pecho") ||
    normalized.includes("fiebre") ||
    normalized.includes("tos")
  ) {
    return [
      "Que signos de alarma deberia vigilar",
      "Que informacion clinica conviene reunir",
      "Explicamelo de forma sencilla",
    ];
  }

  if (
    normalized.includes("codigo") ||
    normalized.includes("program") ||
    normalized.includes("node") ||
    normalized.includes("python")
  ) {
    return [
      "Dame un ejemplo corto",
      "Explicalo paso a paso",
      "Cuales son los errores comunes",
    ];
  }

  return [
    "Resumelo en tres puntos",
    "Dame un ejemplo practico",
    "Que deberia preguntar despues",
  ];
}

function buildHistoryMessages(history) {
  return history.map((entry) => ({
    role: entry.role,
    content: entry.content,
  }));
}

export async function generateChatReply(input) {
  const suggestions = buildSuggestions(input.mensaje);

  if (!env.llmApiKey) {
    return {
      reply: buildFallbackReply(
        input,
        `no se configuro la API key de ${env.llmProviderName}`,
      ),
      attempts: 0,
      model: "copiloto-local",
      suggestions,
      fallback: true,
      usage: null,
    };
  }

  const messages = [
    { role: "system", content: buildChatbotSystemPrompt() },
    ...buildHistoryMessages(input.historial),
    { role: "user", content: input.mensaje },
  ];

  try {
    const response = await callGeneralChat(messages);
    const reply = response.content.trim();

    if (!reply) {
      throw new AppError(
        502,
        `${env.llmProviderName} devolvio una respuesta vacia para el chat.`,
        "LLM_EMPTY_CONTENT",
      );
    }

    return {
      reply,
      attempts: 1,
      model: env.llmModel,
      suggestions,
      fallback: false,
      usage: response.usage,
    };
  } catch (error) {
    if (error instanceof AppError && RECOVERABLE_CODES.has(error.code)) {
      const reason =
        error.details?.providerMessage ||
        error.details?.motivo ||
        error.message.toLowerCase();

      return {
        reply: buildFallbackReply(input, reason),
        attempts: 1,
        model: "copiloto-local",
        suggestions,
        fallback: true,
        usage: null,
      };
    }

    throw error;
  }
}
