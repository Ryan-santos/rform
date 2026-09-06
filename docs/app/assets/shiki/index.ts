import type { ThemeRegistrationRaw } from "shiki/types";

import raw from "./shades-of-purple.json";

/** O nome pelo qual o highlighter registra e resolve o tema. */
export const themeName = raw.name;

/**
 * O tema do editor — Shades of Purple (Super Dark), de Ahmad Awais (MIT), com o
 * `colors` reduzido às duas chaves que o shiki lê.
 *
 * `settings` é o nome que o vscode-textmate dá ao que o VS Code chama de
 * `tokenColors`, e `ThemeRegistrationRaw` herda dele a chave obrigatória — dar
 * as duas é o que faz o JSON de um tema do editor satisfazer o tipo sem cast.
 */
export const shikiTheme: ThemeRegistrationRaw = {
    ...raw,
    type: "dark",
    settings: raw.tokenColors
};