import { defineEventHandler, getRouterParam } from "h3";

import { uploads } from "../../utils/uploads";

/** O que a prop `remove` chama ao tirar da lista um item que já subiu. */
export default defineEventHandler((event) => {
    uploads.delete(getRouterParam(event, "id") ?? "");

    return { ok: true };
});