// Minimal stub for the Nuxt `#app` alias used inside src/runtime modules.
// We only need useAppConfig() to return an empty config so unit-level imports
// of `.vue` helpers do not crash when the SFC <script setup> is also loaded.
export const useAppConfig = () => ({});