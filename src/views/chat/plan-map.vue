<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Style } from 'mapbox-gl';

// 配置 Mapbox 访问令牌（请替换为您自己的令牌）
mapboxgl.accessToken = import.meta.env.IPG_MAPBOX_TOKEN || '';

// 使用高德街道底图样式
const gaode: Style = {
  version: 8,
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['http://webst04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}'],
      tileSize: 256,
    },
    'raster-annotation': {
      type: 'raster',
      tiles: ['http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8'],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'simple-tiles',
      type: 'raster',
      source: 'raster-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: 'simple-annotation',
      type: 'raster',
      source: 'raster-annotation',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const mapRef = ref<HTMLElement | null>(null);
const map = ref<mapboxgl.Map | null>(null);
const marker = ref<mapboxgl.Marker | null>(null);
const center: [number, number] = [116.332241, 39.980021]; // [经度, 纬度]

function addMarker() {
  if (map.value) {
    const newCenter: [number, number] = [116.247504, 39.981171];
    map.value.flyTo({
      center: newCenter,
      zoom: 15,
    });
    // 更新标记位置
    if (marker.value) {
      marker.value.setLngLat(newCenter);
    } else {
      const newMarker = new mapboxgl.Marker();
      newMarker.setLngLat(newCenter);
      // @ts-expect-error - mapbox-gl type definition issue
      newMarker.addTo(map.value);
      marker.value = newMarker;
    }
  }
}

function onSearch() {
  // 这里可以替换为其他地图服务或保持原有逻辑
  console.log('搜索功能需要根据实际需求调整');
}

onMounted(() => {
  const container = mapRef.value;
  if (!container) {
    throw new Error('地图容器未找到');
  }

  // 创建 Mapbox 地图实例
  map.value = new mapboxgl.Map({
    container,
    style: gaode,
    center: center,
    zoom: 15,
  } as mapboxgl.MapboxOptions);

  // 添加导航控件
  // @ts-expect-error - mapbox-gl type definition issue
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right');

  // 添加初始标记
  map.value.on('load', () => {
    if (map.value) {
      const newMarker = new mapboxgl.Marker();
      newMarker.setLngLat(center);
      // @ts-expect-error - mapbox-gl type definition issue
      newMarker.addTo(map.value);
      marker.value = newMarker;
    }
  });
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});
</script>

<template>
  <div ref="mapRef" class="map-container"></div>
  <div class="map-controls">
    <button @click="addMarker">change</button>
    <button @click="onSearch">search</button>
  </div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 500px;
}

.map-controls {
  margin-top: 10px;
}

.map-controls button {
  margin-right: 10px;
  padding: 8px 16px;
  cursor: pointer;
}
</style>
