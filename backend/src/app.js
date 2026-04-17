import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import chatbotRouter from "./routes/chatbot.routes.js";
import diagnosticoRouter from "./routes/diagnostico.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    servicio: "sistema-experto-medico-backend",
    modelo: env.llmModel,
    timestamp: new Date().toISOString(),
  });
});

app.use("/diagnostico", diagnosticoRouter);
app.use("/chatbot", chatbotRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
