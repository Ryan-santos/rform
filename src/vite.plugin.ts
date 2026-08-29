import type { Plugin } from "vite";

export default <Plugin> {
    name: "rform-component-name-injector",
    transform (code, id) {
            if (!id.startsWith(__dirname) || !id.endsWith(".vue")) {
            return;
        }

        const fileName = id.split("/")?.pop()?.replace(".vue", "");

        const replaceCode = code
            .replace(
                /\buseInjection\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/,
                (match, params) => {
                    const paramCount = params.trim()
                        ? (params.match(/,(?![^()]*\))/g) || []).length + 1
                        : 0;

                    switch (paramCount) {
                        case 1: return `useInjection(${params}, undefined, "${fileName}")`;
                        case 2: return `useInjection(${params}, "${fileName}")`;
                        default: return match;
                    }
                }
            )
            .replace(
                /\buseUtilProps\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)/,
                `useUtilProps("${fileName}")`
            );

        if (replaceCode !== code) {
            return {
                code: replaceCode,
                map: null
            };
        }
    }
};