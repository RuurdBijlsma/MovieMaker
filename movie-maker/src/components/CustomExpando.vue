<template>
    <div class="mb-2">
        <div class="expando-title" @click="show = !show">
            <h4>{{ name }}</h4>
            <v-btn icon>
                <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
        </div>
        <v-divider></v-divider>
        <v-expand-transition>
            <div v-show="show">
                <div class="mt-2">
                    <slot></slot>
                </div>
            </div>
        </v-expand-transition>
    </div>
</template>

<script>
export default {
    name: "CustomExpando",
    props: {
        name: {
            type: String,
            required: true,
        },
        defaultShow: {
            type: Boolean,
            default: false,
        },
    },
    data: () => ({
        show: true,
    }),
    mounted() {
        this.show = this.getCachedShow();
    },
    methods: {
        getCachedShow() {
            let key = 'customExpando' + this.name;
            if (localStorage.getItem(key) !== null)
                return localStorage[key] === 'true';
            return this.defaultShow;
        }
    },
    watch: {
        show() {
            let key = 'customExpando' + this.name;
            localStorage[key] = this.show;
        }
    }
}
</script>

<style scoped>
.expando-title {
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>