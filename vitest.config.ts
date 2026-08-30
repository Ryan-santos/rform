import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";
import vue from "@vitejs/plugin-vue";

const fixtureRoot = fileURLToPath(new URL("./test/fixtures/basic", import.meta.url));
const rformAliasRoot = fileURLToPath(new URL("./test/fixtures/basic/.nuxt/rform", import.meta.url));

export default defineConfig({
    test: {
        projects: [
            {
                plugins: [vue()],
                resolve: {
                    alias: {
                        "#rform/composables": `${rformAliasRoot}/composables.ts`,
                        "#rform/presets": `${rformAliasRoot}/presets.ts`,
                        "#rform/utils": `${rformAliasRoot}/utils.ts`,
                        "#rform/types/components/utils/props": `${rformAliasRoot}/types/components/utils/props.ts`,
                        "#rform/types/components/utils": `${rformAliasRoot}/types/components/utils/index.ts`,
                        "#rform/types/components": `${rformAliasRoot}/types/components/index.ts`,
                        "#rform/types": `${rformAliasRoot}/types/index.d.ts`,
                        "#app": fileURLToPath(new URL("./test/unit/__stubs/app.ts", import.meta.url))
                    }
                },
                test: {
                    name: "unit",
                    include: ["test/unit/**/*.test.ts"],
                    environment: "node"
                }
            },
            await defineVitestProject({
                test: {
                    name: "nuxt",
                    include: ["test/nuxt/**/*.test.ts"],
                    environment: "nuxt",
                    environmentOptions: {
                        nuxt: {
                            rootDir: fixtureRoot,
                            domEnvironment: "happy-dom"
                        }
                    }
                }
            }),
            {
                test: {
                    name: "e2e",
                    include: ["test/e2e/**/*.test.ts"],
                    environment: "node",
                    testTimeout: 120_000,
                    hookTimeout: 120_000
                }
            }
        ],
        coverage: {
            provider: "v8",
            include: ["src/runtime/**"],
            exclude: ["**/*.d.ts", "src/runtime/components/Utils/**"]
        }
    }
});