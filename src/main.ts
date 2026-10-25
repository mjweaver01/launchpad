import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import { registerFonts } from './assets/fonts';
import { useAppFontStore } from './stores/appFont';

registerFonts();

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Apply the saved app font before the first render to avoid a flash of the default.
useAppFontStore(pinia).initialize();

app.use(router).mount('#app');
