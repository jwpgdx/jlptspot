# Render 배포 가이드

## 🚀 Render 배포 방법

### 1. Render 계정 생성
- [render.com](https://render.com)에서 계정 생성
- GitHub 계정으로 로그인

### 2. 새 서비스 생성
1. **New +** 버튼 클릭
2. **Web Service** 선택
3. GitHub 저장소 연결: `jwpgdx/jlptspot`
4. 설정:
   - **Name**: `jlpt-monitor`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 3. 환경 변수 설정
Render 대시보드에서 **Environment** 탭에서 다음 변수들 추가:

```
COOKIE=PHPSESSID=catpoa3cvsv1eenbqmncpkelje; nowdays=read_2025-09-19; pop=NO
TELEGRAM_TOKEN=8078482638:AAFJDMfo-UaKj1-AaJAsAvolEtBic_PTDS0
TELEGRAM_CHAT=6632560721
NODE_ENV=production
```

### 4. 배포 완료
- **Deploy** 버튼 클릭
- 배포 완료 후 URL 확인 (예: `https://jlpt-monitor.onrender.com`)

## 🔧 프로덕션 모니터링 실행

배포 후 Render 콘솔에서 다음 명령어로 모니터링 시작:

```bash
npm run monitor:prod
```

## 📱 기능

- **웹 인터페이스**: `https://your-app.onrender.com`
- **신일중학교 모니터링**: 30초마다 확인
- **텔레그램 알림**: 자리 생김/마감 시 즉시 알림
- **로그 확인**: Render 로그에서 실시간 상태 확인

## ⚠️ 주의사항

- Render 무료 플랜은 30분 후 슬립 모드로 전환됩니다
- 쿠키가 만료되면 환경 변수에서 업데이트해야 합니다
- 모니터링은 수동으로 시작해야 합니다 (자동 시작 안됨)
