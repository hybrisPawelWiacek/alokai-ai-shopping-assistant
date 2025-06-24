export interface EnvFile {
  sourceFileName: string;
  targetFileName: string;
  symlink: boolean;
}

export type EnvFilePredicate = (appPath: string, envFile: EnvFile) => boolean;
