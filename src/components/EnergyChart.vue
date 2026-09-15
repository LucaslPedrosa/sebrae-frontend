<script setup lang="ts">
import { computed } from 'vue'
import type { ChartPoint } from '@/types/energy'
import { formatEnergy } from '@/utils/formatters'

const props = defineProps<{ points: ChartPoint[] }>()
const maxValue = computed(() => Math.max(...props.points.flatMap((point) => [point.generationWh, point.consumptionWh]), 1))
const height = (value: number) => `${Math.max((value / maxValue.value) * 100, value ? 5 : 0)}%`
</script>

<template>
  <section class="panel p-5 sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="eyebrow">Fluxo semanal</p>
        <h2 class="mt-1 text-lg font-semibold">Geração × consumo</h2>
      </div>
      <div class="flex gap-4 text-xs text-muted">
        <span class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-green"></i> Geração</span>
        <span class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-coral"></i> Consumo</span>
      </div>
    </div>
    <div class="mt-8 flex h-48 items-end justify-between gap-2 border-b border-line px-1 sm:gap-4">
      <div v-for="point in points" :key="point.label" class="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-2">
        <div class="group relative h-full w-full max-w-5">
          <div class="absolute bottom-0 w-full rounded-t-md bg-green transition-all hover:bg-green/80" :style="{ height: height(point.generationWh) }">
            <span class="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-1 text-[9px] text-white group-hover:block">{{ formatEnergy(point.generationWh, 1) }}</span>
          </div>
        </div>
        <div class="group relative h-full w-full max-w-5">
          <div class="absolute bottom-0 w-full rounded-t-md bg-coral/75 transition-all hover:bg-coral" :style="{ height: height(point.consumptionWh) }">
            <span class="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-1 text-[9px] text-white group-hover:block">{{ formatEnergy(point.consumptionWh, 1) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-3 flex justify-between px-1 text-[10px] font-semibold uppercase text-muted">
      <span v-for="point in points" :key="point.label" class="flex-1 text-center">{{ point.label }}</span>
    </div>
  </section>
</template>
