<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  delay: {
    type: Number,
    default: 100,
  },
  animateBy: {
    type: String,
    default: 'words', // 'words' 或 'letters'
  },
  direction: {
    type: String,
    default: 'top', // 'top' 或 'bottom'
  },
  className: {
    type: String,
    default: '',
  },
  startImmediately: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['animationComplete']);

const elements = computed(() => {
  return props.animateBy === 'words' ? props.text.split(' ') : props.text.split('');
});

const visible = ref(false);
const observer = ref(null);
const textRef = ref(null);
const completedAnimations = ref(0);

// 设置元素初始状态
const initialStyles = computed(() => {
  return props.direction === 'top'
    ? 'opacity: 0; filter: blur(10px); transform: translate3d(0, -50px, 0);'
    : 'opacity: 0; filter: blur(10px); transform: translate3d(0, 50px, 0);';
});

// 使用CSS动画替代JavaScript计时器
const animationStarted = ref(false);

// 更简化的动画触发函数
const startAnimation = () => {
  animationStarted.value = true;
  
  // 使用单个setTimeout来触发完成事件，而不是为每个元素都设置一个
  const totalDuration = elements.value.length * props.delay + 500; // 添加额外时间确保完成
  setTimeout(() => {
    emit('animationComplete');
  }, totalDuration);
};

// 设置 IntersectionObserver
onMounted(() => {
  nextTick(() => {
    if (props.startImmediately) {
      startAnimation();
      return;
    }
    
    observer.value = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animationStarted.value) {
        startAnimation();
        
        // 取消观察
        observer.value.disconnect();
      }
    });
    
    observer.value.observe(textRef.value);
  });
});
</script>

<template>
  <p :class="`blur-text ${className}`" ref="textRef">
    <span 
      v-for="(element, index) in elements" 
      :key="index"
      class="blur-text-element"
      :class="{ 'animate': animationStarted }"
      :style="`animation-delay: ${index * props.delay}ms;`"
    >
      {{ element === ' ' ? '\u00A0' : element }}
      <template v-if="animateBy === 'words' && index < elements.length - 1">&nbsp;</template>
    </span>
  </p>
</template>

<style scoped>
.blur-text {
  overflow: hidden;
}

.blur-text-element {
  display: inline-block;
  will-change: transform, filter, opacity;
  opacity: 0;
  filter: blur(10px);
  transform: translate3d(0, -50px, 0);
}

.blur-text-element.animate {
  animation: blurAnimation 0.8s forwards;
}

@keyframes blurAnimation {
  0% {
    opacity: 0;
    filter: blur(10px);
    transform: translate3d(0, -50px, 0);
  }
  50% {
    opacity: 0.5;
    filter: blur(5px);
    transform: translate3d(0, 5px, 0);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translate3d(0, 0px, 0);
  }
}

/* 为底部方向定义单独的动画 */
.blur-text-element.animate[style*="direction: bottom"] {
  animation: blurAnimationBottom 0.8s forwards;
}

@keyframes blurAnimationBottom {
  0% {
    opacity: 0;
    filter: blur(10px);
    transform: translate3d(0, 50px, 0);
  }
  50% {
    opacity: 0.5;
    filter: blur(5px);
    transform: translate3d(0, -5px, 0);
  }
  100% {
    opacity: 1;
    filter: blur(0px);
    transform: translate3d(0, 0px, 0);
  }
}
</style> 