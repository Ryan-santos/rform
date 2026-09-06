<template>
    <NuxtLayout>
        <Head>
            <Meta
                name="color-scheme"
                :content="`only ${$colorMode.value}`"
            />
        </Head>

        <NuxtPage />
    </NuxtLayout>
</template>