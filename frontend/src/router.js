import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import Utils from "./config/utils.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: { guest: true },
    },
    {
      path: "/register",
      name: "register",
      component: Register,
      meta: { guest: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "home" },
    },
  ],
});

export function applyAuthNavigation(to) {
  const user = Utils.getStore("user");
  const signedIn = Boolean(user?.token);

  if (to.meta.requiresAuth && !signedIn) {
    return { name: "login" };
  }

  if (to.meta.guest && signedIn) {
    return { name: "home" };
  }

  return true;
}

router.beforeEach((to) => applyAuthNavigation(to));

export default router;
