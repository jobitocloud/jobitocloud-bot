import {
  ChatSession,
  GenerationConfig,
  GenerativeModel,
  GoogleGenerativeAI,
} from "@google/generative-ai";
import {
  FileMetadataResponse,
  GoogleAIFileManager,
} from "@google/generative-ai/server";
import type { EnvFeature } from "../env/env";
import { FileSystemFeature } from "../filesystem/filesystem";
import { readFileSync } from "fs";
import { resolve } from "path";

const GEMINI_CONFIGURATION: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export class GeminiFeature {
  private readonly ai: GoogleGenerativeAI;
  private readonly aiFileManager: GoogleAIFileManager;
  private readonly aiModel: GenerativeModel;
  private prompts: {
    naturalCommands: string[];
    study: string[];
  } = {
    naturalCommands: [],
    study: [],
  };
  private aiSession: ChatSession = {} as ChatSession;

  constructor(
    private readonly env: EnvFeature,
    private readonly fileSystem: FileSystemFeature
  ) {
    this.loadPrompts();

    this.ai = new GoogleGenerativeAI(this.env.GEMINI_TOKEN);
    this.aiFileManager = new GoogleAIFileManager(this.env.GEMINI_TOKEN);
    this.aiModel = this.ai.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: GEMINI_CONFIGURATION,
      systemInstruction: {
        role: "user",
        parts: this.prompts.naturalCommands.map((line) => ({ text: line })),
      },
    });

    this.setup();
  }

  private loadPrompts() {
    this.prompts.naturalCommands = readFileSync(
      resolve(__dirname, "prompts/natural-commands.md")
    )
      .toString("utf8")
      .replace(/<FS_HOME>/g, this.env.FS_HOME)
      .split("\n\n");

    this.prompts.study = readFileSync(resolve(__dirname, "prompts/study.md"))
      .toString("utf8")
      .split("\n\n");
  }

  private setup() {
    this.aiSession = this.aiModel.startChat();
  }

  private generatePartFromFiles(files: FileMetadataResponse[]) {
    return files.map((file) => ({
      fileData: {
        mimeType: file.mimeType,
        fileUri: file.uri,
      },
    }));
  }

  private async uploadToGemini(fileName: string) {
    const fileData = this.fileSystem.readFile(fileName);
    const { file } = await this.aiFileManager.uploadFile(fileData, {
      mimeType:
        this.fileSystem.getMimeTypeForFile(fileName) ||
        "application/octet-stream",
      displayName: fileName,
    });
    return file;
  }

  async summarizeDocument(fileName: string): Promise<string> {
    const attachments = [await this.uploadToGemini(fileName)];
    const { response } = await this.aiSession.sendMessage([
      ...this.prompts.study,
      ...this.generatePartFromFiles(attachments),
    ]);
    return response.text();
  }

  async parseNaturalCommand(commandPrompt: string): Promise<string> {
    const { response } = await this.aiSession.sendMessage(commandPrompt);
    return response.text();
  }
}
