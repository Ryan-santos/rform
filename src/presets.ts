const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

const camelize = (segment: string) =>
    segment
        .split(/[-_]+/)
        .filter(part => part !== "")
        .map((part, index) => index === 0 ? part : capitalize(part))
        .join("");

/**
 * Derives a preset name from its path relative to the `rules`/`masks` root.
 *
 * `br/insc-est.ts` -> `brInscEst`
 */
export const presetName = (relativePath: string) => {
    const segments = relativePath.split(/[/\\]+/).filter(segment => segment !== "");
    const last = segments.pop() ?? "";

    return [...segments, last.replace(/\.[^.]+$/, "")]
        .map(camelize)
        .map((segment, index) => index === 0 ? segment : capitalize(segment))
        .join("");
};

export type PresetFile = {
    name: string
    file: string
};

const isModule = (file: string) =>
    /\.[tj]s$/.test(file) && !/\.d\.[tj]s$/.test(file);

/**
 * Pairs every preset module under a `rules`/`masks` root with its derived name.
 *
 * Two paths collapsing to the same name is a build error — silently dropping one
 * would make the surviving preset depend on directory read order.
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
