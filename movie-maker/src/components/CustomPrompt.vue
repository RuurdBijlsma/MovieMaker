<template>
    <v-dialog v-model="$store.state.electron.textPrompt.show" width="500">
        <v-card>
            <v-card-title>{{ prompt.title }}</v-card-title>
            <v-card-subtitle v-if="prompt.subtitle !== ''" v-html="prompt.subtitle"></v-card-subtitle>
            <v-form @submit.prevent="dialogConfirm">
                <v-text-field filled
                              :label="prompt.label"
                              class="mr-2 ml-2"
                              autofocus
                              dense
                              v-model="$store.state.electron.textPrompt.value">
                </v-text-field>
            </v-form>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="dialogCancel">
                    {{ prompt.cancelText }}
                </v-btn>
                <v-btn color="primary" text @click="dialogConfirm">
                    {{ prompt.confirmText }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {mapState} from "vuex";

export default {
    name: "CustomPrompt",
    methods: {
        dialogCancel() {
            this.$store.commit('hideTextPrompt');
        },
        dialogConfirm() {
            this.$store.commit('hideTextPrompt');
            this.prompt.onConfirm();
        },
    },
    watch: {
        'prompt.show'() {
            if (!this.prompt.show)
                this.prompt.onCancel();
        }
    },
    computed: {
        ...mapState({
            prompt: state => state.electron.textPrompt,
        }),
    },
}
</script>

<style scoped>

</style>