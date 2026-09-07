<template>
    <RFile
        name="anexos"
        label="demo.file.comUpload"
        accept="image/*, .pdf"
        multiple
        :upload="upload"
    />
</template>

<script setup lang="ts">
    import type { Uploaded, UploadContext } from "#rform/types";

    // Sem servidor nenhum: o "POST" é um timer que relata progresso e devolve o
    // `Uploaded`. Um arquivo com `erro` no nome falha de propósito, para o botão de
    // tentar de novo aparecer.
    const upload = (file: File, { signal, onProgress }: UploadContext) =>
        new Promise<Uploaded>((resolve, reject) => {
            let sent = 0;

            const timer = setInterval(() => {
                sent += 0.1;
                onProgress(sent);

                if (sent < 1) {
                    return;
                }

                clearInterval(timer);

                if (file.name.includes("erro")) {
                    reject(new Error("o servidor recusou o arquivo"));
                    return;
                }

                resolve({
                    id: `${Date.now()}`,
                    name: file.name,
                    url: URL.createObjectURL(file),
                    size: file.size,
                    type: file.type
                });
            }, 200);

            signal.addEventListener("abort", () => {
                clearInterval(timer);
                reject(new Error("cancelado"));
            });
        });
</script>