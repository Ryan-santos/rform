const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const camelize = (segment: string) =>
    segment
        .split(/[-_]+/)
        .filter((part) => part !== "")
        .map((part, index) => (index === 0 ? part : capitalize(part)))
        .join("");

/**
 * Deriva o nome de um preset a partir do caminho relativo à raiz `rules`/`masks`.
 *
 * @example presetName("br/insc-est.ts") // → "brInscEst"
 */
export const presetName = (relativePath: string) => {
    const segments = relativePath.split(/[/\\]+/).filter((segment) => segment !== "");
    const last = segments.pop() ?? "";

    return [...segments, last.replace(/\.[^.]+$/, "")]
        .map(camelize)
        .map((segment, index) => (index === 0 ? segment : capitalize(segment)))
        .join("");
};

export type PresetFile = {
    name: string;
    file: string;
};

const isModule = (file: string) => /\.[tj]s$/.test(file) && !/\.d\.[tj]s$/.test(file);

/**
 * Pareia todo módulo de preset sob uma raiz com o nome derivado. Dois caminhos que
 * colapsam no mesmo nome são erro de build — descartar um calado faria o preset
 * sobrevivente depender da ordem de leitura do diretório.
 */
export const collectPresets = (files: string[]): PresetFile[] => {
    const seen = new Map<string, string>();

    return files.filter(isModule).map((file) => {
        const name = presetName(file);
        const previous = seen.get(name);

        if (previous !== undefined) {
            throw new Error(
                `[rform] duplicate preset name "${name}": "${previous}" and "${file}" resolve to the same name. Rename one of them.`
            );
        }

        seen.set(name, file);

        return { name, file };
    });
};