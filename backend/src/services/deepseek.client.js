import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s_-]+/g, "")
    : "";
}

function extractProviderError(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const providerError =
    payload.error && typeof payload.error === "object" ? payload.error : payload;

  return {
    providerCode:
      typeof providerError.code === "string" ? providerError.code : null,
    providerType:
      typeof providerError.type === "string" ? providerError.type : null,
    providerMessage:
      typeof providerError.message === "string" ? providerError.message : null,
  };
}

function buildApiError(response, payload) {
  const providerError = extractProviderError(payload);
  const normalizedCode = normalizeText(providerError.providerCode);
  const normalizedMessage = normalizeText(providerError.providerMessage);

  const isUserNotFound =
    normalizedCode.includes("usernotfound") ||
    normalizedMessage.includes("usernotfound") ||
    normalizedMessage.includes("unknownuser");

  const isInvalidApiKey =
    normalizedCode.includes("invalidapikey") ||
    normalizedCode.includes("invalidkey") ||
    normalizedMessage.includes("invalidapikey") ||
    normalizedMessage.includes("invalidkey");

  const messageByStatus = {
    401: `${env.llmProviderName} rechazo la solicitud por autenticacion. Revisa la API key.`,
    402: `${env.llmProviderName} rechazo la solicitud por saldo o facturacion.`,
    422: `${env.llmProviderName} rechazo la solicitud por parametros invalidos.`,
    429: `${env.llmProviderName} rechazo la solicitud por limite de uso. Intenta nuevamente en unos segundos.`,
  };

  let message =
    messageByStatus[response.status] ?? `${env.llmProviderName} rechazo la solicitud.`;

  if (isUserNotFound || isInvalidApiKey) {
    message = `${env.llmProviderName} rechazo la solicitud porque la API key no corresponde a una cuenta valida. Genera una nueva API key y actualizala en backend/.env.`;
  }

  return new AppError(
    502,
    message,
    "LLM_API_ERROR",
    {
      status: response.status,
      statusText: response.statusText,
      ...providerError,
    },
  );
}

async function callLlmChat(messages, { jsonMode = false, maxTokens = 900 } = {}) {
  const body = {
    model: env.llmModel,
    messages,
    stream: false,
    max_tokens: maxTokens,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${env.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.llmApiKey}`,
    },
    signal: AbortSignal.timeout(env.requestTimeoutMs),
    body: JSON.stringify(body),
  }).catch((error) => {
    if (error.name === "TimeoutError") {
      throw new AppError(
        504,
        `${env.llmProviderName} tardo demasiado en responder.`,
        "LLM_TIMEOUT",
      );
    }

    throw new AppError(
      502,
      `No fue posible comunicarse con ${env.llmProviderName}.`,
      "LLM_CONNECTION_ERROR",
      { motivo: error.message },
    );
  });

  let payload;

  try {
    payload = await response.json();
  } catch (_error) {
    throw new AppError(
      502,
      `${env.llmProviderName} devolvio una respuesta no interpretable.`,
      "LLM_INVALID_RESPONSE",
    );
  }

  if (!response.ok) {
    throw buildApiError(response, payload);
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new AppError(
      502,
      `${env.llmProviderName} no devolvio contenido util para procesar la solicitud.`,
      "LLM_EMPTY_CONTENT",
      payload,
    );
  }

  return {
    content,
    usage: payload.usage ?? null,
  };
}

export async function callDeepSeekChat(messages) {
  return callLlmChat(messages, { jsonMode: true, maxTokens: 900 });
}

export async function callGeneralChat(messages) {
  return callLlmChat(messages, { jsonMode: false, maxTokens: 700 });
}
