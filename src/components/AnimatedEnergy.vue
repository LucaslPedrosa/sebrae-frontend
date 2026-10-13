<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { formatEnergy } from '@/utils/formatters'

const props = withDefaults(defineProps<{ value: number; digits?: number }>(), { digits: 2 })
const displayedValue = ref(0)
let frame = 0

function animateTo(target: number) {
  cancelAnimationFrame(frame)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    displayedValue.value = target
    return
  }

  const startValue = displayedValue.value
  const difference = target - startValue
  const startTime = performance.now()
  const duration = 750

  const tick = (time: number) => {
    const progress = Math.min((time - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 4)
    displayedValue.value = startValue + difference * eased
    if (progress < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => animateTo(props.value))
watch(() => props.value, animateTo)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span>{{ formatEnergy(displayedValue, digits) }}</span>
</template>
