import { defineConfig } from "oxlint";

export default defineConfig({
    options: {
        typeAware: true,
        typeCheck: true
    },
    rules: {
        eqeqeq: ["error", "always"],
        curly: "error",
        "no-console": ["warn", { allow: ["warn", "error"] }],
        "logical-assignment-operators": "error",
        "no-implied-eval": "error",
        "func-name-matching": "error",
        "prefer-arrow-callback": "warn",
        "vue/return-in-computed-property": "error",
        "import/newline-after-import": "warn",
        "unicorn/no-useless-iterator-to-array": "warn",
        "better-tailwindcss/enforce-consistent-line-wrapping": [
            "warn",
            {
                printWidth: 0,
                classesPerLine: 7,
                indent: 4
            }
        ]
    },
    plugins: ["eslint", "typescript", "unicorn", "oxc", "vue", "import"],
    jsPlugins: ["eslint-plugin-better-tailwindcss"],
    settings: {
        "better-tailwindcss": {
            entryPoint: "playground/app/assets/css/main.css",
            selectors: [
                {
                    kind: "attribute",
                    name: "^:?(class|ui)$",
                    callTarget: "all",
                    match: [{ type: "strings" }, { type: "objectKeys" }]
                },
                {
                    kind: "callee",
                    path: "^(defineDefaults|defineFieldDefaults)$",
                    match: [{ type: "objectValues", path: "(^|\\.)ui(\\.|$)" }]
                }
            ]
        }
    }
});