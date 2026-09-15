<script setup lang="ts">
import { ArrowUpRight, WalletCards } from '@lucide/vue'
import { formatEnergy } from '@/utils/formatters'

defineProps<{ balanceWh: number; generatedWh: number; consumedWh: number }>()
</script>

<template>
  <section class="relative min-h-64 overflow-hidden rounded-[26px] bg-ink p-6 text-white sm:p-8">
    <div class="absolute -right-16 -top-24 size-72 rounded-full border-[42px] border-lime/8"></div>
    <div class="absolute bottom-0 right-0 h-1/2 w-2/5 bg-[radial-gradient(circle_at_bottom_right,rgba(166,223,234,.18),transparent_65%)]"></div>
    <div class="relative flex h-full flex-col justify-between gap-10">
      <div class="flex items-start justify-between">
        <div>
          <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            <WalletCards :size="15" /> Saldo disponível
          </p>
          <p class="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{{ formatEnergy(balanceWh, 3) }}</p>
          <p class="mt-2 text-sm text-white/45">Pronto para usar ou negociar</p>
        </div>
        <RouterLink to="/market" class="grid size-11 place-items-center rounded-full bg-lime text-ink transition hover:scale-105" aria-label="Ir para o mercado">
          <ArrowUpRight :size="20" />
        </RouterLink>
      </div>
      <div class="flex gap-8 border-t border-white/10 pt-5 sm:gap-14">
        <div>
          <p class="text-xs text-white/40">Gerado hoje</p>
          <p class="mt-1 font-semibold text-lime">+ {{ formatEnergy(generatedWh, 1) }}</p>
        </div>
        <div>
          <p class="text-xs text-white/40">Consumido hoje</p>
          <p class="mt-1 font-semibold text-sky">− {{ formatEnergy(consumedWh, 1) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
