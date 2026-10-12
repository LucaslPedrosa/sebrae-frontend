<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Plus, Radio, FlaskConical, X } from '@lucide/vue'
import DeviceCard from '@/components/DeviceCard.vue'
import { useEnergyStore } from '@/stores/energy'
import type { EnergyDevice } from '@/types/energy'

const store = useEnergyStore()
const { devices, status, error: loadError, pendingAction } = storeToRefs(store)
const showAdd = ref(false)
const selectedDevice = ref<EnergyDevice | null>(null)
const name = ref('')
const type = ref<EnergyDevice['type']>('generator')
const location = ref('')
const readingKwh = ref<number | null>(null)
const error = ref('')
const message = ref('')
const onlineCount = computed(() => devices.value.filter((device) => device.status === 'online').length)

async function addDevice() {
  error.value = ''
  const result = await store.createDevice({ name: name.value, type: type.value, location: location.value })
  if (!result.ok) {
    error.value = result.message ?? 'Nao foi possivel adicionar o dispositivo.'
    return
  }
  name.value = ''
  location.value = ''
  showAdd.value = false
  message.value = 'Dispositivo adicionado.'
}

async function saveReading() {
  if (!selectedDevice.value || !readingKwh.value || readingKwh.value <= 0) {
    error.value = 'Informe uma leitura positiva.'
    return
  }
  error.value = ''
  const result = await store.recordReading(selectedDevice.value.id, Math.round(readingKwh.value * 1000))
  if (!result.ok) {
    error.value = result.message ?? 'Nao foi possivel registrar a leitura.'
    return
  }
  selectedDevice.value = null
  readingKwh.value = null
  message.value = 'Leitura simulada registrada no ledger.'
}

onMounted(() => store.loadAll())
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Rede conectada</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Seus dispositivos</h1>
        <p class="mt-2 text-sm text-muted">Acompanhe os pontos que geram e consomem seus créditos.</p>
      </div>
      <button class="flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white transition hover:bg-green" @click="showAdd = true; error = ''">
        <Plus :size="15" /> Adicionar dispositivo
      </button>
    </div>

    <p v-if="message" class="mt-6 rounded-xl bg-green-soft p-4 text-sm text-green" role="status">{{ message }}</p>
    <div v-if="status === 'loading'" class="panel mt-8 p-8 text-center text-sm text-muted" role="status">Carregando dispositivos...</div>
    <div v-else-if="status === 'error'" class="mt-8 rounded-2xl border border-coral/30 bg-coral/10 p-5 text-sm text-coral" role="alert">
      {{ loadError }} <button class="ml-2 font-bold underline" @click="store.loadAll(true)">Tentar novamente</button>
    </div>
    <div v-else class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <DeviceCard v-for="device in devices" :key="device.id" :device="device" :pending="pendingAction === device.id" @reading="selectedDevice = $event; error = ''" />
      <div v-if="devices.length === 0" class="panel col-span-full p-8 text-center text-sm text-muted">Nenhum dispositivo cadastrado. Adicione um medidor simulado para comecar.</div>
    </div>

    <section class="mt-6 grid gap-4 md:grid-cols-2">
      <div class="flex gap-4 rounded-2xl border border-line bg-transparent p-5">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-green"><Radio :size="19" /></span>
        <div>
          <p class="text-sm font-semibold">{{ onlineCount }} de {{ devices.length }} dispositivos online</p>
          <p class="mt-1 text-xs leading-relaxed text-muted">Um dispositivo fica online depois que recebe uma leitura simulada.</p>
        </div>
      </div>
      <div class="flex gap-4 rounded-2xl border border-line bg-transparent p-5">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-green"><FlaskConical :size="19" /></span>
        <div>
          <p class="text-sm font-semibold">Ambiente de simulacao</p>
          <p class="mt-1 text-xs leading-relaxed text-muted">Estas leituras demonstram o fluxo do produto e nao representam medicao certificada.</p>
        </div>
      </div>
    </section>

    <div v-if="showAdd || selectedDevice" class="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-5" @click.self="showAdd = false; selectedDevice = null">
      <form v-if="showAdd" class="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl" @submit.prevent="addDevice">
        <div class="flex items-center justify-between"><h2 class="text-xl font-semibold">Adicionar dispositivo</h2><button type="button" aria-label="Fechar" @click="showAdd = false"><X :size="20" /></button></div>
        <label class="mt-6 block text-xs font-semibold">Nome<input v-model="name" required maxlength="120" class="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none focus:border-green" /></label>
        <label class="mt-4 block text-xs font-semibold">Tipo<select v-model="type" class="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 outline-none focus:border-green"><option value="generator">Gerador</option><option value="consumer">Consumidor</option></select></label>
        <label class="mt-4 block text-xs font-semibold">Localizacao<input v-model="location" required maxlength="240" class="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none focus:border-green" /></label>
        <p v-if="error" class="mt-3 text-xs text-coral" role="alert">{{ error }}</p>
        <button :disabled="pendingAction === 'create-device'" class="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{{ pendingAction === 'create-device' ? 'Adicionando...' : 'Adicionar' }}</button>
      </form>

      <form v-else-if="selectedDevice" class="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl" @submit.prevent="saveReading">
        <div class="flex items-center justify-between"><div><p class="eyebrow">Leitura simulada</p><h2 class="mt-1 text-xl font-semibold">{{ selectedDevice.name }}</h2></div><button type="button" aria-label="Fechar" @click="selectedDevice = null"><X :size="20" /></button></div>
        <label class="mt-6 block text-xs font-semibold">Quantidade em kWh<input v-model="readingKwh" required type="number" min="0.001" step="0.001" class="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none focus:border-green" /></label>
        <p class="mt-3 text-xs leading-relaxed text-muted">A leitura sera registrada como {{ selectedDevice.type === 'generator' ? 'geracao' : 'consumo' }} no seu ledger.</p>
        <p v-if="error" class="mt-3 text-xs text-coral" role="alert">{{ error }}</p>
        <button :disabled="pendingAction === selectedDevice.id" class="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{{ pendingAction === selectedDevice.id ? 'Registrando...' : 'Registrar leitura' }}</button>
      </form>
    </div>
  </div>
</template>
