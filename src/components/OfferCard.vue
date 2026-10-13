<script setup lang="ts">
import { ArrowRight, X } from '@lucide/vue'
import type { MarketOffer } from '@/types/energy'
import { formatCurrency, formatEnergy, whToKwh } from '@/utils/formatters'

defineProps<{ offer: MarketOffer; isOwn?: boolean; pending?: boolean }>()
defineEmits<{ buy: [id: string]; cancel: [id: string] }>()
</script>

<template>
  <article class="panel interactive-panel group relative overflow-hidden p-5 focus-within:border-green/30">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="grid size-10 place-items-center rounded-full bg-green-soft font-bold text-green ring-4 ring-green-soft/50 transition-transform duration-300 group-hover:scale-105">{{ offer.seller.charAt(0) }}</span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold" :title="offer.seller">{{ offer.seller }}</p>
          <p class="text-[11px] text-muted">Credito simulado</p>
        </div>
      </div>
      <span v-if="isOwn" class="rounded-full bg-lime/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">Sua oferta</span>
    </div>
    <div class="mt-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-3xl font-semibold tracking-[-0.04em]">{{ formatEnergy(offer.amountWh, 0) }}</p>
        <p class="mt-1 text-xs text-muted">{{ formatCurrency(offer.pricePerKwh) }}/kWh</p>
      </div>
      <button
        type="button"
        :disabled="pending"
        class="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(20,32,28,.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-green active:scale-95 disabled:cursor-default disabled:bg-line disabled:text-muted disabled:shadow-none"
        @click="isOwn ? $emit('cancel', offer.id) : $emit('buy', offer.id)"
      >
        {{ pending ? 'Processando...' : isOwn ? 'Cancelar' : 'Comprar' }}
        <X v-if="isOwn && !pending" :size="14" />
        <ArrowRight v-else-if="!pending" :size="14" />
      </button>
    </div>
    <p class="mt-5 border-t border-line pt-4 text-xs text-muted">Total estimado <strong class="float-right text-ink">{{ formatCurrency(whToKwh(offer.amountWh) * offer.pricePerKwh) }}</strong></p>
  </article>
</template>
