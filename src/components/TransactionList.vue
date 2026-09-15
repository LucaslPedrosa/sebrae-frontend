<script setup lang="ts">
import type { EnergyTransaction } from '@/types/energy'
import TransactionItem from './TransactionItem.vue'

withDefaults(defineProps<{ transactions: EnergyTransaction[]; showDate?: boolean }>(), { showDate: false })
</script>

<template>
  <div>
    <template v-if="transactions.length">
      <TransactionItem
        v-for="transaction in transactions"
        :key="transaction.id"
        :transaction="transaction"
        :show-date="showDate"
        class="border-b border-line last:border-0"
      />
    </template>
    <div v-else class="py-16 text-center text-sm text-muted">Nenhuma transação encontrada.</div>
  </div>
</template>
