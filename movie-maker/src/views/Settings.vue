<template>
    <div class="settings">
        <h1>Settings</h1>
        <v-divider class="mt-2 mb-2"></v-divider>
        <v-btn @click="$router.go(-1)">Back to editor</v-btn>
        <h2 class="mt-3">Theme color</h2>
        <v-btn class="mt-2" color="primary" @click="editingPrimary=true">Edit primary</v-btn>
        <v-btn class="mt-2" color="secondary" @click="editingPrimary=false">Edit secondary</v-btn>
        <v-color-picker v-if="editingPrimary"
                        class="mt-3" mode="hexa"
                        v-model="primaryColor"
                        hide-mode-switch
        />
        <v-color-picker v-else
                        class="mt-3" mode="hexa"
                        v-model="secondaryColor"
                        hide-mode-switch
        />
        <v-btn class="mt-2" text color="primary" @click="resetColor()">Reset Theme Color</v-btn>
    </div>
</template>

<script>
import Vuetify from '../plugins/vuetify'

const theme = Vuetify.framework.theme.themes[Vuetify.framework.theme.isDark ? 'dark' : 'light'];
export default {
    name: "Settings",
    data: () => ({
        primaryColor: theme.primary,
        secondaryColor: theme.secondary,
        editingPrimary: true,
    }),
    methods: {
        resetColor() {
            this.primaryColor = '#ed4b83';
            this.secondaryColor = '#5f46ff';
        },
    },
    watch: {
        primaryColor() {
            if (this.primaryColor) {
                console.log("setting primary", this.primaryColor);
                this.$vuetify.theme.themes.dark.primary = this.primaryColor;
                this.$vuetify.theme.themes.light.primary = this.primaryColor;
                localStorage.primaryColor = this.primaryColor;
            }
        },
        secondaryColor() {
            if (this.secondaryColor) {
                console.log("setting secondary", this.secondaryColor);
                this.$vuetify.theme.themes.dark.secondary = this.secondaryColor;
                this.$vuetify.theme.themes.light.secondary = this.secondaryColor;
                localStorage.secondaryColor = this.secondaryColor;
            }
        },
    }
}
</script>

<style scoped>
.settings {
    padding: 20px;
    display: flex;
    flex-direction: column;
    place-items: start;
}
</style>