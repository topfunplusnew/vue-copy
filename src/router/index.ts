import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/home-view.vue'),
    },
    {
      path: '/post-view', // 路由路径
      name: 'PostView',
      component: () => import('@/views/trip/Post-view.vue'),
    },
    {
      path: '/edit/:id', // 路由路径
      name: 'editBlog',
      component: () => import('@/views/trip/Post-view.vue'),
      props: true
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/trip/trip-about.vue'),
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
      path: '/forgetpassword',
      name: 'forgetpassword',
      component: () => import('@/views/user/forget-password.vue'),
    },
    {
      path: '/userpage',
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
