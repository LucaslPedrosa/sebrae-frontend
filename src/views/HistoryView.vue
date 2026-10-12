<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Download, Search } from '@lucide/vue'
import TransactionList from '@/components/TransactionList.vue'
import { useEnergyStore } from '@/stores/energy'

type Filter = 'all' | 'generation' | 'consumption' | 'transfers'

const store = useEnergyStore()
const { transactions, status, error } = storeToRefs(store)
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

function exportCsv() {
  const escape = (value: string | number) => {
    const text = typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : String(value)
    return `"${text.replace(/"/g, '""')}"`
  }
  const rows = [
    ['data', 'tipo', 'quantidade_wh', 'descricao', 'contraparte'],
    ...filteredTransactions.value.map((transaction) => [
      transaction.timestamp,
      transaction.type,
      transaction.amountWh,
      transaction.description,
      transaction.counterparty ?? '',
    ]),
  ]
  const csv = rows.map((row) => row.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `extrato-lumina-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => store.loadAll())
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Ledger persistente</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Histórico de energia</h1>
        <p class="mt-2 text-sm text-muted">Cada watt-hora gerado, consumido ou transferido.</p>
      </div>
      <button :disabled="transactions.length === 0" class="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-semibold transition hover:border-ink/30 disabled:opacity-50" @click="exportCsv">
        <Download :size="15" /> Exportar extrato
      </button>
    </div>

    <div v-if="status === 'loading'" class="panel mt-8 p-8 text-center text-sm text-muted" role="status">Carregando historico...</div>
    <div v-else-if="status === 'error'" class="mt-8 rounded-2xl border border-coral/30 bg-coral/10 p-5 text-sm text-coral" role="alert">
      {{ error }} <button class="ml-2 font-bold underline" @click="store.loadAll(true)">Tentar novamente</button>
    </div>
    <section v-else class="panel mt-8 overflow-hidden">
      <div class="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div class="flex gap-1 overflow-x-auto rounded-xl bg-canvas p-1">
          <button
            v-for="filter in filters"
            :key="filter.value"
            class="whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition"
            :class="selectedFilter === filter.value ? 'bg-ink text-white' : 'text-muted hover:text-ink'"
            :aria-pressed="selectedFilter === filter.value"
            @click="selectedFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
        <label class="flex items-center gap-2 rounded-xl border border-line px-3 text-muted focus-within:border-ink/40 focus-within:text-ink">
          <span class="sr-only">Buscar no historico</span>
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
