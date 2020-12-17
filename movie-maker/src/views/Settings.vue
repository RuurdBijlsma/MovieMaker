<template>
    <div class="settings">
        <v-divider class="mt-2 mb-2"></v-divider>
        <v-btn to="/" text>
            <v-icon small class="mr-2">mdi-chevron-left</v-icon>
            Back to editor
        </v-btn>
        <v-divider class="mt-2 mb-2"></v-divider>
        <div class="secrets">
            <h2>Secrets</h2>
            <p class="caption">These values must be set before using features related to YouTube. Order: YouTube Id,
                Youtube
                Secret</p>
            <div class="secret-textarea">
                <div class="secret-help">
                    <p>Client ID</p>
                    <p>Client Secret</p>
                </div>
                <v-textarea :placeholder="secretsPlaceholder" no-resize spellcheck="false"
                            :rules="secretRules"
                            outlined
                            hide-details="auto"
                            auto-grow row-height="4"
                            v-model="secrets"></v-textarea>
            </div>
            <p class="key-saved" v-if="$store.getters.isKeySet">
                <v-icon color="success">mdi-check</v-icon>
                <span>Keys saved!</span>
            </p>
            <p v-else class="key-saved">
                <v-icon color="error">mdi-close</v-icon>
                <span>One or more keys not valid</span>
            </p>
        </div>
        <div>
            <h2>Account</h2>
            <div class="login" v-if="$store.getters.isKeySet">
                <div v-if="!$store.getters.isLoggedIn">
                    <p>Click the button below to log in to your YouTube™ account!</p>
                    <v-btn outlined color="red" @click="login" :loading="loginLoading">
                        <v-icon class="mr-2">mdi-youtube</v-icon>
                        Login
                    </v-btn>
                    <v-btn icon color="primary" @click="resetLogin" v-if="loginLoading">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
            </div>
            <div v-if="$store.getters.isLoggedIn" class="account-info">
                <div v-if="$store.state.auth.userInfo !== null">
                    <v-avatar>
                        <v-img :src="$store.state.auth.userInfo.thumbnails.high.url"></v-img>
                    </v-avatar>
                    <span class="ml-2">{{ $store.state.auth.userInfo.title }}</span>
                </div>
                <div v-else>
                    Logged in to YouTube!
                </div>
                <v-btn class="ml-4" text @click="logout">Log out</v-btn>
            </div>
        </div>
        <v-divider class="mt-2 mb-2"></v-divider>
        <div>

        </div>
        <h2 class="mt-3">Theme color</h2>
        <div class="colors mt-2">
            <v-btn class="mr-2" color="primary" @click="editingPrimary=true">Edit primary</v-btn>
            <v-btn color="secondary" @click="editingPrimary=false">Edit secondary</v-btn>
        </div>
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
        <v-btn class="mt-2" text color="primary" @click="resetColor()">Reset Theme Colors</v-btn>
    </div>
</template>

<script>
import Vuetify from '../plugins/vuetify'
import {mapState} from "vuex";

const theme = Vuetify.framework.theme.themes[Vuetify.framework.theme.isDark ? 'dark' : 'light'];
export default {
    name: "Settings",
    data: () => ({
        primaryColor: theme.primary,
        secondaryColor: theme.secondary,
        editingPrimary: true,

        secretsPlaceholder: "4876207845-anjsasd9gjan90dg8as89yd.apps.googleusercontent.com\nDadShg98sduHJDAFs9d8",
        secrets: "",
        loginLoading: false,
        secretRules: [
            v => v.split('\n').length === 2 || 'There must be two lines',
        ],
    }),
    mounted() {
        this.updateSecrets();
    },
    methods: {
        updateSecrets() {
            if (this.auth.ytId !== '' || this.auth.ytSecret !== '')
                this.secrets = this.$store.state.auth.ytId + '\n' + this.$store.state.auth.ytSecret;
        },
        async resetLogin() {
            await this.$store.dispatch('resetYtLogin');
            this.loginLoading = false;
        },
        async login() {
            this.loginLoading = true;
            await this.$store.dispatch('ytLogin');
            this.loginLoading = false;
        },
        async logout() {
            await this.$store.dispatch('ytLogout');
        },
        resetColor() {
            this.primaryColor = '#ed4b83';
            this.secondaryColor = '#5f46ff';
        },
    },
    watch: {
        '$store.state.auth.ytId'() {
            this.updateSecrets();
        },
        '$store.state.auth.ytSecret'() {
            this.updateSecrets();
        },
        async secrets() {
            console.log("Secrets changed to", this.secrets);
            let splitSecret = this.secrets.split('\n');
            if (splitSecret.length === 2) {
                let [ytId, ytSecret] = splitSecret;
                this.$store.commit('ytId', ytId);
                this.$store.commit('ytSecret', ytSecret);
                await this.$store.dispatch('cacheAuth');
            }
        },
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
    },
    computed: {
        ...mapState({
            auth: state => state.auth,
        }),
    }
}
</script>

<style scoped>
.settings {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    place-items: start;
}

.colors {
    display: flex;
}

.secrets {
    width: 100%;
}

.secret-help {
    margin-top: 3px;
    text-align: right;
    font-weight: 500;
}

@media (max-width: 800px) {
    .secret-help {
        display: none;
    }
}

.secret-help > p {
    margin: 7px;
}

.secret-textarea {
    display: flex;
}

.key-saved {
    text-align: right;
}

.account-info {
    display: flex;
    align-items: center;
}

.account-info span {
    font-size: 20px;
}
</style>