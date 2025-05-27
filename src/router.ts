import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';
import GoogleCallback from './pages/GoogleCallback.vue';
import Widget from './pages/Widget.vue';

export const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/widget/:name',
    name: 'Widget',
    component: Widget,
    props: true,
  },
  {
    path: '/auth/google/callback',
    name: 'GoogleCallback',
    component: GoogleCallback,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
