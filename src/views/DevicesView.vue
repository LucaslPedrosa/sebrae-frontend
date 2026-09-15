<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Plus, Radio, ShieldCheck } from '@lucide/vue'
import DeviceCard from '@/components/DeviceCard.vue'
import { useEnergyStore } from '@/stores/energy'

const store = useEnergyStore()
const { devices } = storeToRefs(store)
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Rede conectada</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Seus dispositivos</h1>
        <p class="mt-2 text-sm text-muted">Acompanhe os pontos que geram e consomem seus créditos.</p>
      </div>
      <button class="flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white transition hover:bg-green">
        <Plus :size="15" /> Adicionar dispositivo
      </button>
    </div>

    <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DeviceCard v-for="device in devices" :key="device.id" :device="device" />
    </div>

    <section class="mt-6 grid gap-4 md:grid-cols-2">
      <div class="flex gap-4 rounded-2xl border border-line bg-transparent p-5">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-green"><Radio :size="19" /></span>
        <div>
          <p class="text-sm font-semibold">2 de 3 dispositivos online</p>
          <p class="mt-1 text-xs leading-relaxed text-muted">O Medidor Studio está sem enviar leituras. A última conexão foi há 3 dias.</p>
        </div>
      </div>
      <div class="flex gap-4 rounded-2xl border border-line bg-transparent p-5">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-green"><ShieldCheck :size="19" /></span>
        <div>
          <p class="text-sm font-semibold">Leituras confiáveis</p>
          <p class="mt-1 text-xs leading-relaxed text-muted">Todos os medidores vinculados estão validados para contabilização de energia.</p>
        </div>
      </div>
    </section>
  </div>
</template>
