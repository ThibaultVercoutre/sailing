<template>
  <div class="bg-gray-50">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="mb-6">

      </header>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Canvas Area (3/4 width on large screens) -->
        <div class="lg:col-span-3">
          <div class="">
            <InteractiveSailingCanvas 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import InteractiveSailingCanvas from '../components/InteractiveSailingCanvas.vue'

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