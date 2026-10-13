<script setup lang="ts">
import type { EnergyTransaction } from '@/types/energy'
import TransactionItem from './TransactionItem.vue'

withDefaults(defineProps<{ transactions: EnergyTransaction[]; showDate?: boolean }>(), { showDate: false })
</script>

<template>
  <div>
    <TransitionGroup v-if="transactions.length" name="fade-scale" tag="div" role="list">
      <TransactionItem
        v-for="transaction in transactions"
        :key="transaction.id"
        :transaction="transaction"
        :show-date="showDate"
        role="listitem"
        class="border-b border-line last:border-0"
      />
    </TransitionGroup>
    <div v-else class="py-16 text-center text-sm text-muted"><span class="mx-auto mb-3 block size-2 rounded-full bg-line ring-8 ring-line/30"></span>Nenhuma transação encontrada.</div>
  </div>
</template>
