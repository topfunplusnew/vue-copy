import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home-view.vue';
import { useUserStore } from '@/stores/user';

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
      // redirect: '/invitation',
      component: HomeView,
    },
    {
      path: '/home/:id?',
      name: 'home',
      // redirect: '/invitation',
      component: () => import('@/views/blog/list-view.vue'),
      props: true,
    },
    {
      path: '/post-view/:id?', // 路由路径
      name: 'PostView',
      // redirect: '/invitation',
      component: () => import('@/views/blog/post-view.vue'),
      props: true,
    },
    {
      path: '/map',
      name: 'map',
      // redirect: '/invitation',
      component: () => import('@/views/chat/plan-map.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // redirect: '/invitation',
      component: () => import('@/views/about-view.vue'),
    },
    {
      path: '/blog',
      name: 'blog',
      // redirect: '/invitation',
      component: () => import('@/views/trip/trip-blog.vue'),
    },
    {
      path: '/news',
      name: 'news',
      // redirect: '/invitation',
      component: () => import('@/views/trip/trip-news.vue'),
    },
    {
      path: '/contact',
      name: 'contact',
      // redirect: '/invitation',
      component: () => import('@/views/trip/trip-contact.vue'),
    },
    {
      path: '/login',
      name: 'login',
      // redirect: '/invitation',
      component: () => import('@/views/user/Login-view.vue'),
    },
    {
      path: '/signup',
      name: 'signup',
      // redirect: '/invitation',
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
      path: '/forget-password',
      name: 'forgetpassword',
      component: () => import('@/views/user/forget-password.vue'),
    },
    {
      path: '/userpage',
      name: 'userpage',
      // redirect: '/invitation',
      component: () => import('@/views/user/user-page.vue'),
    },
    {
      path: '/userpage/:id',
      name: 'otheruser',
      // redirect: '/invitation',
      component: () => import('@/views/otheruser/otheruser-page.vue'),
      props: true,
    },
    {
      path: '/generator',
      name: 'generator',
      // redirect: '/invitation',
      component: () => import('@/views/chat/trip-generator.vue'),
    },
    {
      path: '/ipologoai',
      name: 'ipologoai',
      // redirect: '/invitation',
      component: () => import('@/views/iPoloGO-Generated-Plan/iPoloGO-result.vue'),
    },
    {
      path: '/invitation',
      name: 'invitation',
      component: () => import('@/views/invitation.vue'),
    },
    {
      path: '/conference',
      name: 'conference',
      // redirect: '/invitation',
      component: () => import('@/views/conference-view.vue'),
    },
    {
      path: '/conference/my-events/:paperId',
      name: 'MyEventDetail',
      component: () => import('@/views/components/my_events.vue'),
      props: true,
    },
    {
      path: '/conference/featured-events/:conferenceId',
      name: 'FeaturedEvents',
      component: () => import('@/views/components/feature_events.vue'),
      props: true,
    },
    {
      path: '/conference/paper/:paperId',
      name: 'PaperDetail',
      component: () => import('@/views/components/paper-details.vue'),
      props: true,
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/user/reset-password-email.vue'),
    },
    {
      path: '/conferenceMap',
      name: 'conferenceMap',
      component: () => import('@/views/map/conferenceMap.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/not-found.vue'),
    },
  ],
});
const whiteList = ['invitation', 'forgetpassword', 'active', 'NotFound'];
router.beforeEach((to, from, next) => {
  console.log(from, to);
  const user = useUserStore().user;
  const isAuthenticated = user?.id;
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    if (import.meta.env.IPG_INVITATION && !whiteList.includes(to.name as string)) {
      next('/invitation');
    } else {
      next();
    }
  }
});

export default router;
