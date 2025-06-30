/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HORIZEN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.bin" {
  const content: Uint8Array;
  export default content;
}
