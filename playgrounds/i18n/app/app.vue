<template>
    <NuxtLayout>
        <Head>
            <Meta
                name="color-scheme"
                :content="`only ${$colorMode.value}`"
            />
        </Head>

        <NuxtLoadingIndicator
            color="var(--color-primary)"
            :height="5"
        />

        <NuxtPage />
    </NuxtLayout>
</template>