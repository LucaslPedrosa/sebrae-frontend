<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, Search } from '@lucide/vue'
import TransactionList from '@/components/TransactionList.vue'
import { useEnergyStore } from '@/stores/energy'

type Filter = 'all' | 'generation' | 'consumption' | 'transfers'

const store = useEnergyStore()
const { transactions } = storeToRefs(store)
const selectedFilter = ref<Filter>('all')
const search = ref('')

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'generation', label: 'Geração' },
  { value: 'consumption', label: 'Consumo' },
  { value: 'transfers', label: 'Transferências' },
]

const filteredTransactions = computed(() => transactions.value.filter((transaction) => {
  const matchesType = selectedFilter.value === 'all'
    || transaction.type === selectedFilter.value
    || (selectedFilter.value === 'transfers' && transaction.type.startsWith('transfer_'))
  const query = search.value.trim().toLocaleLowerCase('pt-BR')
  const matchesSearch = !query
    || transaction.description.toLocaleLowerCase('pt-BR').includes(query)
    || transaction.counterparty?.toLocaleLowerCase('pt-BR').includes(query)
  return matchesType && matchesSearch
}))
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Registro imutável</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Histórico de energia</h1>
        <p class="mt-2 text-sm text-muted">Cada watt-hora gerado, consumido ou transferido.</p>
      </div>
      <button class="hidden items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-ink/30 sm:flex">
        <Download :size="15" /> Exportar extrato
      </button>
    </div>

    <section class="panel mt-8 overflow-hidden">
      <div class="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div class="flex gap-1 overflow-x-auto rounded-xl bg-canvas p-1">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition"
            :class="selectedFilter === filter.value ? 'bg-ink text-white' : 'text-muted hover:text-ink'"
            @click="selectedFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <label class="flex items-center gap-2 rounded-xl border border-line px-3 text-muted focus-within:border-ink/40 focus-within:text-ink">
          <Search :size="15" />
          <input v-model="search" type="search" placeholder="Buscar no histórico" class="w-full bg-transparent py-2.5 text-xs text-ink outline-none sm:w-44" />
        </label>
      </div>
      <div class="px-5 sm:px-6">
        <TransactionList :transactions="filteredTransactions" show-date />
      </div>
      <div class="border-t border-line bg-canvas/50 px-5 py-3 text-xs text-muted">{{ filteredTransactions.length }} lançamentos encontrados</div>
    </section>
  </div>
</template>
