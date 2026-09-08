/**
 * Os demos são arquivos `.vue` de verdade em `app/demos/<Componente>/<id>.vue`,
 * e não recorte de regex do fonte da página: dois globs sobre a mesma pasta dão
 * o componente para montar e o texto para mostrar, então o código na tela é
 * literalmente o que rodou — e passa por `vue-tsc` como qualquer outro arquivo.
 */
import type { Component } from "vue";

const components = import.meta.glob<{ default: Component }>("../demos/**/*.vue");

const sources = import.meta.glob<string>("../demos/**/*.vue", {
    query: "?raw",
    import: "default"
});

const key = (src: string) => `../demos/${src}.vue`;

/** `"Text/basico"` → o loader do `app/demos/Text/basico.vue`. */
export const demoComponent = (src: string) => components[key(src)];

/** `"Text/basico"` → o loader do texto cru do mesmo arquivo. */
export const demoSource = (src: string) => sources[key(src)];

/** Os `src` que existem, para o `<Demo>` avisar em vez de renderizar vazio. */
export const demoNames = () =>
    Object.keys(components).map((path) => path.slice("../demos/".length, -".vue".length));