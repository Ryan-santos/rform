export type Stored = {
    id: string;
    name: string;
    type: string;
    body: Uint8Array;
};

/** O "storage" do playground: memória do processo, e some no restart. */
export const uploads = new Map<string, Stored>();