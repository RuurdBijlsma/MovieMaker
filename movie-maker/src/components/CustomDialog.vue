<template>
    <v-dialog v-model="$store.state.electron.prompt.show" width="500">
        <v-card>
            <v-card-title>{{ prompt.title }}</v-card-title>
            <v-card-text>{{ prompt.subtitle }}</v-card-text>
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
    name: "CustomDialog",
    methods: {
        dialogCancel() {
            this.$store.commit('hidePrompt');
            this.prompt.onCancel();
        },
        dialogConfirm() {
            this.$store.commit('hidePrompt');
            this.prompt.onConfirm();
        },
    },
    computed: {
        ...mapState({
            prompt: state => state.electron.prompt,
        }),
    },
}
</script>

<style scoped>

</style>