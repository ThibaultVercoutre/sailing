<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-sailing-primary mb-2">
          Interactive Sailing Wind Calculator
        </h1>
        <p class="text-gray-600">
          Interactive visualization of true wind, boat course, and apparent wind calculations
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Canvas Area (3/4 width on large screens) -->
        <div class="lg:col-span-3">
          <div class="h-96 lg:h-[600px]">
            <InteractiveSailingCanvas 
              :show-instructions="true"
              @wind-update="onWindUpdate"
              @boat-update="onBoatUpdate"
              @apparent-wind-update="onApparentWindUpdate"
            />
          </div>
        </div>

        <!-- Side Panel (1/4 width on large screens) -->
        <div class="lg:col-span-1">
          <div class="sailing-panel p-4 h-fit">
            <h2 class="text-lg font-semibold text-sailing-primary mb-4">
              Current Values
            </h2>

            <!-- True Wind -->
            <div class="mb-6">
              <h3 class="font-medium text-sailing-primary mb-2 flex items-center">
                <div class="w-4 h-4 bg-blue-600 rounded-full mr-2"></div>
                True Wind
              </h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>Direction:</span>
                  <span class="font-mono">{{ trueWindAngle }}°</span>
                </div>
                <div class="flex justify-between">
                  <span>Speed:</span>
                  <span class="font-mono">{{ trueWindSpeed.toFixed(1) }} kts</span>
                </div>
              </div>
            </div>

            <!-- Boat Course -->
            <div class="mb-6">
              <h3 class="font-medium text-sailing-secondary mb-2 flex items-center">
                <div class="w-4 h-4 bg-cyan-500 rounded-full mr-2"></div>
                Boat Course
              </h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>Heading:</span>
                  <span class="font-mono">{{ boatHeading }}°</span>
                </div>
                <div class="flex justify-between">
                  <span>Speed:</span>
                  <span class="font-mono">{{ boatSpeed.toFixed(1) }} kts</span>
                </div>
              </div>
            </div>

            <!-- Apparent Wind -->
            <div class="mb-6">
              <h3 class="font-medium text-red-500 mb-2 flex items-center">
                <div class="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                Apparent Wind
              </h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>Direction:</span>
                  <span class="font-mono">{{ apparentWindAngle }}°</span>
                </div>
                <div class="flex justify-between">
                  <span>Speed:</span>
                  <span class="font-mono">{{ apparentWindSpeed.toFixed(1) }} kts</span>
                </div>
              </div>
            </div>

            <!-- Wind Angles -->
            <div class="mb-6">
              <h3 class="font-medium text-gray-700 mb-2">
                Wind Angles
              </h3>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span>True Wind Angle:</span>
                  <span class="font-mono">{{ trueWindAngleRelative }}°</span>
                </div>
                <div class="flex justify-between">
                  <span>Apparent Wind Angle:</span>
                  <span class="font-mono">{{ apparentWindAngleRelative }}°</span>
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="border-t pt-4">
              <h3 class="font-medium text-gray-700 mb-2">Legend</h3>
              <div class="space-y-2 text-xs">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                  <span>Wind handles (outer ring)</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-cyan-500 rounded-full mr-2"></div>
                  <span>Boat handles (inner ring)</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-red-500 mr-2"></div>
                  <span>Apparent wind vector</span>
                </div>
              </div>
            </div>

            <!-- Controls Info -->
            <div class="border-t pt-4 mt-4">
              <h3 class="font-medium text-gray-700 mb-2">Controls</h3>
              <div class="text-xs space-y-1 text-gray-600">
                <p>• Drag handles to adjust</p>
                <p>• Click to select/deselect</p>
                <p>• Use arrow keys for fine control</p>
                <p>• ESC to deselect</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSailingStore } from '~/stores/sailing'
import { radToDeg, normalizeAngle } from '~/composables/useWindCalculations'

// Store
const store = useSailingStore()

// Computed values from store
const trueWindAngle = computed(() => store.windAngleDegrees)
const trueWindSpeed = computed(() => store.windSpeed)

const boatHeading = computed(() => store.boatHeadingDegrees)
const boatSpeed = computed(() => store.boatSpeed)

const apparentWindAngle = computed(() => store.apparentWindAngleDegrees)
const apparentWindSpeed = computed(() => store.apparentWind.speed)

// Relative wind angles (relative to boat heading)
const trueWindAngleRelative = computed(() => {
  const relative = radToDeg(normalizeAngle(store.windRing.angle - store.boatRing.angle))
  return Math.round(relative > 180 ? relative - 360 : relative)
})

const apparentWindAngleRelative = computed(() => {
  const relative = radToDeg(normalizeAngle(store.apparentWind.angle - store.boatRing.angle))
  return Math.round(relative > 180 ? relative - 360 : relative)
})

// Event handlers (legacy compatibility - not used with new ring system)
const onWindUpdate = (data: { angle: number; speed: number }) => {
  // No-op - data comes directly from store now
}

const onBoatUpdate = (data: { heading: number; speed: number }) => {
  // No-op - data comes directly from store now
}

const onApparentWindUpdate = (data: { angle: number; speed: number }) => {
  // No-op - data comes directly from store now
}

// SEO Meta
useSeoMeta({
  title: 'Interactive Sailing Wind Calculator',
  ogTitle: 'Interactive Sailing Wind Calculator',
  description: 'Interactive visualization of true wind, boat course, and apparent wind calculations for sailing',
  ogDescription: 'Interactive visualization of true wind, boat course, and apparent wind calculations for sailing',
  ogImage: '/sailing-preview.png',
  twitterCard: 'summary_large_image'
})
</script>

<style>
/* Global styles for sailing colors */
.text-sailing-primary {
  color: #0E4D92;
}

.text-sailing-secondary {  
  color: #00A3E0;
}

.bg-sailing-light {
  background-color: #F5F7FA;
}
</style>