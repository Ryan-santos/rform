<template>
    <NuxtLayout>
        <Head>
            <Meta
                name="color-scheme"
                :content="`only ${$colorMode.preference}`"
            />
        </Head>

        <NuxtLoadingIndicator
            color="var(--color-primary)"
            :height="5"
        />

        <NuxtPage />

        <Theme />
    </NuxtLayout>
</template>