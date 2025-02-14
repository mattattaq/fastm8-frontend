import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../pages/Dashboard.vue";
import Login from "../pages/Login.vue";
import Home from "../pages/Home.vue"; // This will handle the redirection logic

const isAuthenticated = () => {
  return localStorage.getItem("userToken") !== null; // Example authentication check
};

const routes = [
  {
    path: "/fastm8-frontend/",
    component: Home,
  },
  {
    path: "/fastm8-frontend/login",
    component: Login,
  },
  {
    path: "/fastm8-frontend/dashboard",
    component: Dashboard,
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next("/fastm8-frontend/login");
      } else {
        next();
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
