import '@fontsource-variable/archivo'
import './estilos/variables.css'
import './estilos/base.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
