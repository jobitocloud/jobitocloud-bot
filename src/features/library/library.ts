import TelegramBot from "node-telegram-bot-api";
import type { AuthFeature } from "../auth/auth";
import type { FileSystemFeature } from "../filesystem/filesystem";
import { GeminiFeature } from "../gemini/gemini";

const COMMAND_LIBFIND = /^\/libfind/;
const COMMAND_LIBSTUDY = /^\/libstudy/;

export class LibraryFeature {
  constructor(
    private readonly bot: TelegramBot,
    private readonly auth: AuthFeature,
    private readonly fileSystem: FileSystemFeature,
    private readonly gemini: GeminiFeature
  ) {
    this.handleLibFindCommand();
    this.handleLibStudyCommand();
  }

  private throwNoFileSpecifiedError(message: TelegramBot.Message) {
    this.bot.sendMessage(
      message.chat.id,
      "Ingresá el nombre o parte del nombre que estás buscando. Ej: /libfind Alicia"
    );
  }

  private throwFileNotFoundError(message: TelegramBot.Message) {
    this.bot.sendMessage(
      message.chat.id,
      "Ingresá el nombre o parte del nombre que estás buscando. Ej: /libfind Alicia"
    );
  }

  sendFile(message: TelegramBot.Message, file: Buffer, filename: string) {
    this.bot.sendChatAction(message.chat.id, "upload_document");
    this.bot.sendDocument(
      message.chat.id,
      file,
      {
        caption: "Aquí está el archivo que me pediste.",
      },
      {
        filename,
        contentType:
          this.fileSystem.getMimeTypeForFile(filename) ||
          "application/octet-stream",
      }
    );
  }

  handleLibFindCommand() {
    this.bot.onText(COMMAND_LIBFIND, (message) => {
      const bookToFind = message.text!.replace(COMMAND_LIBFIND, "").trim();

      if (!this.auth.isChatAllowed(message.chat.id)) {
        this.auth.throwUnauthorizedError(message);
        return;
      }
      if (!bookToFind) {
        this.throwNoFileSpecifiedError(message);
        return;
      }

      const files = this.fileSystem.findFiles(bookToFind);

      if (files.length === 0) {
        this.throwFileNotFoundError(message);
      }

      if (files.length === 1) {
        const foundFile = this.fileSystem.readFile(files[0]);
        this.sendFile(message, foundFile, files[0]);
        return;
      }

      const handleSelectedFile = (query: TelegramBot.CallbackQuery) => {
        if (!query.data?.startsWith("/libfind:")) {
          return;
        }

        const selectedFile = query.data.replace("/libfind:", "");
        const foundFile = this.fileSystem.readFile(selectedFile);
        this.sendFile(message, foundFile, files[0]);

        this.bot.off("callback_query", handleSelectedFile.bind(this));
      };

      this.bot.on("callback_query", handleSelectedFile.bind(this));

      this.bot.sendMessage(
        message.chat.id,
        "Encontré varios archivos con ese nombre. ¿Cuál estás buscando?",
        {
          reply_markup: {
            inline_keyboard: files
              .filter((file) => file.includes(bookToFind))
              .map((file) => [
                {
                  callback_data: "/libfind:" + file,
                  text: file,
                },
              ]),
          },
        }
      );
    });
  }

  handleLibStudyCommand() {
    this.bot.onText(COMMAND_LIBSTUDY, async (message) => {
      const bookToFind = message.text!.replace(COMMAND_LIBSTUDY, "").trim();

      if (!this.auth.isChatAllowed(message.chat.id)) {
        this.auth.throwUnauthorizedError(message);
        return;
      }
      if (!bookToFind) {
        this.throwNoFileSpecifiedError(message);
        return;
      }

      const files = this.fileSystem.findFiles(bookToFind);

      if (files.length === 0) {
        this.throwFileNotFoundError(message);
      }

      if (files.length === 1) {
        this.bot.sendChatAction(message.chat.id, "typing");
        this.gemini.summarizeDocument(files[0]).then(async (response) => {
          const paragraphs = response.split("\n\n");
          for (const paragraph of paragraphs) {
            await this.bot.sendMessage(message.chat.id, paragraph);
          }
        });
        return;
      }

      const handleSelectedFile = (query: TelegramBot.CallbackQuery) => {
        if (!query.data?.startsWith("/libstudy:")) {
          return;
        }

        const selectedFile = query.data.replace("/libstudy:", "");
        this.bot.sendChatAction(message.chat.id, "typing");
        this.gemini.summarizeDocument(selectedFile).then(async (response) => {
          console.log(response);
          const paragraphs = response.split("\n\n");
          for (const paragraph of paragraphs) {
            await this.bot.sendMessage(message.chat.id, paragraph);
          }
        });

        this.bot.off("callback_query", handleSelectedFile.bind(this));
      };

      this.bot.on("callback_query", handleSelectedFile.bind(this));

      this.bot.sendMessage(
        message.chat.id,
        "Encontré varios archivos con ese nombre. ¿Con cuál vamos a trabajar?",
        {
          reply_markup: {
            inline_keyboard: files
              .filter((file) => file.includes(bookToFind))
              .map((file) => [
                {
                  callback_data: "/libstudy:" + file,
                  text: file,
                },
              ]),
          },
        }
      );
    });
  }

  getCommands(): TelegramBot.BotCommand[] {
    return [
      {
        command: "/libfind",
        description: "Buscar libros en Jobito Cloud",
      },
      {
        command: "/libstudy",
        description: "Estudia con IA un libro en Jobito Cloud",
      },
    ];
  }
}
