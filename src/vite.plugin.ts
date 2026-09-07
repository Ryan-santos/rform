import type { Plugin } from "vite";

// Id do Vite é sempre com barra normal; `resolve()` e `join()` devolvem barra
// invertida no Windows, e comparar os dois crus faz toda raiz do usuário errar.
const normalize = (path: string) => path.split("\\").join("/");

// Lista de argumentos de tipo, capturada para a reescrita devolvê-la: rodando antes
// do plugin do Vue, o que se vê é `useUtil<Props>()` com o generic ainda no meio.
const GENERIC = String.raw`\s*(<[^<>]*(?:<[^<>]*>[^<>]*)*>)?\s*`;

/** Os argumentos de uma chamada, tolerando um nível de parênteses aninhado. */
const ARGS = String.raw`\(([^()]*(?:\([^()]*\)[^()]*)*)\)`;

/**
 * Quantos argumentos a chamada tem: vírgulas de **topo**, com comentário fora da
 * conta. Contar por lookahead pegava a vírgula de dentro de um `//` no corpo de um
 * `opts`, e aí a injeção do nome simplesmente não acontecia.
 */
const countArgs = (params: string): number => {
    const clean = params.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

    if (!clean.trim()) {
        return 0;
    }

    let depth = 0;
    let count = 1;

    for (const char of clean) {
        if (char === "(" || char === "[" || char === "{") {
            depth += 1;
        } else if (char === ")" || char === "]" || char === "}") {
            depth -= 1;
        } else if (char === "," && depth === 0) {
            count += 1;
        }
    }

    return count;
};

/**
 * Reescreve `useField(props)` como `useField(props, undefined, "Text")`, para o
 * componente aprender o próprio nome sem repeti-lo no arquivo.
 *
 * @param roots Diretórios cujos `.vue` recebem a injeção — os componentes do módulo
 * mais `app/rform/{fields,utils}`.
 */
export default (roots: string[]): Plugin => {
    const prefixes = roots.map((root) => `${normalize(root).replace(/\/+$/, "")}/`);

    return {
        name: "rform-component-name-injector",

        // Antes do plugin do Vue, não depois: depois, o id `.vue` já virou import de
        // um sub-request, e reescrever o que sobrou não muda nada.
        enforce: "pre",

        transform(code, id) {
            const path = normalize(id);

            if (!path.endsWith(".vue") || !prefixes.some((prefix) => path.startsWith(prefix))) {
                return;
            }

            const fileName = path.split("/").pop()!.replace(".vue", "");

            const replaceCode = code
                // Global de propósito: uma segunda chamada não reescrita cairia
                // calada nos defaults de outro componente.
                .replace(
                    new RegExp(`\\buseField${GENERIC}${ARGS}`, "g"),
                    (match, generic = "", params) => {
                        const paramCount = countArgs(params);

                        switch (paramCount) {
                            case 1:
                                return `useField${generic}(${params}, undefined, "${fileName}")`;
                            case 2:
                                return `useField${generic}(${params}, "${fileName}")`;
                            default:
                                return match;
                        }
                    }
                )
                // O nome vai *depois* do que foi passado, não no lugar: o primeiro
                // argumento é o `defaults` do componente, e descartá-lo mandava a
                // composable buscar no registry, async, o que o chamador já tinha.
                .replace(
                    new RegExp(`\\buseUtil${GENERIC}${ARGS}`, "g"),
                    (match, generic = "", params) => {
                        const paramCount = countArgs(params);

                        switch (paramCount) {
                            case 0:
                                return `useUtil${generic}(undefined, "${fileName}")`;
                            case 1:
                                return `useUtil${generic}(${params}, "${fileName}")`;
                            default:
                                return match;
                        }
                    }
                );

            if (replaceCode !== code) {
                return {
                    code: replaceCode,
                    map: null
                };
            }
        }
    };
};