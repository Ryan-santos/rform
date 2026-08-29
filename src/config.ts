const defineConfig = <T extends object> (obj: DeepOverwrite<T, Config>) => {
    return obj;
};

export default defineConfig({
    rules: [
        {
            available: [
                "input",
                "color"
            ],
            name: "teste",
            validation (value, form) {

            }
        }
    ],

    masks: {
        cpf: {}
    }
});