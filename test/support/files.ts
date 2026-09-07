/**
 * O mínimo para simular a escolha de arquivos num `<input type="file">` sem
 * `DataTransfer`, que o happy-dom não oferece.
 */

/** Um `File` com o `size` que o teste escolher — no happy-dom ele vem do conteúdo. */
export const png = (name = "foto.png", size = 1024): File => {
    const file = new File(["x"], name, { type: "image/png" });

    Object.defineProperty(file, "size", { value: size });

    return file;
};

/** Um FileList de mentira: iterável, que é o que o `intake` do RFile consome. */
export const fileList = (...files: File[]): FileList => {
    const list: Record<number | string | symbol, unknown> = {
        length: files.length,
        item: (index: number) => files[index] ?? null,
        [Symbol.iterator]: () => files[Symbol.iterator]()
    };

    files.forEach((file, index) => {
        list[index] = file;
    });

    return list as unknown as FileList;
};

type Findable = { find: (selector: string) => { element: Element } };

/** Escolhe arquivos como o diálogo do SO faria: escreve `files` e dispara `change`. */
export const choose = (wrapper: Findable, ...files: File[]): void => {
    const input = wrapper.find('input[type="file"]').element;

    Object.defineProperty(input, "files", { value: fileList(...files), configurable: true });
    input.dispatchEvent(new Event("change"));
};