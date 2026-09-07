<template>
    <RFile
        name="ateDoisMega"
        label="demo.file.ateDoisMega"
        :max-size="2 * 1024 * 1024"
    />
    <RFile
        name="ateTresArquivos"
        label="demo.file.ateTresArquivos"
        multiple
        :max-files="3"
    />
</template>