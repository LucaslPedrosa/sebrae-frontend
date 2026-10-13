<script setup lang="ts">
import { Sun, PlugZap, ArrowDownLeft, ArrowUpRight } from '@lucide/vue'
import type { EnergyTransaction } from '@/types/energy'
import { formatDate, formatEnergy, formatTime } from '@/utils/formatters'

defineProps<{ transaction: EnergyTransaction; showDate?: boolean }>()

const labels = {
  generation: 'Geração',
  consumption: 'Consumo',
  transfer_in: 'Transferência recebida',
  transfer_out: 'Transferência enviada',
}
</script>

<template>
  <div class="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-4 transition-colors duration-200 hover:bg-canvas/70 sm:gap-4">
    <span
      class="grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105"
      :class="transaction.amountWh > 0 ? 'bg-green-soft text-green' : 'bg-coral-soft text-coral'"
    >
      <Sun v-if="transaction.type === 'generation'" :size="17" />
      <PlugZap v-else-if="transaction.type === 'consumption'" :size="17" />
      <ArrowDownLeft v-else-if="transaction.type === 'transfer_in'" :size="17" />
      <ArrowUpRight v-else :size="17" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-semibold">{{ transaction.description }}</p>
      <p class="mt-0.5 text-xs text-muted">
        {{ labels[transaction.type] }}
        <span v-if="showDate"> · {{ formatDate(transaction.timestamp) }}</span>
      </p>
    </div>
    <div class="shrink-0 text-right">
      <p class="text-sm font-bold" :class="transaction.amountWh > 0 ? 'text-green' : 'text-coral'">
        {{ transaction.amountWh > 0 ? '+' : '−' }}{{ formatEnergy(Math.abs(transaction.amountWh)) }}
      </p>
      <time class="mt-0.5 block text-xs text-muted" :datetime="transaction.timestamp">{{ formatTime(transaction.timestamp) }}</time>
    </div>
  </div>
</template>
