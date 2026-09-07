import { computed, ref, type ComputedRef, type Ref } from "vue";

import type { Uploaded, UploadFn } from "#rform/types";

/**
 * `rejected` é o arquivo que nem chegou a subir (`accept`, `maxSize`, `maxFiles`);
 * `error` é o upload que falhou e tem retry.
 */
export type EntryStatus = "pending" | "error" | "rejected";

export type Entry = {
    uid: string;
    file: File;
    status: EntryStatus;
    /** Fração de 0 a 1. */
    progress: number;
    message?: string;
};

export type Options<U extends Uploaded = Uploaded> = {
    /** Getter, para acompanhar a prop: sem função, nada sobe. */
    upload: () => UploadFn<U> | undefined;
    /**
     * Chamado só quando a entry sobreviveu até a resolução. O `File` vai junto: é o
     * que deixa a miniatura local sobreviver à saída da entry da fila.
     */
    onDone: (value: U, file: File) => void;
    /** A mensagem quando o erro não traz uma. */
    fallback: () => string;
};

export type UploadQueue = {
    entries: Ref<Entry[]>;
    /** Há entry parada em `error` — o que faz o Form reclamar no submit. */
    failed: ComputedRef<boolean>;
    add: (file: File) => void;
    reject: (file: File, message: string) => void;
    retry: (uid: string) => void;
    cancel: (uid: string) => void;
    settled: () => Promise<void>;
    stop: () => void;
};

let sequence = 0;

/** A mensagem que o app pôs no erro, ou vazio — nunca um `[object Object]`. */
const errorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return typeof error === "string" ? error : "";
};

/**
 * A fila de upload do `RFile`: uma entry por arquivo em voo, com progresso, erro
 * com retry e cancelamento por `AbortSignal`. Estado pendente mora **fora** do
 * model — um arquivo em voo ainda não é um `Uploaded`.
 *
 * @example const queue = useUploadQueue({ upload: () => props.upload, onDone, fallback });
 */
export default function useUploadQueue<U extends Uploaded = Uploaded>(
    options: Options<U>
): UploadQueue {
    const entries = ref<Entry[]>([]);
    const controllers = new Map<string, AbortController>();

    // Chaveado por uid, e não um Set solto: cancelar tem de **soltar** a promise, não
    // esperá-la — o resultado dela já foi descartado, e um upload que ignore o
    // `signal` prenderia o submit para sempre.
    const pending = new Map<string, Promise<unknown>>();

    const find = (uid: string) => entries.value.find((entry) => entry.uid === uid);

    const forget = (uid: string) => {
        controllers.delete(uid);
        entries.value = entries.value.filter((entry) => entry.uid !== uid);
    };

    const run = (uid: string) => {
        const upload = options.upload();
        const entry = find(uid);

        if (!upload || !entry) {
            return;
        }

        const controller = new AbortController();
        controllers.set(uid, controller);

        const promise = upload(entry.file, {
            signal: controller.signal,
            onProgress: (ratio) => {
                const current = find(uid);

                if (current) {
                    current.progress = Math.min(1, Math.max(0, ratio || 0));
                }
            }
        })
            .then((value) => {
                // Só escreve se a entry sobreviveu: cancelar a descarta, e um POST em
                // voo não pode ressuscitar no model o arquivo que o usuário removeu.
                if (!find(uid) || controller.signal.aborted) {
                    return;
                }

                forget(uid);
                options.onDone(value, entry.file);
            })
            .catch((error: unknown) => {
                const current = find(uid);

                // Abortado é descarte, não falha: não há linha para reclamar.
                if (!current || controller.signal.aborted) {
                    return;
                }

                const message = errorMessage(error);

                current.status = "error";
                current.message = message || options.fallback();
            })
            .finally(() => {
                if (pending.get(uid) === promise) {
                    pending.delete(uid);
                }

                if (controllers.get(uid) === controller) {
                    controllers.delete(uid);
                }
            });

        pending.set(uid, promise);
    };

    const push = (file: File, status: EntryStatus, message?: string) => {
        const uid = `rf-upload-${++sequence}`;

        entries.value = [...entries.value, { uid, file, status, progress: 0, message }];

        return uid;
    };

    const add = (file: File) => {
        if (!options.upload()) {
            return;
        }

        run(push(file, "pending"));
    };

    const reject = (file: File, message: string) => {
        push(file, "rejected", message);
    };

    const retry = (uid: string) => {
        const entry = find(uid);

        // Rejeitado não sobe: o arquivo nunca foi válido, e tentar de novo daria no
        // mesmo. Quem já está em voo também não recomeça.
        if (entry?.status !== "error") {
            return;
        }

        entry.status = "pending";
        entry.progress = 0;
        entry.message = undefined;

        run(uid);
    };

    const cancel = (uid: string) => {
        controllers.get(uid)?.abort();
        pending.delete(uid);
        forget(uid);
    };

    // O `while` cobre o retry começado durante a espera: uma volta só deixaria o
    // submit passar por cima do upload novo.
    const settled = async () => {
        while (pending.size > 0) {
            await Promise.allSettled(pending.values());
        }
    };

    const stop = () => {
        for (const controller of controllers.values()) {
            controller.abort();
        }

        controllers.clear();
        pending.clear();
        entries.value = [];
    };

    const failed = computed(() => entries.value.some((entry) => entry.status === "error"));

    return { entries, failed, add, reject, retry, cancel, settled, stop };
}