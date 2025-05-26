<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';
const apiKey = import.meta.env.IPG_GOOGLE_KEY;
const center = { lat: 39.980021, lng: 116.332241 };
const mapRef = ref<typeof GoogleMap | null>(null);
function addMarker() {
  mapRef.value?.map.panTo({ lat: 39.981171, lng: 116.247504 });
}

onMounted(() => {
  console.log(mapRef.value);
});
</script>

<template>
  <google-map ref="mapRef" :api-key="apiKey" style="width: 100%; height: 500px" :center="center" :zoom="15">
    <Marker :options="{ position: center }" />
  </google-map>
  <button @click="addMarker">change</button>
</template>
