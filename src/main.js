import Vue from 'vue'
import Home from './views/Home.vue'
import router from './router'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

import './registerServiceWorker'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

new Vue({
  router,
  render: function (h) { return h(Home) }
}).$mount('#app')
