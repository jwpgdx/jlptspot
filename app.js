const express = require("express");
const cron = require("node-cron");
const winston = require("winston");
const JlptMonitor = require("./src/jlptMonitor");
const config = require("./config/config");

// 로거 설정
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/jlpt-monitor.log" }),
  ],
});

const app = express();
const PORT = process.env.PORT || 3000;

// JLPT 모니터 인스턴스 생성
const jlptMonitor = new JlptMonitor(logger);

// Express 미들웨어
app.use(express.json());
app.use(express.static("public"));

// 라우트
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "running",
    monitoredRegions: config.monitoredRegions,
    lastCheck: jlptMonitor.getLastCheckTime(),
    notifications: jlptMonitor.getNotifications(),
  });
});

app.post("/api/start-monitoring", (req, res) => {
  const { regions, level } = req.body;
  if (regions && level) {
    jlptMonitor.startMonitoring(regions, level);
    res.json({ message: "모니터링이 시작되었습니다." });
  } else {
    res.status(400).json({ error: "지역과 레벨을 지정해주세요." });
  }
});

app.post("/api/stop-monitoring", (req, res) => {
  jlptMonitor.stopMonitoring();
  res.json({ message: "모니터링이 중지되었습니다." });
});

// 크론 작업 설정 (매 30초마다 확인)
cron.schedule("*/30 * * * * *", () => {
  if (jlptMonitor.isMonitoring()) {
    logger.info("접수현황 확인 중...");
    jlptMonitor.checkAvailability();
  }
});

// 서버 시작
app.listen(PORT, () => {
  logger.info(`JLPT 모니터 서버가 포트 ${PORT}에서 실행 중입니다.`);
  logger.info(`웹 인터페이스: http://localhost:${PORT}`);
});

// 에러 핸들링
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
