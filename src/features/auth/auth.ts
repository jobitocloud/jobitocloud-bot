import type TelegramBot from "node-telegram-bot-api";
import type { EnvFeature } from "../env/env";
import debug, { Debugger } from "debug";

export class AuthFeature {
  log: Debugger;

  private allowedChats: Record<number, boolean> = {};

  constructor(
    private readonly bot: TelegramBot,
    private readonly env: EnvFeature
  ) {
    this.log = debug("jcb:features:auth");
    bot.on("text", (message) => {
      this.checkIfUserIsAllowed(message);
    });
  }

  isChatAllowed(chatId: number) {
    return this.allowedChats[chatId] === true;
  }

  throwUnauthorizedError(message: TelegramBot.Message) {
    this.bot.sendMessage(
      message.chat.id,
      "No estás autorizado a utilizar este bot."
    );
  }

  checkIfUserIsAllowed(message: TelegramBot.Message) {
    const messageSender = message.chat.username as string;
    this.log(`Checking if ${messageSender} is in ALLOWED_USERS`);
    if (this.env.ALLOWED_USERS.includes(message.chat.username as string)) {
      this.log(`${messageSender} found`);
      this.allowedChats[message.chat.id] = true;
      return;
    }

    this.log(`${messageSender} is not in ALLOWED_USERS`);
    this.allowedChats[message.chat.id] = false;
  }
}
