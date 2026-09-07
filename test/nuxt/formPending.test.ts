import { mountSuspended } from "@nuxt/test-utils/runtime";
// @vitest-environment nuxt
import { beforeAll, describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";
import { z } from "zod";

import { RFile, RForm } from "#components";
import type { Uploaded } from "#rform/types";

import { choose, png } from "../support/files";

// `scrollIntoView` não existe no happy-dom, e o `focusFirstError` chama um por
// submissão inválida.
beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

type Scope = {
    validate: () => Promise<boolean>;
    submit: () => Promise<Record<string, string> | undefined>;
};

const flush = async () => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();
};

const done = (id = 1): Uploaded => ({ id, name: "foto.png", url: `/uploads/${id}` });

/** Um upload que o teste resolve na hora que quiser, como um POST em voo. */
const gate = () => {
    let resolve!: (value: Uploaded) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<Uploaded>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { upload: () => promise, resolve, reject };
};

const mount = async (form: Record<string, unknown>, field: Record<string, unknown>) => {
    let scope: Scope | undefined;

    const wrapper = await mountSuspended(RForm, {
        attachTo: document.body,
        props: { modelValue: {}, ...form } as never,
        slots: {
            default: (received: Record<string, unknown>) => {
                scope = received as unknown as Scope;
                return h(RFile, { name: "anexo", ...field } as never);
            }
        }
    });

    await flush();

    return { wrapper, scope: scope! };
};

describe("o Form espera o que está em voo", () => {
    it("o submit só chama o onSubmit depois de o upload liquidar", async () => {
        const { upload, resolve } = gate();
        const onSubmit = vi.fn();

        const { wrapper, scope } = await mount({ onSubmit }, { upload });

        choose(wrapper, png());
        await flush();

        const submitting = scope.submit();
        await flush();

        // O POST ainda não voltou: submeter aqui gravaria um formulário sem o arquivo.
        expect(onSubmit).not.toHaveBeenCalled();

        resolve(done(5));

        expect(await submitting).toBeUndefined();
        expect(onSubmit).toHaveBeenCalledWith({ anexo: done(5) });
    });

    it("o `:rules` agregado enxerga o model já assentado", async () => {
        const { upload, resolve } = gate();

        const rules = z.object({
            anexo: z.object({ id: z.number(), name: z.string(), url: z.string() })
        });

        const { wrapper, scope } = await mount({ rules }, { upload });

        choose(wrapper, png());
        await flush();

        const validating = scope.validate();
        await flush();

        resolve(done(2));

        // Sem a espera, o parse rodaria sobre `{ anexo: null }` e o campo reprovaria.
        expect(await validating).toBe(true);
    });

    it("um upload que falhou reprova a submissão em vez de sumir calado", async () => {
        const { upload, reject } = gate();
        const onSubmit = vi.fn();

        const { wrapper, scope } = await mount({ onSubmit }, { upload });

        choose(wrapper, png());
        await flush();

        const submitting = scope.submit();
        await flush();

        reject(new Error("502 do servidor"));

        expect(await submitting).toEqual({ anexo: "O envio de um arquivo falhou." });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("a mensagem de falha tem a menor precedência: a rule do campo vence", async () => {
        const { upload, reject } = gate();

        const { wrapper, scope } = await mount({}, { upload, rule: "required" });

        choose(wrapper, png());
        await flush();

        const validating = scope.validate();
        await flush();

        reject(new Error("caiu"));
        await validating;

        // O model ficou vazio, então o `required` também reprova — e é ele que fala,
        // por ser a declaração mais local.
        expect(wrapper.find(".RUtilsError").text()).toBe("Campo obrigatório.");
    });

    it("o issue do `:rules` agregado também vence a mensagem de falha", async () => {
        const { upload, reject } = gate();

        const rules = z.object({
            anexo: z.any().refine(() => false, { message: "Anexo obrigatório pelo schema" })
        });

        const { wrapper, scope } = await mount({ rules }, { upload });

        choose(wrapper, png());
        await flush();

        const submitting = scope.validate();
        await flush();

        reject(new Error("caiu"));
        await submitting;

        expect(wrapper.find(".RUtilsError").text()).toBe("Anexo obrigatório pelo schema");
    });

    it("um campo sem nada em voo não segura o submit", async () => {
        const onSubmit = vi.fn();
        const { scope } = await mount({ onSubmit }, {});

        expect(await scope.submit()).toBeUndefined();
        expect(onSubmit).toHaveBeenCalledOnce();
    });
});