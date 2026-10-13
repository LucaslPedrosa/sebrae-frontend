<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { BadgeDollarSign, Check, Info, Plus } from '@lucide/vue'
import OfferCard from '@/components/OfferCard.vue'
import { useEnergyStore } from '@/stores/energy'
import { useAuthStore } from '@/stores/auth'
import { formatEnergy } from '@/utils/formatters'

const store = useEnergyStore()
const auth = useAuthStore()
const { offers, availableBalanceWh, status, error: loadError, pendingAction } = storeToRefs(store)

const amountKwh = ref<number | null>(null)
const pricePerKwh = ref<number | null>(null)
const message = ref('')
const error = ref('')
let messageTimer: number | undefined

function showMessage(text: string) {
  message.value = text
  window.clearTimeout(messageTimer)
  messageTimer = window.setTimeout(() => { message.value = '' }, 3000)
}

async function buyOffer(id: string) {
  error.value = ''
  const offer = offers.value.find((item) => item.id === id)
  if (!offer) return
  const result = await store.purchaseOffer(id)
  if (result.ok) showMessage(`${formatEnergy(offer.amountWh)} adicionados ao seu saldo.`)
  else error.value = result.message ?? 'Nao foi possivel concluir a compra.'
}

async function submitOffer() {
  error.value = ''
  if (!amountKwh.value || !pricePerKwh.value) {
    error.value = 'Preencha quantidade e preço.'
    return
  }

  const amountWh = Math.round(amountKwh.value * 1000)
  const result = await store.createOffer(amountWh, pricePerKwh.value)
  if (!result.ok) {
    error.value = result.message ?? 'Nao foi possivel publicar a oferta.'
    return
  }

  amountKwh.value = null
  pricePerKwh.value = null
  showMessage('Oferta publicada no mercado.')
}

async function cancelOffer(id: string) {
  error.value = ''
  const result = await store.cancelOffer(id)
  if (result.ok) showMessage('Oferta cancelada e saldo liberado.')
  else error.value = result.message ?? 'Nao foi possivel cancelar a oferta.'
}

onMounted(() => store.loadAll())
onBeforeUnmount(() => window.clearTimeout(messageTimer))
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Mercado aberto</p>
        <h1 class="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Energia que circula.</h1>
        <p class="mt-2 max-w-xl text-sm text-muted">Compre creditos simulados ou publique parte da energia registrada no seu ledger.</p>
      </div>
      <div class="panel px-5 py-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Seu saldo</p>
        <p class="mt-1 text-lg font-semibold text-green">{{ formatEnergy(availableBalanceWh, 3) }}</p>
      </div>
    </div>

    <Transition name="fade-scale">
      <div v-if="message" class="fixed left-5 right-5 top-20 z-50 flex max-w-md items-center gap-2 rounded-2xl border border-white/10 bg-ink/95 px-4 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur-xl sm:left-auto sm:right-8" role="status" aria-live="polite">
        <span class="grid size-7 shrink-0 place-items-center rounded-full bg-lime/15"><Check :size="15" class="text-lime" /></span> {{ message }}
      </div>
    </Transition>

    <div v-if="status === 'loading'" class="mt-8 grid gap-4 md:grid-cols-2" role="status" aria-label="Carregando mercado"><div v-for="item in 4" :key="item" class="skeleton h-60 rounded-[22px]"></div></div>
    <div v-else-if="status === 'error'" class="mt-8 rounded-2xl border border-coral/30 bg-coral/10 p-5 text-sm text-coral" role="alert">
      {{ loadError }} <button class="ml-2 font-bold underline" @click="store.loadAll(true)">Tentar novamente</button>
    </div>
    <div v-else class="mt-8 grid gap-7 xl:grid-cols-[1fr_320px]">
      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Ofertas disponíveis</h2>
          <span class="text-xs text-muted">{{ offers.length }} ofertas</span>
        </div>
        <TransitionGroup name="fade-scale" tag="div" class="stagger-grid grid gap-4 md:grid-cols-2">
          <OfferCard
            v-for="offer in offers"
            :key="offer.id"
            :offer="offer"
            :is-own="offer.sellerId === auth.user?.id"
            :pending="pendingAction === offer.id"
            @buy="buyOffer"
            @cancel="cancelOffer"
          />
          <div v-if="offers.length === 0" key="empty-market" class="panel col-span-full p-8 text-center text-sm text-muted">Nenhuma oferta aberta. Registre geracao e publique a primeira.</div>
        </TransitionGroup>
      </section>

      <aside class="xl:sticky xl:top-28 xl:self-start">
        <form class="relative overflow-hidden rounded-[24px] bg-ink p-6 text-white shadow-[0_24px_60px_rgba(20,32,28,.18)]" @submit.prevent="submitOffer">
          <div class="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-lime/10 blur-3xl"></div>
          <span class="grid size-10 place-items-center rounded-xl bg-lime text-ink"><BadgeDollarSign :size="20" /></span>
          <h2 class="mt-6 text-xl font-semibold">Criar oferta</h2>
          <p class="mt-1 text-xs leading-relaxed text-white/60">Defina a quantidade e seu preço por kWh.</p>

          <label class="mt-6 block text-xs font-semibold text-white/65" for="amount">Quantidade</label>
          <div class="mt-2 flex items-center rounded-xl border border-white/10 bg-white/7 px-3 focus-within:border-lime/60">
            <input id="amount" v-model="amountKwh" required type="number" min="0.001" step="0.001" placeholder="0,000" class="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/35" />
            <span class="text-xs text-white/55">kWh</span>
          </div>

          <label class="mt-4 block text-xs font-semibold text-white/65" for="price">Preço por kWh</label>
          <div class="mt-2 flex items-center rounded-xl border border-white/10 bg-white/7 px-3 focus-within:border-lime/60">
            <span class="mr-2 text-xs text-white/55">R$</span>
            <input id="price" v-model="pricePerKwh" required type="number" min="0.01" step="0.01" placeholder="0,00" class="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/35" />
          </div>

          <p v-if="error" class="mt-3 text-xs text-coral" role="alert">{{ error }}</p>
          <p class="mt-4 flex gap-2 text-[11px] leading-relaxed text-white/55"><Info :size="13" class="mt-0.5 shrink-0" /> A energia fica reservada ao publicar e e debitada somente na venda.</p>
          <button :disabled="pendingAction === 'create-offer'" class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 text-sm font-bold text-ink transition duration-300 hover:-translate-y-0.5 hover:bg-white active:scale-[.98] disabled:opacity-50" type="submit">
            <Plus :size="16" /> {{ pendingAction === 'create-offer' ? 'Publicando...' : 'Criar oferta' }}
          </button>
        </form>
      </aside>
    </div>
  </div>
</template>
