import { readdirSync, readFileSync } from "fs";
import mime from "mime";
import type { EnvFeature } from "../env/env";
import { resolve } from "path";

export class FileSystemFeature {
  readonly rootPath: string;

  constructor(private readonly env: EnvFeature) {
    this.rootPath = this.env.FS_HOME;
  }

  findFiles(partialName: string): string[] {
    const sanitizedPartialName = partialName
      .replace(/\.\./g, "")
      .replace(/\.\//g, "")
      .toLowerCase();
    const files = readdirSync(this.rootPath);
    return files.filter((file) =>
      file.toLowerCase().includes(sanitizedPartialName)
    );
  }

  readFile(file: string): Buffer {
    return readFileSync(resolve(this.rootPath, file));
  }

  getMimeTypeForFile(file: string): string | null {
    return mime.getType(file);
  }
}
