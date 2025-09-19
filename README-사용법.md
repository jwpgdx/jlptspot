# JLPT 모니터링 시스템 - 간단 사용법

## 🚀 빠른 시작

### 방법 1: 배치 파일 실행 (가장 간단)

```bash
start-monitor.bat
```

### 방법 2: PowerShell 스크립트 실행

```powershell
.\start-monitor.ps1
```

### 방법 3: npm 스크립트 실행

```bash
npm run monitor
```

## 📱 현재 설정

- **모니터링 대상**: 신일중학교 (고양) N2
- **확인 주기**: 15초마다
- **알림**: 텔레그램으로 즉시 전송
- **연도/회차**: 2025년 12월 (2회차)

## 🔧 설정 변경

### 주기 변경 (예: 10초)

```bash
node headless.js --regions=15 --level=N2 --interval=10 --year=2025 --times=2 --cookie="쿠키값" --telegram-token="봇토큰" --telegram-chat="채팅ID"
```

### 다른 레벨 모니터링 (예: N1)

```bash
node headless.js --regions=15 --level=N1 --interval=15 --year=2025 --times=2 --cookie="쿠키값" --telegram-token="봇토큰" --telegram-chat="채팅ID"
```

## 📋 알림 종류

1. **🚀 모니터링 시작**: 프로그램 시작 시
2. **🎉 자리 생김**: 신일중학교에 자리가 생겼을 때
3. **❌ 자리 참**: 신일중학교 자리가 찼을 때
4. **⏹️ 모니터링 중지**: 프로그램 종료 시

## ⚠️ 주의사항

- 쿠키가 만료되면 새로 받아서 설정해야 합니다
- 텔레그램 봇과 1:1 채팅을 시작해야 알림을 받을 수 있습니다
- Ctrl+C로 모니터링을 중지할 수 있습니다

## 📁 파일 구조

```
jlpt-monitor/
├── start-monitor.bat      # Windows 배치 파일
├── start-monitor.ps1      # PowerShell 스크립트
├── headless.js            # 헤드리스 모니터
├── src/jlptMonitor.js     # 모니터링 로직
└── logs/                  # 로그 파일들
    ├── jlpt-monitor.log
    └── notifications.json
```
