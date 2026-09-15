<script setup lang="ts">
import { Sun, PlugZap, MapPin, MoreHorizontal } from '@lucide/vue'
import type { EnergyDevice } from '@/types/energy'
import { formatEnergy } from '@/utils/formatters'

defineProps<{ device: EnergyDevice }>()
</script>

<template>
  <article class="panel p-5 sm:p-6">
    <div class="flex items-start justify-between">
      <span class="grid size-12 place-items-center rounded-2xl" :class="device.type === 'generator' ? 'bg-green-soft text-green' : 'bg-coral-soft text-coral'">
        <Sun v-if="device.type === 'generator'" :size="22" />
        <PlugZap v-else :size="22" />
      </span>
      <button class="text-muted hover:text-ink" aria-label="Mais opções"><MoreHorizontal :size="20" /></button>
    </div>
    <div class="mt-6 flex items-center gap-2">
      <span class="size-2 rounded-full" :class="device.status === 'online' ? 'bg-green shadow-[0_0_0_4px_#e7f4eb]' : 'bg-muted/45'"></span>
      <span class="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{{ device.status === 'online' ? 'Online' : 'Offline' }}</span>
    </div>
    <h3 class="mt-3 text-lg font-semibold">{{ device.name }}</h3>
    <p class="mt-1 flex items-center gap-1.5 text-xs text-muted"><MapPin :size="12" /> {{ device.location }}</p>
    <div class="mt-7 border-t border-line pt-5">
      <p class="text-xs text-muted">{{ device.type === 'generator' ? 'Gerado hoje' : 'Consumido hoje' }}</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight" :class="device.type === 'generator' ? 'text-green' : 'text-ink'">{{ formatEnergy(device.energyTodayWh, 1) }}</p>
    </div>
  </article>
</template>
