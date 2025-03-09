import {
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

const GEMINI_CONFIGURATION: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

const GEMINI_STUDY_PROMPT = `Soy un estudiante universitario, y estoy preparando una materia de mi carrera, 
relacionada al documento que te adjunto. Quiero que realices, por favor, un resumen de los puntos más importantes 
de este libro, considerando todo aquello que sería evaluable en un examen. Explica el lenguaje específico del 
documento, de ser necesario, y considera que el enfoque de este estudio es académico universitario. Estudia en detalle
el contenido del documento, para que pueda realizarte preguntas para profundizar luego. Responde directamente
con lo que hallas aprendido y consideres importante del documento, sin agregar preámbulos ni formalismos.`;

export class GeminiFeature {
  private readonly ai: GoogleGenerativeAI;
  private readonly aiFileManager: GoogleAIFileManager;
  private readonly aiModel: GenerativeModel;

  constructor(
    private readonly env: EnvFeature,
    private readonly fileSystem: FileSystemFeature
  ) {
    this.ai = new GoogleGenerativeAI(this.env.GEMINI_TOKEN);
    this.aiFileManager = new GoogleAIFileManager(this.env.GEMINI_TOKEN);
    this.aiModel = this.ai.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });
  }

  private generateHistoryFromFiles(files: FileMetadataResponse[]) {
    return [
      {
        role: "user",
        parts: files.map((file) => ({
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri,
          },
        })),
      },
    ];
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
    const aiSession = this.aiModel.startChat({
      generationConfig: GEMINI_CONFIGURATION,
      history: this.generateHistoryFromFiles(attachments),
    });
    const { response } = await aiSession.sendMessage(GEMINI_STUDY_PROMPT);
    return response.text();
  }
}
