import express from "express";
import pinoHttp from "pino-http";
import logger from "./libs/logger";
import cors from "cors";
import appRoutes from "./routes/countries.routes";

const app = express();

app.use(cors());
app.use(pinoHttp({ logger }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/", appRoutes);

export default app;
