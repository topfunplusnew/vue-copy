<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const userContent = ref(route.query.requirements);
const generatedContent = ref('');
const selectedTools = ref<string[]>([]);

const agentDialogue = computed(() => {
  return [
    `User Requirements: ${userContent.value}`,
    `Selected Options: ${route.query.options}`,
    `Generated Plan: ${generatedContent.value}`
  ].join('\n\n');
});
</script>

<template>
  <div class="generator-container">
    <div class="editor-section">
      <h2>Itinerary Editor</h2>
      <el-input
        v-model="userContent"
        type="textarea"
        rows="6"
        placeholder="Edit your requirements"
      />

      <div class="dialogue-box">
        <pre>{{ agentDialogue }}</pre>
      </div>
    </div>

    <div class="tools-section">
      <h3>Agentic Tools</h3>
      <el-checkbox-group v-model="selectedTools">
        <el-checkbox label="Date" />
        <el-checkbox label="Transportation" />
        <el-checkbox label="Hotel" />
        <el-checkbox label="Budget" />
        <el-checkbox label="Activities" />
      </el-checkbox-group>

      <div class="map-container">
        <h3>iPoloGO Map</h3>
        <div class="map-options">
          <el-radio-group v-model="selectedMap">
            <el-radio label="navigation">Navigation</el-radio>
            <el-radio label="traffic">Traffic</el-radio>
            <el-radio label="route">Route</el-radio>
          </el-radio-group>
        </div>
        <div class="map-view">
          <!-- 这里集成实际地图组件 -->
          <div class="mock-map">{{ selectedMap }} Map View</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.generator-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 2rem auto;
  padding: 2rem;
}

.editor-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 15px;
}

.dialogue-box {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #1a1a2e;
  border-radius: 10px;
  white-space: pre-wrap;
}

.tools-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 2rem;
  border-radius: 15px;
}

.map-container {
  margin-top: 2rem;
}

.mock-map {
  height: 400px;
  background: #16213e;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-top: 1rem;
}

.el-checkbox-group, .el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
