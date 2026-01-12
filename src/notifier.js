const TelegramBot = require("node-telegram-bot-api");
const winston = require("winston");

class Notifier {
    constructor(logger) {
        this.logger = logger;
        this.bot = null;
        this.chatId = null;
    }

    setTelegramConfig(token, chatId) {
        if (token && chatId) {
            this.bot = new TelegramBot(token, { polling: false });
            this.chatId = chatId;
            this.logger.info(`텔레그램 알림 설정됨 - Chat ID: ${chatId}`);
        }
    }

    async send(message) {
        if (!this.bot || !this.chatId) {
            this.logger.warn("텔레그램 봇이 설정되지 않아 메시지를 보낼 수 없습니다.");
            return;
        }

        try {
            await this.bot.sendMessage(this.chatId, message);
            this.logger.info("텔레그램 메시지 전송 성공");
        } catch (error) {
            this.logger.error(`텔레그램 메시지 전송 실패: ${error.message}`);
        }
    }

    async sendSuccess(siteName, id, message) {
        const formattedMessage = `✅ [${siteName}] 출석체크 성공!\n🆔 ${id}\n${message}`;
        await this.send(formattedMessage);
    }

    async sendError(siteName, id, errorMsg) {
        const formattedMessage = `❌ [${siteName}] 출석체크 실패\n🆔 ${id}\n⚠️ ${errorMsg}`;
        await this.send(formattedMessage);
    }
}

module.exports = Notifier;
