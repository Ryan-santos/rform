import { createError, defineEventHandler, readFormData } from "h3";

import { uploads } from "../utils/uploads";

/**
 * O outro lado da prop `upload` do RFile: recebe o binário e devolve o `Uploaded` —
 * `{ id, name, url }` é o mínimo que o campo exige, e o resto passa intacto.
 */
export default defineEventHandler(async (event) => {
    const form = await readFormData(event);
    const file = form.get("file");

    if (!(file instanceof File)) {
        throw createError({ statusCode: 400, statusMessage: "file is required" });
    }

    // Falha sob demanda, para exercitar o retry sem derrubar o servidor.
    if (file.name.includes("falha")) {
        throw createError({ statusCode: 502, statusMessage: "o servidor recusou o arquivo" });
    }

    const id = Math.random().toString(36).slice(2, 10);

    uploads.set(id, {
        id,
        name: file.name,
        type: file.type,
        body: new Uint8Array(await file.arrayBuffer())
    });

    // Devagar de propósito: sem atraso não dá para ver a barra nem cancelar em voo.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // `size` e `type` são opcionais no `Uploaded`, e é o `type` que faz a miniatura
    // aparecer sem depender de extensão na URL.
    return { id, name: file.name, url: `/api/uploads/${id}`, size: file.size, type: file.type };
});