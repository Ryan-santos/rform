import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import useUploadQueue from "../../src/runtime/composables/useUploadQueue";
import type { Uploaded, UploadContext } from "../../src/runtime/type";

const file = (name = "foto.png") => ({ name, size: 10, type: "image/png" }) as File;

/** Uma promise que o teste resolve na hora que quiser, como um POST em voo. */
const deferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;

    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};

const done = (id = 1): Uploaded => ({ id, name: "foto.png", url: "/uploads/1" });

/** A fila com um upload controlado pelo teste, e o registro do que foi ao model. */
const setup = () => {
    const written: Uploaded[] = [];
    const calls: Array<{ context: UploadContext; gate: ReturnType<typeof deferred<Uploaded>> }> =
        [];

    const queue = useUploadQueue({
        upload: () => (_file, context) => {
            const gate = deferred<Uploaded>();
            calls.push({ context, gate });
            return gate.promise;
        },
        onDone: (value) => {
            written.push(value);
        },
        fallback: () => "falhou"
    });

    return { queue, written, calls };
};

describe("useUploadQueue", () => {
    it("uma entry por arquivo, pendente até a promise liquidar", () => {
        const { queue } = setup();

        queue.add(file());

        expect(queue.entries.value).toHaveLength(1);
        expect(queue.entries.value[0]).toMatchObject({ status: "pending", progress: 0 });
    });

    it("o onProgress escreve na entry, limitado a 0..1", () => {
        const { queue, calls } = setup();

        queue.add(file());

        calls[0]!.context.onProgress(0.42);
        expect(queue.entries.value[0]!.progress).toBe(0.42);

        calls[0]!.context.onProgress(7);
        expect(queue.entries.value[0]!.progress).toBe(1);

        calls[0]!.context.onProgress(-1);
        expect(queue.entries.value[0]!.progress).toBe(0);
    });

    it("resolver escreve no model e tira a entry da lista", async () => {
        const { queue, written, calls } = setup();

        queue.add(file());
        calls[0]!.gate.resolve(done());
        await queue.settled();

        expect(written).toEqual([done()]);
        expect(queue.entries.value).toHaveLength(0);
    });

    it("entry cancelada não escreve no model, mesmo com o POST resolvendo depois", async () => {
        const { queue, written, calls } = setup();

        queue.add(file());
        const uid = queue.entries.value[0]!.uid;

        queue.cancel(uid);
        expect(calls[0]!.context.signal.aborted).toBe(true);

        calls[0]!.gate.resolve(done());
        await queue.settled();

        expect(written).toEqual([]);
        expect(queue.entries.value).toHaveLength(0);
    });

    it("falhar deixa a entry em erro, com a mensagem do próprio erro", async () => {
        const { queue, calls } = setup();

        queue.add(file());
        calls[0]!.gate.reject(new Error("413 do servidor"));
        await queue.settled();

        expect(queue.entries.value[0]).toMatchObject({
            status: "error",
            message: "413 do servidor"
        });
        expect(queue.failed.value).toBe(true);
    });

    it("erro sem mensagem cai no texto do campo", async () => {
        const { queue, calls } = setup();

        queue.add(file());
        calls[0]!.gate.reject(new Error(""));
        await queue.settled();

        expect(queue.entries.value[0]!.message).toBe("falhou");
    });

    it("abortar não vira erro na linha: a entry simplesmente sai", async () => {
        const { queue, calls } = setup();

        queue.add(file());
        queue.cancel(queue.entries.value[0]!.uid);
        calls[0]!.gate.reject(new Error("AbortError"));
        await queue.settled();

        expect(queue.entries.value).toHaveLength(0);
        expect(queue.failed.value).toBe(false);
    });

    it("retry recomeça a entry que falhou, e só ela", async () => {
        const { queue, written, calls } = setup();

        queue.add(file());
        calls[0]!.gate.reject(new Error("caiu"));
        await queue.settled();

        const uid = queue.entries.value[0]!.uid;
        queue.retry(uid);

        expect(queue.entries.value[0]).toMatchObject({
            uid,
            status: "pending",
            progress: 0,
            message: undefined
        });

        calls[1]!.gate.resolve(done(2));
        await queue.settled();

        expect(written).toEqual([done(2)]);
        expect(queue.entries.value).toHaveLength(0);
    });

    it("retry não mexe numa entry rejeitada, que nunca chegou a subir", () => {
        const { queue, calls } = setup();

        queue.reject(file(), "grande demais");
        queue.retry(queue.entries.value[0]!.uid);

        expect(calls).toHaveLength(0);
        expect(queue.entries.value[0]).toMatchObject({
            status: "rejected",
            message: "grande demais"
        });
    });

    it("uma rejeição não vai ao model nem conta como falha de envio", async () => {
        const { queue, written } = setup();

        queue.reject(file(), "não permitido");
        await queue.settled();

        expect(written).toEqual([]);
        expect(queue.failed.value).toBe(false);
    });

    it("settled resolve na liquidação, não no sucesso", async () => {
        const { queue, calls } = setup();

        queue.add(file());

        const order: string[] = [];
        const waiting = queue.settled().then(() => order.push("settled"));

        await nextTick();
        expect(order).toEqual([]);

        calls[0]!.gate.reject(new Error("caiu"));
        await waiting;

        expect(order).toEqual(["settled"]);
        expect(queue.failed.value).toBe(true);
    });

    it("settled espera também o retry começado durante a espera", async () => {
        const { queue, calls } = setup();

        queue.add(file());
        calls[0]!.gate.reject(new Error("caiu"));
        await queue.settled();

        const uid = queue.entries.value[0]!.uid;
        const waiting = queue.settled();

        queue.retry(uid);
        calls[1]!.gate.resolve(done(3));

        await waiting;
        expect(queue.entries.value).toHaveLength(0);
    });

    it("sem função de upload nada sobe: quem cuida do File cru é o campo", () => {
        const upload = vi.fn();
        const queue = useUploadQueue({
            upload: () => undefined,
            onDone: () => {},
            fallback: () => "falhou"
        });

        queue.add(file());

        expect(upload).not.toHaveBeenCalled();
        expect(queue.entries.value).toHaveLength(0);
    });

    it("stop aborta o que estiver em voo e esvazia a lista", async () => {
        const { queue, written, calls } = setup();

        queue.add(file());
        queue.add(file("outro.png"));
        queue.stop();

        expect(calls.every(({ context }) => context.signal.aborted)).toBe(true);
        expect(queue.entries.value).toHaveLength(0);

        calls[0]!.gate.resolve(done());
        await queue.settled();

        expect(written).toEqual([]);
    });
});