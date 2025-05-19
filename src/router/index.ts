import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home-view.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'main',
      component: HomeView,
    },
    {
      path: '/home/:id?',
      name: 'home',
      component: () => import('@/views/blog/list-view.vue'),
      props: true
    },
    {
      path: '/post-view/:id?', // 路由路径
      name: 'PostView',
      component: () => import('@/views/blog/post-view.vue'),
      props: true
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/about-view.vue'),
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/trip/trip-blog.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('@/views/trip/trip-contact.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/user/Login-view.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/user/Signup-view.vue'),
    },
    {
      path: '/active',
      name: 'active',
      component: () => import('@/views/user/account-active.vue'),
      props(to) {
        const token = to.query.token;
        return {token}
      },
    },
    {
      path: '/forgetpassword',
      name: 'forgetpassword',
      component: () => import('@/views/user/forget-password.vue'),
    },
    {
      path: '/userpage/:id?',
      name: 'userpage',
      component: () => import('@/views/user/user-page.vue'),
    },
    {
      path: '/generator',
      name: 'generator',
      component: () => import('@/views/chat/trip-generator.vue'),
    }
  ],
});

// router.beforeEach((to, from, next) => {
//   const authStore = useAuthStore();
//   const isAuthenticated = !!authStore.token;

//   if (to.meta.requiresAuth && !isAuthenticated) {
//     next('/login');
//   } else if ((to.name === 'login' || to.name === 'signup') && isAuthenticated) {
//     next('/');
//   } else {
//     next();
//   }
// });

export default router;
