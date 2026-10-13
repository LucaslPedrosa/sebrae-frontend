<script setup lang="ts">
import { ArrowUpRight, WalletCards } from '@lucide/vue'
import AnimatedEnergy from '@/components/AnimatedEnergy.vue'
import { formatEnergy } from '@/utils/formatters'

defineProps<{ balanceWh: number; generatedWh: number; consumedWh: number }>()
</script>

<template>
  <section class="group relative min-h-64 overflow-hidden rounded-[28px] bg-ink p-6 text-white shadow-[0_24px_65px_rgba(20,32,28,.2)] sm:p-8">
    <div class="absolute -right-16 -top-24 size-72 rounded-full border-[42px] border-lime/8 transition-transform duration-700 ease-out group-hover:rotate-6 group-hover:scale-105"></div>
    <div class="absolute bottom-0 right-0 h-2/3 w-1/2 bg-[radial-gradient(circle_at_bottom_right,rgba(166,223,234,.24),transparent_65%)] transition-opacity duration-500 group-hover:opacity-80"></div>
    <div class="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
    <div class="relative flex h-full flex-col justify-between gap-10">
      <div class="flex items-start justify-between">
        <div>
          <p class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
            <WalletCards :size="15" /> Saldo disponível
          </p>
          <p class="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl"><AnimatedEnergy :value="balanceWh" :digits="3" /></p>
          <p class="mt-2 text-sm text-white/60">Pronto para usar ou negociar</p>
        </div>
        <RouterLink to="/market" class="soft-pulse grid size-11 place-items-center rounded-full bg-lime text-ink transition duration-300 hover:rotate-6 hover:scale-110" aria-label="Ir para o mercado">
          <ArrowUpRight :size="20" />
        </RouterLink>
      </div>
      <div class="flex flex-wrap gap-8 border-t border-white/10 pt-5 sm:gap-14">
        <div>
          <p class="text-xs text-white/60">Gerado hoje</p>
          <p class="mt-1 font-semibold text-lime">+ {{ formatEnergy(generatedWh, 1) }}</p>
        </div>
        <div>
          <p class="text-xs text-white/60">Consumido hoje</p>
          <p class="mt-1 font-semibold text-sky">− {{ formatEnergy(consumedWh, 1) }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
