const { chromium } = require("playwright");
const accounts = require("../config/accounts");

class AttendanceChecker {
    constructor(logger, notifier) {
        this.logger = logger;
        this.notifier = notifier;
    }

    async runAll() {
        this.logger.info("모든 계정 출석체크 시작...");
        const results = [];

        // Boseong Mall
        for (const account of accounts.boseongMall) {
            results.push(await this.checkBoseongMall(account));
        }

        // Deli Shops
        for (const account of accounts.deliShops) {
            results.push(await this.checkDeliShops(account));
        }

        this.logger.info("모든 계정 출석체크 완료. 결과 집계 중...");
        await this.sendSummary(results);
    }

    async sendSummary(results) {
        const summaryLines = results.map(r => {
            const icon = r.success ? '✅' : '❌';
            return `${icon} [${r.site}] ${r.id}\n   └ ${r.message}`;
        });

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        const header = `📢 출석체크 완료 (${successCount}/${totalCount})`;

        const fullMessage = `${header}\n\n${summaryLines.join('\n\n')}`;
        await this.notifier.send(fullMessage);
    }

    async checkBoseongMall(account) {
        const { id, pw } = account;
        this.logger.info(`[보성몰] ${id} 출석체크 시도 중...`);
        let browser = null;
        let result = { site: '보성몰', id, success: false, message: '' };

        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Login
            await page.goto("https://boseongmall.co.kr/member/login.html");
            await page.waitForLoadState('networkidle');

            const idInput = page.locator('#member_id').first();
            const pwInput = page.locator('#member_passwd').first();

            if (await idInput.isVisible()) {
                await idInput.fill(id);
                await pwInput.fill(pw);
                const loginBtn = page.locator('.loginBtn, .btn_login').first();
                await loginBtn.click();
            } else {
                throw new Error("로그인 입력 필드를 찾을 수 없습니다.");
            }

            await page.waitForLoadState('networkidle');

            // Go to Stamp Page
            await page.goto("https://boseongmall.co.kr/attend/stamp.html");
            await page.waitForLoadState('networkidle');

            let dialogMessage = "";
            page.on('dialog', async dialog => {
                dialogMessage = dialog.message();
                await dialog.accept();
            });

            // Click Stamp Button
            const stampBtn = page.locator('#attendWriteForm .btnSubmitFix').first();

            if (await stampBtn.isVisible()) {
                await stampBtn.click();
                this.logger.info(`[보성몰] ${id} 출석체크 버튼 클릭 완료. 다이얼로그: ${dialogMessage}`);
                result.success = true;
                result.message = `성공 (메시지: ${dialogMessage || "없음"})`;
            } else {
                this.logger.warn(`[보성몰] ${id} 출석체크 버튼(.btnSubmitFix)을 찾을 수 없습니다.`);
                const title = await page.title();
                this.logger.info(`[보성몰] 현재 페이지 제목: ${title}`);
                result.message = "버튼 찾기 실패 (관리자 확인 필요)";
            }

            await page.waitForTimeout(2000);

        } catch (error) {
            this.logger.error(`[보성몰] ${id} 실패: ${error.message}`);
            result.message = `오류: ${error.message}`;
        } finally {
            if (browser) await browser.close();
        }

        return result;
    }

    async checkDeliShops(account) {
        const { id, pw } = account;
        this.logger.info(`[딜리샵] ${id} 출석체크 시도 중...`);
        let browser = null;
        let result = { site: '딜리샵', id, success: false, message: '' };

        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Login
            await page.goto("https://deli-shops.net/login/");
            await page.waitForLoadState('networkidle');

            await page.fill('input[name="user_login"]', id);
            await page.fill('input[name="user_pw"]', pw);

            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => { }),
                page.click('.login-button')
            ]);

            await page.waitForTimeout(3000);

            const currentUrl = page.url();
            this.logger.info(`[딜리샵] 로그인 후 현재 URL: ${currentUrl}`);

            if (!currentUrl.includes('/mypage/')) {
                this.logger.info(`[딜리샵] 마이페이지로 이동합니다.`);
                await page.goto("https://deli-shops.net/mypage/");
                await page.waitForLoadState('networkidle');
            }

            // Click '오늘 출석 체크하기'
            const checkBtn = page.locator('.calendar_btn button')
                .filter({ hasText: '출석' })
                .locator('visible=true')
                .first();

            if (await checkBtn.isVisible()) {
                await checkBtn.click();
                await page.waitForLoadState('networkidle');
                const resultUrl = page.url();

                this.logger.info(`[딜리샵] ${id} 출석체크 버튼 클릭 성공.`);
                result.success = true;
                result.message = `성공 (URL: ${resultUrl})`;

            } else {
                if (await page.getByText('출석체크 완료').isVisible()) {
                    this.logger.info(`[딜리샵] ${id} 이미 출석체크가 완료되었습니다.`);
                    result.success = true;
                    result.message = "이미 완료됨";
                } else {
                    this.logger.warn(`[딜리샵] ${id} 출석체크 버튼을 찾을 수 없습니다.`);
                    const title = await page.title();
                    result.message = `버튼 못찾음 (제목: ${title})`;
                }
            }

        } catch (error) {
            this.logger.error(`[딜리샵] ${id} 실패: ${error.message}`);
            console.error(`[딜리샵 ERROR] ${error.message}`);
            result.message = `오류: ${error.message}`;
        } finally {
            if (browser) await browser.close();
        }

        return result;
    }
}

module.exports = AttendanceChecker;

