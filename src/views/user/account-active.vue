<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LoadingScreen from '@/components/LoadingScreen.vue';
import router from '@/router';
import {useUserStore} from '@/stores/user';

const store = useUserStore();

const result = ref('loading');

const props = defineProps({
  token: String
})




onMounted(() => {
  if(props.token){
    store.activate(props.token).then(({data}) => {
      console.log(data);
      result.value = 'successful!';
      router.replace({
        name: 'login'
      })
    }).catch(e => {
      result.value = e.response.data.message;
    });
  }else {
    result.value = 'token invaild!';
  }
  console.log(props.token);
});



</script>

<template>
  <!-- 加载页 -->
  <LoadingScreen/>

  <div class="background-layer"></div>
  <div class="home" >
    {{ result }}
  </div>
</template>

