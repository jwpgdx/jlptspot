# GitHub Actions 슬립 방지 설정

## 🔧 GitHub Secrets 설정

### 1. GitHub 저장소에서 Secrets 설정
1. `jwpgdx/jlptspot` 저장소로 이동
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 클릭
4. 다음 Secret 추가:

**RENDER_URL**
- Name: `RENDER_URL`
- Value: `https://jlpt-monitor.onrender.com`

## 🚀 자동 슬립 방지 기능

### 1. Keep Alive (25분마다)
- **파일**: `.github/workflows/keep-alive.yml`
- **동작**: 25분마다 서버에 요청을 보내서 슬립 방지
- **실행 시간**: `*/25 * * * *` (25분마다)

### 2. Health Check (5분마다)
- **파일**: `.github/workflows/health-check.yml`
- **동작**: 5분마다 서버 상태 확인 후 필요시 깨우기
- **실행 시간**: `*/5 * * * *` (5분마다)

## 📋 설정 완료 후 확인

### 1. GitHub Actions 활성화
- 저장소의 **Actions** 탭에서 워크플로우 활성화
- "I understand my workflows, go ahead and enable them" 클릭

### 2. 워크플로우 실행 확인
- **Actions** 탭에서 워크플로우가 정상 실행되는지 확인
- 초록색 체크마크가 나타나면 성공

### 3. Render 로그 확인
- Render 대시보드의 **Logs** 탭에서 요청 로그 확인
- GitHub Actions에서 보내는 요청이 보이면 정상 작동

## ⚠️ 주의사항

- GitHub Actions는 무료 플랜에서 월 2,000분까지 사용 가능
- 25분마다 실행하면 월 약 1,440분 사용 (무료 범위 내)
- 워크플로우가 실패하면 수동으로 재실행 가능

## 🔍 문제 해결

### 워크플로우가 실행되지 않는 경우
1. GitHub Secrets가 올바르게 설정되었는지 확인
2. Actions 탭에서 워크플로우가 활성화되었는지 확인
3. 저장소 설정에서 Actions가 활성화되어 있는지 확인

### 서버가 여전히 슬립하는 경우
1. RENDER_URL이 정확한지 확인
2. 워크플로우 로그에서 에러 메시지 확인
3. 수동으로 워크플로우 실행해보기
