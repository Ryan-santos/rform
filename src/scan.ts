/**
 * Names the module owns. `Form` provides the root injection and `Dynamic`
 * renders a schema — neither is a field, so neither is replaceable.
 */
export const RESERVED = ["Form", "Dynamic"];

/**
 * The name is used three ways: as an object key in the generated registry, as a
 * `Components` key the user writes in `defineFieldDefaults`, and lowercased as a
 * `FieldType` member. A dash or a leading digit survives none of those intact.
 */
const VALID_NAME = /^[A-Z][A-Za-z0-9]*$/;

export type ComponentSource = {
    /** Absolute directory the files were read from. */
    root: string;
    /** Directory entries, as returned by `readdir`. */
    files: string[];
    /** `app/rform/*` rather than the module's own runtime. */
    user: boolean;
};

export type ComponentFile = {
    name: string;
    /** Path relative to `root`, so the caller owns path joining. */
    file: string;
    root: string;
    user: boolean;
};

const isComponent = (file: string) => file.endsWith(".vue");

/**
 * Pairs every component under the given roots with its name, later sources
 * overriding earlier ones by name.
 *
 * The order carries the whole override rule: built-in roots come first, so a
 * user file of the same name replaces rather than duplicates — the same shape
 * `collectPresets` gives rules and masks.
 */
export const collectComponents = (sources: ComponentSource[]): ComponentFile[] => {
    const merged = new Map<string, ComponentFile>();

    for (const { root, files, user } of sources) {
        for (const file of files.filter(isComponent)) {
            const name = file.slice(0, -".vue".length);

            if (!VALID_NAME.test(name)) {
                throw new Error(
                    `[rform] invalid component name "${name}" in "${root}". A component file must be PascalCase and alphanumeric, so that "${name}" can be a key in the generated registry and a member of FieldType.`
                );
            }

            if (user && RESERVED.includes(name)) {
                throw new Error(
                    `[rform] "${name}" is reserved by rform and cannot be replaced: "${root}/${file}". Rename the file, or restyle the built-in through app/rform/defaults.ts.`
                );
            }

            merged.set(name, { name, file, root, user });
        }
    }

    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
};