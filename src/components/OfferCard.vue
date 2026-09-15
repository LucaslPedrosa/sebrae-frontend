<script setup lang="ts">
import { ArrowRight, Leaf } from '@lucide/vue'
import type { MarketOffer } from '@/types/energy'
import { formatCurrency, formatEnergy, whToKwh } from '@/utils/formatters'

defineProps<{ offer: MarketOffer; isOwn?: boolean }>()
defineEmits<{ buy: [id: string] }>()
</script>

<template>
  <article class="panel group p-5 transition hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_12px_35px_rgba(23,32,29,.06)]">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="grid size-10 place-items-center rounded-full bg-green-soft font-bold text-green">{{ offer.seller.charAt(0) }}</span>
        <div>
          <p class="text-sm font-semibold">{{ offer.seller }}</p>
          <p class="flex items-center gap-1 text-[11px] text-muted"><Leaf :size="11" /> Origem renovável</p>
        </div>
      </div>
      <span v-if="isOwn" class="rounded-full bg-lime/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">Sua oferta</span>
    </div>
    <div class="mt-7 flex items-end justify-between">
      <div>
        <p class="text-3xl font-semibold tracking-[-0.04em]">{{ formatEnergy(offer.amountWh, 0) }}</p>
        <p class="mt-1 text-xs text-muted">{{ formatCurrency(offer.pricePerKwh) }}/kWh</p>
      </div>
      <button
        :disabled="isOwn"
        class="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-green disabled:cursor-default disabled:bg-line disabled:text-muted"
        @click="$emit('buy', offer.id)"
      >
        {{ isOwn ? 'Publicada' : 'Comprar' }}
        <ArrowRight v-if="!isOwn" :size="14" />
      </button>
    </div>
    <p class="mt-5 border-t border-line pt-4 text-xs text-muted">Total estimado <strong class="float-right text-ink">{{ formatCurrency(whToKwh(offer.amountWh) * offer.pricePerKwh) }}</strong></p>
  </article>
</template>
