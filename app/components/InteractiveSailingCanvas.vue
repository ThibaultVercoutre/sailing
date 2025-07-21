<template>
  <div class="sailing-canvas-container w-full relative h-full">
    <canvas
      ref="canvasRef"
      class="sailing-canvas w-full"
      :tabindex="0"
      @focus="canFocus = true"
      @blur="canFocus = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSailingCanvas } from '../composables/useSailingCanvas'

// No emits needed - all data flows through the store

// Template refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canFocus = ref(false)

// Canvas composable
const { initCanvas } = useSailingCanvas(canvasRef)

// Lifecycle
onMounted(() => {
  if (canvasRef.value) {
    // Make canvas focusable for keyboard events
    canvasRef.value.focus()
    
    // Initialize canvas
    initCanvas()
  }
})

// No need for watchEffect - data flows through store directly
</script>

<style scoped>
.sailing-canvas-container {
  background: var(--sailing-light);
  border: 2px solid var(--sailing-primary);
  border-radius: 8px;
  overflow: hidden;
}

.sailing-canvas {
  display: block;
  outline: none;
}

.sailing-canvas:focus {
  outline: 2px solid var(--sailing-secondary);
  outline-offset: -2px;
}

/* Custom colors for Tailwind */
.text-sailing-primary {
  color: var(--sailing-primary);
}

.text-sailing-secondary {
  color: var(--sailing-secondary);
}
</style>