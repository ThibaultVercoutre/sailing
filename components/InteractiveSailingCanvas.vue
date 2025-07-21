<template>
  <div class="sailing-canvas-container w-full h-full relative">
    <canvas
      ref="canvasRef"
      class="sailing-canvas w-full h-full"
      :tabindex="0"
      @focus="canFocus = true"
      @blur="canFocus = false"
    />
    
    <!-- Instructions overlay -->
    <div 
      v-if="showInstructions" 
      class="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-sm max-w-xs"
    >
      <h3 class="font-semibold mb-2 text-sailing-primary">Instructions:</h3>
      <ul class="space-y-1 text-xs">
        <li>• Drag rings to adjust angle/speed</li>
        <li>• Click ring to select, ESC to deselect</li>
        <li>• Arrow keys to fine-tune selection</li>
        <li>• Blue ring: True wind (synchronized handles)</li>
        <li>• Cyan ring: Boat course (synchronized handles)</li>
        <li>• Blue arrow: True wind vector</li>
        <li>• Red arrow: Boat speed vector</li>
        <li>• Green arrow: Apparent wind (calculated)</li>
      </ul>
      <button 
        @click="hideInstructions"
        class="mt-2 text-xs text-sailing-secondary hover:underline"
      >
        Hide
      </button>
    </div>
    
    <!-- Ring info tooltip -->
    <div 
      v-if="selectedRing && selectedRingInfo"
      class="absolute top-4 right-4 bg-white/95 p-3 rounded-lg shadow-lg text-sm min-w-48"
    >
      <h3 class="font-semibold mb-2 text-sailing-primary">
        {{ selectedRingInfo.type }}
      </h3>
      <div class="space-y-1 text-xs">
        <div>Angle: {{ selectedRingInfo.angleDeg }}°</div>
        <div>{{ selectedRingInfo.speedLabel }}: {{ selectedRingInfo.speed.toFixed(1) }} kts</div>
        <div class="text-gray-500 mt-2">
          Use arrow keys or drag ring to adjust
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect, getCurrentInstance } from 'vue'
import { useSailingCanvas } from '../composables/useSailingCanvas'
import { useSailingStore } from '../stores/sailing'
import { radToDeg } from '../composables/useWindCalculations'

// Props
interface Props {
  showInstructions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showInstructions: true
})

// No emits needed - all data flows through the store

// Template refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canFocus = ref(false)
const showInstructionsState = ref(props.showInstructions)

// Store
const store = useSailingStore()

// Canvas composable
const { initCanvas } = useSailingCanvas(canvasRef)

// Computed
const selectedRing = computed(() => store.selectedRing)

const selectedRingInfo = computed(() => {
  if (!selectedRing.value) return null
  
  const ring = selectedRing.value === 'wind' ? store.windRing : store.boatRing
  const speed = selectedRing.value === 'wind' ? store.windSpeed : store.boatSpeed
  const angleDeg = Math.round(radToDeg(ring.angle))
  
  return {
    type: selectedRing.value === 'wind' ? 'Wind Ring' : 'Boat Ring',
    angleDeg: angleDeg < 0 ? angleDeg + 360 : angleDeg,
    speed,
    speedLabel: 'Speed'
  }
})

// Methods
const hideInstructions = () => {
  showInstructionsState.value = false
}

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