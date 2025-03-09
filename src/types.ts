import type TelegramBot from "node-telegram-bot-api";

export type CommandHandlerDictionary = Record<
  string,
  (msg: TelegramBot.Message, match: RegExpExecArray | null) => Promise<void>
>;
