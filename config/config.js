module.exports = {
  // 모니터링할 지역 목록 (예시)
  monitoredRegions: [
    "고양",
    "서울",
    "부산",
    "대구",
    "인천",
    "광주",
    "대전",
    "울산",
    "세종",
    "경기",
    "강원",
    "충북",
    "충남",
    "전북",
    "전남",
    "경북",
    "경남",
    "제주",
  ],

  // 모니터링할 레벨 (N1, N2, N3, N4, N5)
  targetLevels: ["N1", "N2", "N3", "N4", "N5"],

  // API 설정
  api: {
    baseUrl: "https://www.jlpt.or.kr",
    endpoint: "/INC/examSchoolAjax.php",
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 5000,
  },

  // 모니터링 설정
  monitoring: {
    checkInterval: 30, // 초 단위
    maxNotifications: 100,
    logRetentionDays: 30,
  },

  // 서버 설정
  server: {
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
  },
};
