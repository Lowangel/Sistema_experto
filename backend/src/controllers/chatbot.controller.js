import { generateChatReply } from "../services/chatbot.service.js";
import { validateChatInput } from "../validators/request.validator.js";

export async function createChatReply(req, res, next) {
  try {
    const input = validateChatInput(req.body);
    const result = await generateChatReply(input);

    res.json({
      ok: true,
      reply: result.reply,
      suggestions: result.suggestions,
      meta: {
        modelo: result.model,
        intentos: result.attempts,
        fallback: result.fallback,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
