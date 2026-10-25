import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home from './pages/Home.vue';
import GoogleCallback from './pages/GoogleCallback.vue';
import Widget from './pages/Widget.vue';
import FullScreen from './pages/FullScreen.vue';
import { readRememberedFullScreen } from './stores/fullScreen';

export const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/fullscreen',
    name: 'Full Screen',
    component: FullScreen,
  },
  {
    // Settings moved into header popups; keep old links and bookmarks working.
    path: '/settings',
    redirect: { path: '/', query: { theme: '1' } },
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
  scrollBehavior(to: any, from: any, savedPosition: any) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, left: 0 };
  },
});

// On a cold start (page load / PWA launch), resume full screen mode if it was
// active last time, so a nightstand phone comes back to the clock after a reload.
router.beforeEach((to, from) => {
  const isInitialNavigation = from.matched.length === 0;
  if (isInitialNavigation && to.path === '/' && readRememberedFullScreen()) {
    return { name: 'Full Screen', replace: true };
  }
  return true;
});

export default router;
