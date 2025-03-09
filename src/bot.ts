import TelegramBot from "node-telegram-bot-api";
import {
  AuthFeature,
  EnvFeature,
  FileSystemFeature,
  LibraryFeature,
} from "./features";
import { GeminiFeature } from "./features/gemini/gemini";

export class JobitoCloudBot {
  private readonly bot: TelegramBot;
  private readonly auth: AuthFeature;
  private readonly env: EnvFeature;
  private readonly fileSystem: FileSystemFeature;
  private readonly gemini: GeminiFeature;
  private readonly library: LibraryFeature;

  constructor() {
    // Core System
    this.env = new EnvFeature();
    this.bot = new TelegramBot(this.env.BOT_TOKEN, {
      polling: true,
      filepath: false,
    });
    this.auth = new AuthFeature(this.bot, this.env);
    this.fileSystem = new FileSystemFeature(this.env);

    // AI System
    this.gemini = new GeminiFeature(this.env, this.fileSystem);

    // Library Feature
    this.library = new LibraryFeature(
      this.bot,
      this.auth,
      this.fileSystem,
      this.gemini
    );

    this.enableCommands();
  }

  private enableCommands() {
    this.bot.setMyCommands([...this.library.getCommands()]);
  }
}
