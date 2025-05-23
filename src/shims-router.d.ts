declare module 'vue-router' {
  import type { DefineComponent } from 'vue';

  export interface RouteRecordRaw {
    path: string;
    name?: string;
    component?: any;
    components?: Record<string, any>;
    redirect?: string | Location | Function;
    meta?: Record<string | number | symbol, any>;
    beforeEnter?: any;
    children?: RouteRecordRaw[];
    props?: boolean | Object | Function;
  }

  export function createRouter(options: any): any;
  export function createWebHistory(base?: string): any;
}
