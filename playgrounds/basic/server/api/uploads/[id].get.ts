import { createError, defineEventHandler, getRouterParam, setHeader } from "h3";

import { uploads } from "../../utils/uploads";

/** Serve o que subiu, para a miniatura e o link da linha terem para onde apontar. */
export default defineEventHandler((event) => {
    const stored = uploads.get(getRouterParam(event, "id") ?? "");

    if (!stored) {
        throw createError({ statusCode: 404, statusMessage: "not found" });
    }

    setHeader(event, "content-type", stored.type || "application/octet-stream");

    return stored.body;
});