declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
    PORT: string;
    MONGO_URI:string;
  }
}
