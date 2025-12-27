/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_ENABLE_REGISTRATION?: string;
  readonly VITE_ENABLE_PASSWORD_RESET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

