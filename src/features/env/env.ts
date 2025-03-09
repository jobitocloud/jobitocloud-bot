export class EnvFeature {
  public BOT_TOKEN: string;
  public ALLOWED_USERS: string[];
  public FS_HOME: string;
  public GEMINI_TOKEN: string;

  constructor() {
    this.BOT_TOKEN = process.env["BOT_TOKEN"] as string;
    this.ALLOWED_USERS = (process.env["ALLOWED_USERS"] as string).split(",");
    this.FS_HOME = process.env["FS_HOME"] as string;
    this.GEMINI_TOKEN = process.env["GEMINI_TOKEN"] as string;
  }
}
