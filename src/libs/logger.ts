import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

export default logger;
