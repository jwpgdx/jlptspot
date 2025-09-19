# JLPT 접수현황 모니터링 시스템

일본어 능력시험(JLPT) 접수현황을 실시간으로 모니터링하고, 자리가 나면 즉시 알림을 받을 수 있는 Node.js 기반 시스템입니다.

## 🚀 주요 기능

- **실시간 모니터링**: 30초마다 접수현황을 자동으로 확인
- **다중 지역 지원**: 여러 지역을 동시에 모니터링 가능
- **레벨별 모니터링**: N1, N2, N3, N4, N5 레벨별로 모니터링
- **즉시 알림**: 자리가 생기면 즉시 알림 제공
- **웹 인터페이스**: 사용하기 쉬운 웹 대시보드
- **알림 히스토리**: 과거 알림 내역 확인 가능

## 📋 사전 요구사항

- Node.js 14.0 이상
- npm 또는 yarn

## 🛠️ 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 서버 실행

```bash
# 개발 모드 (자동 재시작)
npm run dev

# 프로덕션 모드
npm start
```

### 3. 웹 인터페이스 접속

브라우저에서 `http://localhost:3000`으로 접속하여 웹 인터페이스를 사용할 수 있습니다.

## 📖 사용 방법

1. **웹 인터페이스 접속**: `http://localhost:3000`
2. **지역 선택**: 모니터링하고 싶은 지역들을 선택 (복수 선택 가능)
3. **레벨 선택**: N1, N2, N3, N4, N5 중 원하는 레벨 선택
4. **모니터링 시작**: "모니터링 시작" 버튼 클릭
5. **알림 확인**: 자리가 생기면 실시간으로 알림을 받을 수 있습니다

## 🔧 설정

### 환경 변수

`.env` 파일을 생성하여 다음 설정을 할 수 있습니다:

```env
PORT=3000
LOG_LEVEL=info
```

### 모니터링 설정

`config/config.js` 파일에서 다음 설정을 변경할 수 있습니다:

- `checkInterval`: 확인 주기 (초 단위, 기본값: 30초)
- `monitoredRegions`: 모니터링할 지역 목록
- `targetLevels`: 모니터링할 레벨 목록

## 📁 프로젝트 구조

```
jlpt-monitor/
├── app.js                 # 메인 서버 파일
├── package.json           # 프로젝트 설정 및 의존성
├── config/
│   └── config.js         # 설정 파일
├── src/
│   └── jlptMonitor.js    # JLPT 모니터링 로직
├── public/
│   └── index.html        # 웹 인터페이스
├── logs/                 # 로그 파일들
│   ├── jlpt-monitor.log  # 서버 로그
│   └── notifications.json # 알림 히스토리
└── README.md
```

## 🔍 API 엔드포인트

### GET /api/status

현재 모니터링 상태를 확인합니다.

**응답 예시:**

```json
{
  "status": "running",
  "monitoredRegions": ["고양", "서울"],
  "lastCheck": "2025-09-19T14:39:46.000Z",
  "notifications": [...]
}
```

### POST /api/start-monitoring

모니터링을 시작합니다.

**요청 본문:**

```json
{
  "regions": ["고양", "서울"],
  "level": "N2"
}
```

### POST /api/stop-monitoring

모니터링을 중지합니다.

## 📊 로그 및 모니터링

- **서버 로그**: `logs/jlpt-monitor.log`
- **알림 히스토리**: `logs/notifications.json`
- **콘솔 출력**: 실시간 상태 확인

## ⚠️ 주의사항

1. **API 사용량**: 과도한 요청으로 인한 IP 차단을 방지하기 위해 적절한 간격으로 요청합니다.
2. **네트워크 연결**: 안정적인 인터넷 연결이 필요합니다.
3. **법적 고려사항**: 해당 사이트의 이용약관을 준수하여 사용하세요.

## 🐛 문제 해결

### 자주 발생하는 문제

1. **연결 오류**: 네트워크 연결을 확인하고 방화벽 설정을 점검하세요.
2. **API 응답 없음**: 사이트가 점검 중이거나 API가 변경되었을 수 있습니다.
3. **알림이 안 옴**: 모니터링이 정상적으로 시작되었는지 확인하세요.

### 로그 확인

```bash
# 서버 로그 확인
tail -f logs/jlpt-monitor.log

# 알림 히스토리 확인
cat logs/notifications.json
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.

---

**면책 조항**: 이 도구는 교육 및 개인적 용도로만 사용되어야 합니다. JLPT 공식 사이트의 이용약관을 준수하여 사용하시기 바랍니다.
