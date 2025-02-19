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