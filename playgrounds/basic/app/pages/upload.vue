<template>
    <Scenario
        title="upload"
        :value="data"
    >
        <RForm
            v-model="data"
            class="flex flex-col gap-4"
            @submit="onSubmit"
        >
            <RFile
                name="anexos"
                label="~~Anexos"
                placeholder="~~Arraste ou clique"
                accept="image/*, .pdf"
                multiple
                :max-size="2 * 1024 * 1024"
                :max-files="4"
                :upload="upload"
                :remove="remove"
            />

            <button
                type="submit"
                class="w-fit cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
                submit
            </button>

            <p
                v-if="sent"
                class="font-mono text-xs text-contrast/40"
            >
                submetido {{ sent }}
            </p>
        </RForm>
    </Scenario>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    import type { Uploaded, UploadContext } from "#rform/types";

    const data = ref<Record<string, unknown>>({});
    const sent = ref("");

    // XHR, e não fetch: só ele reporta progresso de envio. Um arquivo com "falha" no
    // nome faz a rota devolver 502, que é como se exercita o retry.
    const upload = (file: File, { signal, onProgress }: UploadContext) =>
        new Promise<Uploaded>((resolve, reject) => {
            const body = new FormData();
            body.append("file", file);

            const request = new XMLHttpRequest();

            request.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    onProgress(event.loaded / event.total);
                }
            });

            request.addEventListener("load", () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.responseText));
                    return;
                }

                reject(new Error(`o servidor respondeu ${request.status}`));
            });

            request.addEventListener("error", () => reject(new Error("falha de rede")));
            signal.addEventListener("abort", () => request.abort());

            request.open("POST", "/api/uploads");
            request.send(body);
        });

    const remove = (value: Uploaded) => $fetch(`/api/uploads/${value.id}`, { method: "DELETE" });

    const onSubmit = () => {
        sent.value = new Date().toISOString().slice(11, 19);
    };
</script>