import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home-view.vue';
import AboutView from '@/views/trip/trip-about.vue';
import BlogView from '@/views/trip/trip-blog.vue';
import ContactView from '@/views/trip/trip-contact.vue';
import LoginView from '@/views/trip/Login-view.vue';
import SignupView from '@/views/trip/Signup-view.vue';



const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogView,
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView
    },
    {
      path: '/generator',
      name: 'generator',
      component: () => import('@/views/trip/generator.vue')
    },
    {
      path: '/blog2',
      name: 'blog2',
      component: () => import('@/views/trip/bloglist.vue')
    },
    {
      path: '/blog/create',
      name: 'blog-create',
      component: () => import('@/views/trip/blogedit.vue')
    },
    {
      path: '/blog/edit/:id',
      name: 'blog-edit',
      component: () => import('@/views/trip/blogedit.vue'),
      props: true
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
