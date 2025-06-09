<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { GoogleMap, Marker } from 'vue3-google-map';
const apiKey = import.meta.env.IPG_GOOGLE_KEY;
const center = { lat: 39.980021, lng: 116.332241 };
const mapRef = ref<typeof GoogleMap | null>(null);

function addMarker() {
  mapRef.value?.map.panTo({ lat: 39.981171, lng: 116.247504 });
}

function onSearch() {
  fetch('https://maps.googleapis.com/maps/api/place/textsearch/json?query=%E8%87%AA%E5%8A%A8%E5%8C%96%E7%A0%94%E7%A9%B6%E6%89%80&key=AIzaSyDG1OwabKoD6wmMgWp_HxoNY_J7GgxvAO8').then((res) =>
    console.log(res),
  );
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
  <button @click="onSearch">search</button>
</template>
