import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home-view.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 配置滚动行为，避免在同一页面内的路由参数变化时滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的滚动位置（比如浏览器前进后退），则恢复到该位置
    if (savedPosition) {
      return savedPosition;
    }
    // 如果是同一个路由名称的跳转（比如博客详情的打开/关闭），不滚动
    if (to.name === from.name) {
      return false; // 保持当前滚动位置
    }
    // 否则滚动到页面顶部
    return { top: 0, behavior: 'smooth' };
  },
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
      props: true,
    },
    {
      path: '/post-view/:id?', // 路由路径
      name: 'PostView',
      component: () => import('@/views/blog/post-view.vue'),
      props: true,
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('@/views/chat/plan-map.vue'),
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
      path: '/news',
      name: 'news',
      component: () => import('@/views/trip/trip-news.vue'),
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
        return { token };
      },
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
      path: '/userpage/:id',
      name: 'otheruser',
      component: () => import('@/views/otheruser/otheruser-page.vue'),
      props: true,
    },
    {
      path: '/generator',
      name: 'generator',
      component: () => import('@/views/chat/trip-generator.vue'),
    },
    {
      path: '/ipologoai',
      name: 'ipologoai',
      component: () => import('@/views/iPoloGO-Generated-Plan/iPoloGO-result.vue'),
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
