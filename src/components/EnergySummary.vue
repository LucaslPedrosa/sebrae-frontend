<script setup lang="ts">
import { Sun, PlugZap, ArrowLeftRight } from '@lucide/vue'
import { formatEnergy } from '@/utils/formatters'

defineProps<{
  generationWh: number
  consumptionWh: number
  boughtWh: number
  soldWh: number
}>()
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-3">
    <article class="panel p-5">
      <div class="flex items-center justify-between">
        <span class="grid size-9 place-items-center rounded-xl bg-green-soft text-green"><Sun :size="18" /></span>
        <span class="rounded-full bg-green-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-green">Produção</span>
      </div>
      <p class="mt-7 text-xs font-medium text-muted">Geração de hoje</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight text-green">+{{ formatEnergy(generationWh, 1) }}</p>
    </article>
    <article class="panel p-5">
      <div class="flex items-center justify-between">
        <span class="grid size-9 place-items-center rounded-xl bg-coral-soft text-coral"><PlugZap :size="18" /></span>
        <span class="rounded-full bg-coral-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-coral">Uso</span>
      </div>
      <p class="mt-7 text-xs font-medium text-muted">Consumo de hoje</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight text-coral">−{{ formatEnergy(consumptionWh, 1) }}</p>
    </article>
    <article class="panel p-5 sm:col-span-1">
      <span class="grid size-9 place-items-center rounded-xl bg-sky/30 text-ink"><ArrowLeftRight :size="18" /></span>
      <p class="mt-7 text-xs font-medium text-muted">Energia negociada</p>
      <div class="mt-1 flex items-baseline gap-2">
        <p class="text-2xl font-semibold tracking-tight">{{ formatEnergy(boughtWh + soldWh, 1) }}</p>
        <p class="text-[10px] text-muted">total</p>
      </div>
    </article>
  </div>
</template>
