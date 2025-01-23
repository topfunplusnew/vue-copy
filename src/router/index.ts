import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/home-view.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/trip',
      name: 'trip',
      redirect: { name: 'tripid', params: { id: 1 } },
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
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

export default router;
