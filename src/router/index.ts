import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/user/Login-view.vue';
import SignupView from '@/views/user/Signup-view.vue';
import PostView from '@/views/trip/Post-view.vue'; // 引入 Post-view 页面

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
      component: PostView, // 对应的组件
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
      component: LoginView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
    },
    {
      path: '/forgetpassword',
      name: 'forgetpassword',
      component: () => import('@/views/user/Forgetpassword.vue'),
    },
    {
      path: '/userpage',
      name: 'userpage',
      component: () => import('@/views/user/userpage.vue'),
    },
    {
      path: '/generator',
      name: 'generator',
      component: () => import('@/views/trip/generator.vue'),
    },
    // {
    //   path: '/blog2',
    //   name: 'blog2',
    //   component: () => import('@/views/trip/bloglist.vue')
    // },
    {
      path: '/blog/create',
      name: 'blog-create',
      component: () => import('@/views/trip/blogedit.vue'),
    },
    {
      path: '/blog/edit/:id',
      name: 'blog-edit',
      component: () => import('@/views/trip/blogedit.vue'),
      props: true,
    },
    {
      path: '/trip',
      name: 'trip',
      redirect: { name: 'tripid', params: { id: 1 } },
      component: () => import('@/views/trip/trip-layout.vue'),
      children: [
        {
          path: '/trip/:id',
          name: 'tripid',
          component: () => import('@/views/trip/trip-main.vue'),
          props: true,
        },
      ],
    },
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
