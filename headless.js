const winston = require("winston");
const JlptMonitor = require("./src/jlptMonitor");

// 간단한 인자 파서 (--regions=15 --level=N2 --interval=30 --year=2025 --times=2)
function parseArgs(argv) {
  const result = {
    regions: [],
    level: null,
    interval: 30,
    cookie: "",
    year: "",
    times: "",
    telegramToken: "",
    telegramChatId: "",
  };
  argv.forEach((arg) => {
    if (arg.startsWith("--regions=")) {
      const v = arg.replace("--regions=", "");
      result.regions = v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (arg.startsWith("--level=")) {
      result.level = arg.replace("--level=", "").trim();
    }
    if (arg.startsWith("--interval=")) {
      const n = Number(arg.replace("--interval=", "").trim());
      if (!Number.isNaN(n) && n > 0) result.interval = n;
    }
    if (arg.startsWith("--cookie=")) {
      result.cookie = arg.replace("--cookie=", "").trim();
    }
    if (arg.startsWith("--year=")) {
      result.year = arg.replace("--year=", "").trim();
    }
    if (arg.startsWith("--times=")) {
      result.times = arg.replace("--times=", "").trim();
    }
    if (arg.startsWith("--telegram-token=")) {
      result.telegramToken = arg.replace("--telegram-token=", "").trim();
    }
    if (arg.startsWith("--telegram-chat=")) {
      result.telegramChatId = arg.replace("--telegram-chat=", "").trim();
    }
  });
  return result;
}

const {
  regions,
  level,
  interval,
  cookie,
  year,
  times,
  telegramToken,
  telegramChatId,
} = parseArgs(process.argv.slice(2));

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

(async () => {
  try {
    if (!regions.length || !level) {
      logger.info(
        "사용법: node headless.js --regions=고양,서울 --level=N2 [--interval=30]"
      );
      process.exit(1);
    }

    const monitor = new JlptMonitor(logger);
    if (cookie) {
      monitor.headers.Cookie = cookie;
      logger.info("쿠키가 설정되었습니다(길이: " + cookie.length + ")");
    }
    if (year || times) {
      monitor.setRequestParams({ theyear: year, times });
    }
    if (telegramToken && telegramChatId) {
      monitor.setTelegramConfig(telegramToken, telegramChatId);
    }
    await monitor.startMonitoring(regions, level);

    logger.info(
      `헤드리스 모니터 시작 - 지역: ${regions.join(
        ", "
      )}, 레벨: ${level}, 주기: ${interval}s, 연도: ${year || "기본"}, 회차: ${
        times || "기본"
      }`
    );

    // 주기적으로 확인
    setInterval(() => {
      if (monitor.isMonitoring()) {
        logger.info("접수현황 확인 중...");
        monitor.checkAvailability();
      }
    }, interval * 1000);
  } catch (err) {
    logger.error(`에러: ${err.message}`);
    process.exit(1);
  }
})();
