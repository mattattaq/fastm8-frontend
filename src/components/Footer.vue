<template>
    <div class="footer">
        <router-link to="/fastm8-frontend/dashboard">
            <font-awesome-icon :icon="['fas', 'house']" />
        </router-link>
        <router-link to="/fastm8-frontend/logs">
            <font-awesome-icon :icon="['fas', 'list']" />
        </router-link>
        <router-link to="/fastm8-frontend/settings">
            <font-awesome-icon :icon="['fas', 'circle-user']" />
        </router-link>
        <router-link to="/fastm8-frontend/login">
            <font-awesome-icon :icon="['fas', 'right-to-bracket']" />
        </router-link>
    </div>
</template>

<style scoped>
.footer {
    min-height: 60px;
    width: 100%;
    flex-direction: row;
    display: flex;
    justify-content: space-between;
}

.footer svg {
    width: 40px;
    height: 40px;
    margin: 10px 10px;
    color: var(--mint);
}
</style>