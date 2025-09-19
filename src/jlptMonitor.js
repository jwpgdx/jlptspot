const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");
const TelegramBot = require("node-telegram-bot-api");

class JlptMonitor {
  constructor(logger) {
    this.logger = logger;
    this.isRunning = false;
    this.monitoredRegions = [];
    this.targetLevel = null;
    this.lastCheckTime = null;
    this.notifications = [];
    this.previousStatus = new Map(); // 이전 상태를 저장하여 변화 감지

    // API 설정
    this.apiUrl = "https://www.jlpt.or.kr/INC/examSchoolAjax.php";
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language":
        "ko,en-US;q=0.9,en;q=0.8,ja;q=0.7,zh-CN;q=0.6,zh;q=0.5",
      Connection: "keep-alive",
      // 기본은 JSON이지만 실제 서버가 HTML 조각을 반환할 수 있어 요청마다 오버라이드함
      "Content-Type": "application/json",
      Host: "www.jlpt.or.kr",
      Origin: "https://www.jlpt.or.kr",
      Referer: "https://www.jlpt.or.kr/html/receipt_sub06.html",
      "Sec-Ch-Ua":
        '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    };

    // 기본 요청 파라미터 (필요 시 외부에서 변경)
    this.theyear = String(new Date().getFullYear());
    this.times = "2"; // 1: 7월, 2: 12월
    this.mode = "examSchoolList";

    // 텔레그램 봇 설정
    this.telegramBot = null;
    this.telegramChatId = null;
  }

  async startMonitoring(regions, level) {
    this.monitoredRegions = regions;
    this.targetLevel = level;
    this.isRunning = true;
    this.logger.info(
      `모니터링 시작 - 지역: ${regions.join(", ")}, 레벨: ${level}`
    );

    // 모니터링 시작 알림
    this.sendTelegramNotification({
      type: "INFO",
      message: `🚀 JLPT 모니터링 시작\n\n지역: ${regions.join(
        ", "
      )}\n레벨: ${level}\n주기: 15초마다 확인`,
      timestamp: new Date().toISOString(),
    });

    // 즉시 한 번 확인
    await this.checkAvailability();
  }

  stopMonitoring() {
    this.isRunning = false;
    this.logger.info("모니터링 중지");

    // 모니터링 중지 알림
    this.sendTelegramNotification({
      type: "INFO",
      message: `⏹️ JLPT 모니터링 중지\n\n모니터링이 중지되었습니다.`,
      timestamp: new Date().toISOString(),
    });
  }

  isMonitoring() {
    return this.isRunning;
  }

  getLastCheckTime() {
    return this.lastCheckTime;
  }

  getNotifications() {
    return this.notifications.slice(-10); // 최근 10개 알림만 반환
  }

  setRequestParams({ theyear, times } = {}) {
    if (theyear) this.theyear = String(theyear);
    if (times) this.times = String(times);
  }

  // 텔레그램 설정
  setTelegramConfig(botToken, chatId) {
    if (botToken && chatId) {
      this.telegramBot = new TelegramBot(botToken, { polling: false });
      this.telegramChatId = chatId;
      this.logger.info(`텔레그램 알림 설정됨 - Chat ID: ${chatId}`);
    }
  }

  async checkAvailability() {
    if (!this.isRunning || !this.monitoredRegions.length || !this.targetLevel) {
      return;
    }

    try {
      this.lastCheckTime = new Date().toISOString();

      for (const region of this.monitoredRegions) {
        await this.checkRegionAvailability(region, this.targetLevel);
      }
    } catch (error) {
      this.logger.error("접수현황 확인 중 오류 발생:", error.message);
    }
  }

  async checkRegionAvailability(region, level) {
    try {
      // 공식 파라미터를 사용 (form-urlencoded)
      const form = new URLSearchParams({
        theyear: this.theyear,
        times: this.times,
        examArea: String(region), // 숫자 코드 권장 (예: 15)
        mode: this.mode,
      });

      const response = await axios.post(this.apiUrl, form.toString(), {
        headers: {
          ...this.headers,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        timeout: 15000,
        responseType: "json",
        validateStatus: (s) => s >= 200 && s < 500,
      });

      if (!response || typeof response.data === "undefined") {
        this.logger.warn(`${region} 응답 없음`);
        return;
      }

      // JSON 배열인 경우 (공식 응답)
      if (Array.isArray(response.data)) {
        const schools = this.mapApiArrayToSchools(response.data, level);
        // 신일중학교만 필터링
        const filteredSchools = this.filterSchoolsByTarget(
          schools,
          "신일중학교"
        );
        this.processRegionData(region, level, filteredSchools);
        return;
      }

      // 기타 문자열 등인 경우: 프리뷰 로그 + 파싱 시도
      if (typeof response.data === "string") {
        const preview = response.data.slice(0, 200).replace(/\s+/g, " ");
        this.logger.info(`${region} 응답 프리뷰: ${preview}`);
        try {
          const parsed = JSON.parse(response.data);
          if (Array.isArray(parsed)) {
            const schools = this.mapApiArrayToSchools(parsed, level);
            this.processRegionData(region, level, schools);
            return;
          }
        } catch (_) {}
        const schools = this.parseHtmlSchools(response.data);
        if (schools.length > 0) {
          this.processRegionData(region, level, schools);
        } else {
          this.logger.info(
            `${region} 파싱 결과가 비어있습니다. 원문 길이: ${response.data.length}`
          );
        }
      }
    } catch (error) {
      this.logger.error(`${region} 지역 확인 중 오류:`, error.message);
    }
  }

  mapApiArrayToSchools(items, level) {
    const levelMap = { N1: "1", N2: "2", N3: "3", N4: "4", N5: "5" };
    const target = levelMap[level] || String(level);
    const result = [];
    for (const it of items) {
      if (target && String(it.examLevel) !== target) continue;
      result.push({
        name: it.areaName || it.mapName || "",
        location: it.examAddr || "",
        capacity: it.maxPerson ? Number(it.maxPerson) : null,
        current: it.usePerson ? Number(it.usePerson) : null,
        percentage:
          typeof it.percent !== "undefined" ? Number(it.percent) : null,
      });
    }
    return result;
  }

  // 특정 학교만 필터링
  filterSchoolsByTarget(schools, targetSchoolName) {
    if (!targetSchoolName) return schools;
    return schools.filter(
      (school) =>
        school.name.includes(targetSchoolName) ||
        targetSchoolName.includes(school.name)
    );
  }

  // HTML 응답에서 학교/퍼센트 추출
  parseHtmlSchools(html) {
    const $ = cheerio.load(html);
    const results = [];

    // 1) 테이블/리스트 구조 일반 탐색
    $("table tr, ul li, .list li, .school, .row").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (!text) return;
      const percentMatch = text.match(/(\d{1,3})\s*%/);
      if (percentMatch) {
        const percentage = Number(percentMatch[1]);
        // 학교/장소명 후보: 괄호 포함 텍스트 또는 '학교', '중학교', '고등학교'
        const nameMatch = text.match(
          /([\p{L}\p{N}\s]+?(?:학교|중학교|고등학교|대학교|캠퍼스))/u
        );
        const locationMatch = text.match(/\(([^)]+)\)/);
        const name = nameMatch ? nameMatch[1].trim() : text.slice(0, 50);
        const location = locationMatch ? locationMatch[1].trim() : "";
        results.push({
          name,
          location,
          capacity: null,
          current: null,
          percentage,
        });
      }
    });

    // 2) 결과가 없으면 보다 직접적인 정규식 시도
    if (results.length === 0) {
      const regex = /([^<>{}\n]{2,80}?)(?:\(|\s)-?\s*(\d{1,3})%/g;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const name = m[1].replace(/\s+/g, " ").trim();
        const percentage = Number(m[2]);
        results.push({
          name,
          location: "",
          capacity: null,
          current: null,
          percentage,
        });
      }
    }

    // 중복 제거 (name+percentage 기준)
    const unique = new Map();
    for (const s of results) {
      const key = `${s.name}|${s.location}|${s.percentage}`;
      if (!unique.has(key)) unique.set(key, s);
    }
    return Array.from(unique.values());
  }

  processRegionData(region, level, schools) {
    const currentTime = new Date().toISOString();

    schools.forEach((school) => {
      const schoolKey = `${region}_${level}_${school.name}`;
      const currentStatus = {
        name: school.name,
        location: school.location,
        capacity: school.capacity,
        current: school.current,
        percentage: school.percentage,
        available: school.percentage < 100,
      };

      // 이전 상태와 비교
      const previousStatus = this.previousStatus.get(schoolKey);

      if (previousStatus) {
        // 상태 변화 감지
        if (
          previousStatus.percentage === 100 &&
          currentStatus.percentage < 100
        ) {
          // 자리가 생겼을 때
          this.sendNotification({
            type: "AVAILABLE",
            region: region,
            level: level,
            school: school.name,
            location: school.location,
            percentage: currentStatus.percentage,
            timestamp: currentTime,
            message: `🎉 자리가 생겼습니다! ${region} ${level} ${school.name} (${school.location}) - ${currentStatus.percentage}%`,
          });
        } else if (
          previousStatus.percentage < 100 &&
          currentStatus.percentage === 100
        ) {
          // 자리가 찼을 때
          this.sendNotification({
            type: "FULL",
            region: region,
            level: level,
            school: school.name,
            location: school.location,
            percentage: currentStatus.percentage,
            timestamp: currentTime,
            message: `❌ 자리가 찼습니다. ${region} ${level} ${school.name} (${school.location}) - ${currentStatus.percentage}%`,
          });
        }
      }

      // 현재 상태 저장
      this.previousStatus.set(schoolKey, currentStatus);

      // 로그 출력
      const statusIcon = currentStatus.available ? "🟢" : "🔴";
      this.logger.info(
        `${statusIcon} ${region} ${level} ${school.name} (${school.location}): ${currentStatus.percentage}%`
      );
    });
  }

  sendNotification(notification) {
    this.notifications.unshift(notification); // 최신 알림을 앞에 추가

    // 알림 개수 제한 (최대 100개)
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.logger.info(`알림: ${notification.message}`);

    // 텔레그램 알림 전송
    this.sendTelegramNotification(notification);

    // 파일 저장
    this.saveNotificationToFile(notification);
  }

  async sendTelegramNotification(notification) {
    if (!this.telegramBot || !this.telegramChatId) return;

    try {
      let emoji = "📢";
      if (notification.type === "AVAILABLE") emoji = "🎉";
      else if (notification.type === "FULL") emoji = "❌";
      else if (notification.type === "INFO")
        emoji = notification.message.includes("시작") ? "🚀" : "⏹️";

      const message = `${emoji} JLPT 알림\n\n${
        notification.message
      }\n\n시간: ${new Date(notification.timestamp).toLocaleString("ko-KR")}`;

      await this.telegramBot.sendMessage(this.telegramChatId, message);
      this.logger.info("텔레그램 알림 전송 완료");
    } catch (error) {
      this.logger.error("텔레그램 알림 전송 실패:", error.message);
    }
  }

  async saveNotificationToFile(notification) {
    try {
      const logDir = "logs";
      await fs.mkdir(logDir, { recursive: true });

      const logFile = path.join(logDir, "notifications.json");
      let notifications = [];

      try {
        const data = await fs.readFile(logFile, "utf8");
        notifications = JSON.parse(data);
      } catch (error) {
        // 파일이 없거나 파싱 오류인 경우 빈 배열로 시작
      }

      notifications.unshift(notification);

      // 최대 1000개 알림만 저장
      if (notifications.length > 1000) {
        notifications = notifications.slice(0, 1000);
      }

      await fs.writeFile(logFile, JSON.stringify(notifications, null, 2));
    } catch (error) {
      this.logger.error("알림 파일 저장 중 오류:", error.message);
    }
  }
}

module.exports = JlptMonitor;
