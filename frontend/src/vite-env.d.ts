/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_DOMAIN: string
  readonly VITE_BACKEND_PORT: string
  readonly VITE_BACKEND_PROTOCOL: string
  readonly VITE_PRODUCTION_DOMAIN: string
  readonly VITE_PRODUCTION_PROTOCOL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}