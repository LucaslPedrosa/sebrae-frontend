<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ArrowRight, CircleCheck } from '@lucide/vue'
import EnergyBalance from '@/components/EnergyBalance.vue'
import EnergySummary from '@/components/EnergySummary.vue'
import EnergyChart from '@/components/EnergyChart.vue'
import TransactionList from '@/components/TransactionList.vue'
import { useEnergyStore } from '@/stores/energy'
import { formatEnergy } from '@/utils/formatters'

const store = useEnergyStore()
const {
  balanceWh,
  todayGenerationWh,
  todayConsumptionWh,
  boughtWh,
  soldWh,
  recentTransactions,
  weeklyChart,
} = storeToRefs(store)
</script>

<template>
  <div>
    <div class="mb-7 flex items-end justify-between">
      <div>
        <p class="eyebrow">Terça, 15 de setembro</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Olá, Lucas.</h1>
        <p class="mt-2 text-sm text-muted">Sua energia está trabalhando por você.</p>
      </div>
      <div class="hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-green sm:flex">
        <CircleCheck :size="15" /> Sistema operando
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <EnergyBalance :balance-wh="balanceWh" :generated-wh="todayGenerationWh" :consumed-wh="todayConsumptionWh" />
      <EnergySummary
        :generation-wh="todayGenerationWh"
        :consumption-wh="todayConsumptionWh"
        :bought-wh="boughtWh"
        :sold-wh="soldWh"
      />
    </div>

    <div class="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
      <EnergyChart :points="weeklyChart" />
      <section class="panel p-5 sm:p-6">
        <p class="eyebrow">Balanço acumulado</p>
        <h2 class="mt-1 text-lg font-semibold">Mercado de energia</h2>
        <div class="mt-8 space-y-6">
          <div>
            <div class="flex justify-between text-xs"><span class="text-muted">Energia comprada</span><strong class="text-green">+ {{ formatEnergy(boughtWh, 1) }}</strong></div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div class="h-full w-3/4 rounded-full bg-green"></div></div>
          </div>
          <div>
            <div class="flex justify-between text-xs"><span class="text-muted">Energia vendida</span><strong class="text-coral">− {{ formatEnergy(soldWh, 1) }}</strong></div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div class="h-full w-1/2 rounded-full bg-coral"></div></div>
          </div>
        </div>
        <RouterLink to="/market" class="mt-8 flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-xs font-semibold transition hover:bg-lime/25">
          Acessar mercado <ArrowRight :size="15" />
        </RouterLink>
      </section>
    </div>

    <section class="panel mt-5 px-5 pt-5 sm:px-6 sm:pt-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="eyebrow">Ledger</p>
          <h2 class="mt-1 text-lg font-semibold">Últimas transações</h2>
        </div>
        <RouterLink to="/history" class="flex items-center gap-1 text-xs font-semibold text-green hover:underline">Ver histórico <ArrowRight :size="13" /></RouterLink>
      </div>
      <TransactionList class="mt-2" :transactions="recentTransactions" />
    </section>
  </div>
</template>
