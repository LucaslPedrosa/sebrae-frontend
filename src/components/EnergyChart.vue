<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp } from '@lucide/vue'
import type { ChartPoint } from '@/types/energy'
import { formatEnergy } from '@/utils/formatters'

const props = defineProps<{ points: ChartPoint[] }>()
const maxValue = computed(() => Math.max(...props.points.flatMap((point) => [point.generationWh, point.consumptionWh]), 1))
const height = (value: number) => `${Math.max((value / maxValue.value) * 100, value ? 5 : 0)}%`
const weeklyBalance = computed(() => props.points.reduce((sum, point) => sum + point.generationWh - point.consumptionWh, 0))
</script>

<template>
  <section class="panel p-5 sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="eyebrow">Fluxo semanal</p>
        <h2 class="mt-1 text-lg font-semibold">Geração × consumo</h2>
      </div>
      <div class="flex flex-wrap items-center justify-end gap-3 text-xs text-muted">
        <span class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-green shadow-[0_0_0_3px_rgba(22,122,80,.1)]"></i> Geração</span>
        <span class="flex items-center gap-1.5"><i class="size-2 rounded-full bg-coral shadow-[0_0_0_3px_rgba(201,81,61,.1)]"></i> Consumo</span>
      </div>
    </div>
    <div class="mt-7 flex items-center justify-between rounded-xl bg-canvas/70 px-3 py-2.5 text-xs">
      <span class="flex items-center gap-2 font-semibold"><TrendingUp :size="15" class="text-green" /> Balanço dos últimos 7 dias</span>
      <strong :class="weeklyBalance >= 0 ? 'text-green' : 'text-coral'">{{ weeklyBalance >= 0 ? '+' : '−' }}{{ formatEnergy(Math.abs(weeklyBalance), 1) }}</strong>
    </div>
    <div class="mt-8 flex h-48 items-end justify-between gap-2 border-b border-line px-1 sm:gap-4">
      <div
        v-for="(point, index) in points"
        :key="point.label"
        class="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-1 rounded-t-lg focus-visible:outline-offset-4 sm:gap-2"
        tabindex="0"
        :aria-label="`${point.label}: geracao ${formatEnergy(point.generationWh, 1)}, consumo ${formatEnergy(point.consumptionWh, 1)}`"
      >
        <div class="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition duration-200 group-hover:opacity-100 group-focus:opacity-100">
          {{ formatEnergy(point.generationWh, 1) }} / {{ formatEnergy(point.consumptionWh, 1) }}
        </div>
        <div class="relative h-full w-full max-w-5 overflow-hidden rounded-t-md bg-green-soft/70">
          <div class="chart-bar absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-green to-[#39aa76] transition-[filter] duration-300 group-hover:brightness-110" :style="{ height: height(point.generationWh), animationDelay: `${index * 55}ms` }"></div>
        </div>
        <div class="relative h-full w-full max-w-5 overflow-hidden rounded-t-md bg-coral-soft/70">
          <div class="chart-bar absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-coral to-[#ed8a74] transition-[filter] duration-300 group-hover:brightness-105" :style="{ height: height(point.consumptionWh), animationDelay: `${index * 55 + 50}ms` }"></div>
        </div>
      </div>
    </div>
    <div class="mt-3 flex justify-between px-1 text-[10px] font-semibold uppercase text-muted">
      <span v-for="point in points" :key="point.label" class="flex-1 text-center">{{ point.label }}</span>
    </div>
  </section>
</template>
