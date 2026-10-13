<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const addDialog = ref<HTMLFormElement | null>(null)
const readingDialog = ref<HTMLFormElement | null>(null)
let previousFocus: HTMLElement | null = null
const onlineCount = computed(() => devices.value.filter((device) => device.status === 'online').length)
const dialogOpen = computed(() => showAdd.value || Boolean(selectedDevice.value))

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

function closeDialogs() {
  showAdd.value = false
  selectedDevice.value = null
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDialogs()
}

function handleDialogKeydown(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const dialog = addDialog.value ?? readingDialog.value
  if (!dialog) return
  const controls = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(dialogOpen, async (open) => {
  const shell = document.querySelector<HTMLElement>('.app-shell')
  if (open) {
    previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    if (shell) shell.inert = true
    await nextTick()
    const dialog = addDialog.value ?? readingDialog.value
    dialog?.querySelector<HTMLElement>('input, select, button')?.focus()
  } else {
    document.body.style.overflow = ''
    if (shell) shell.inert = false
    previousFocus?.focus()
  }
})

onMounted(() => {
  void store.loadAll()
  window.addEventListener('keydown', handleEscape)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
  const shell = document.querySelector<HTMLElement>('.app-shell')
  if (shell) shell.inert = false
})
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Rede conectada</p>
        <h1 class="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Seus dispositivos</h1>
        <p class="mt-2 text-sm text-muted">Acompanhe os pontos que geram e consomem seus créditos.</p>
      </div>
      <button class="flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white shadow-[0_10px_25px_rgba(20,32,28,.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-green active:scale-95" @click="showAdd = true; error = ''">
        <Plus :size="15" /> Adicionar dispositivo
      </button>
    </div>

    <Transition name="fade-scale"><p v-if="message" class="mt-6 rounded-xl border border-green/10 bg-green-soft p-4 text-sm font-medium text-green" role="status">{{ message }}</p></Transition>
    <div v-if="status === 'loading'" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Carregando dispositivos"><div v-for="item in 3" :key="item" class="skeleton h-72 rounded-[22px]"></div></div>
    <div v-else-if="status === 'error'" class="mt-8 rounded-2xl border border-coral/30 bg-coral/10 p-5 text-sm text-coral" role="alert">
      {{ loadError }} <button class="ml-2 font-bold underline" @click="store.loadAll(true)">Tentar novamente</button>
    </div>
    <div v-else class="stagger-grid mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showAdd || selectedDevice" class="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-3 backdrop-blur-sm sm:items-center sm:p-5" @click.self="closeDialogs" @keydown="handleDialogKeydown">
          <form v-if="showAdd" ref="addDialog" role="dialog" aria-modal="true" aria-labelledby="add-device-title" class="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]" @submit.prevent="addDevice">
            <div class="flex items-center justify-between"><h2 id="add-device-title" class="text-xl font-semibold">Adicionar dispositivo</h2><button type="button" class="grid size-10 place-items-center rounded-full bg-canvas text-muted transition hover:text-ink" aria-label="Fechar" @click="showAdd = false"><X :size="20" /></button></div>
            <label class="mt-6 block text-xs font-semibold">Nome<input v-model="name" required maxlength="120" class="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none focus:border-green" /></label>
            <label class="mt-4 block text-xs font-semibold">Tipo<select v-model="type" class="mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 outline-none focus:border-green"><option value="generator">Gerador</option><option value="consumer">Consumidor</option></select></label>
            <label class="mt-4 block text-xs font-semibold">Localizacao<input v-model="location" required maxlength="240" class="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none focus:border-green" /></label>
            <p v-if="error" class="mt-3 text-xs text-coral" role="alert">{{ error }}</p>
            <button :disabled="pendingAction === 'create-device'" class="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{{ pendingAction === 'create-device' ? 'Adicionando...' : 'Adicionar' }}</button>
          </form>

          <form v-else-if="selectedDevice" ref="readingDialog" role="dialog" aria-modal="true" aria-labelledby="reading-title" class="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]" @submit.prevent="saveReading">
            <div class="flex items-center justify-between"><div><p class="eyebrow">Leitura simulada</p><h2 id="reading-title" class="mt-1 text-xl font-semibold">{{ selectedDevice.name }}</h2></div><button type="button" class="grid size-10 place-items-center rounded-full bg-canvas text-muted transition hover:text-ink" aria-label="Fechar" @click="selectedDevice = null"><X :size="20" /></button></div>
            <label class="mt-6 block text-xs font-semibold">Quantidade em kWh<input v-model="readingKwh" required type="number" min="0.001" step="0.001" class="mt-2 w-full rounded-xl border border-line px-3 py-3 outline-none focus:border-green" /></label>
            <p class="mt-3 text-xs leading-relaxed text-muted">A leitura sera registrada como {{ selectedDevice.type === 'generator' ? 'geracao' : 'consumo' }} no seu ledger.</p>
            <p v-if="error" class="mt-3 text-xs text-coral" role="alert">{{ error }}</p>
            <button :disabled="pendingAction === selectedDevice.id" class="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{{ pendingAction === selectedDevice.id ? 'Registrando...' : 'Registrar leitura' }}</button>
          </form>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
