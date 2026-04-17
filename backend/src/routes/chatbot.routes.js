import { Router } from "express";
import { createChatReply } from "../controllers/chatbot.controller.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    message: "Usa POST /chatbot para conversar libremente con el asistente.",
    ejemplo: {
      mensaje: "Explicame que es la diabetes tipo 2",
      historial: [
        {
          role: "assistant",
          content: "Puedo ayudarte con preguntas generales y medicas educativas.",
        },
      ],
    },
  });
});

router.post("/", createChatReply);

export default router;
