import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './plugins/router'
import store from './plugins/vuex/store'
import vuetify from './plugins/vuetify';
import Command from "@/js/commands/Command";

Command.setStore(store);

import PerfectScrollbar from 'vue2-perfect-scrollbar'
import 'vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css'

Vue.use(PerfectScrollbar)

Vue.config.productionTip = false

new Vue({
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
