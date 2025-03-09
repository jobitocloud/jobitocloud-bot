import TelegramBot from "node-telegram-bot-api";
import {
  AuthFeature,
  EnvFeature,
  FileSystemFeature,
  LibraryFeature,
} from "./features";
import { GeminiFeature } from "./features/gemini/gemini";
import { CommandHandlerDictionary } from "./types";

export class JobitoCloudBot {
  private readonly bot: TelegramBot;
  private readonly auth: AuthFeature;
  private readonly env: EnvFeature;
  private readonly fileSystem: FileSystemFeature;
  private readonly gemini: GeminiFeature;
  private readonly library: LibraryFeature;

  private commandHandlers = {} as CommandHandlerDictionary;

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

    this.enableSyntaxCommands();
    this.enableNaturalCommands();
  }

  private enableSyntaxCommands() {
    const libraryCommands = this.library.getCommands();

    this.bot.setMyCommands([...libraryCommands.menu]);

    this.commandHandlers = { ...libraryCommands.handlers };

    for (const [command, handler] of Object.entries(this.commandHandlers)) {
      this.bot.onText(new RegExp(command), handler);
    }
  }

  private enableNaturalCommands() {
    this.bot.onText(/^[^\/]/, async (message) => {
      console.log("Interpreting", message.text);
      const commandPrompt = await this.gemini.parseNaturalCommand(
        message.text as string
      );
      console.log("Parsed as", commandPrompt);
      const promptAsMessage = JSON.parse(
        JSON.stringify(message)
      ) as TelegramBot.Message;
      promptAsMessage.text = commandPrompt;
      const [commandToExecute] = commandPrompt.split(" ");

      await this.bot.sendChatAction(message.chat.id, "typing");
      await this.commandHandlers[`^${commandToExecute}`](promptAsMessage, null);
    });
  }
}
