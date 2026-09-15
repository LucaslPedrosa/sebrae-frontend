<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { BadgeDollarSign, Check, Info, Plus } from '@lucide/vue'
import OfferCard from '@/components/OfferCard.vue'
import { useEnergyStore } from '@/stores/energy'
import { formatEnergy } from '@/utils/formatters'

const store = useEnergyStore()
const { offers, balanceWh } = storeToRefs(store)

const amountKwh = ref<number | null>(null)
const pricePerKwh = ref<number | null>(null)
const message = ref('')
const error = ref('')

function showMessage(text: string) {
  message.value = text
  window.setTimeout(() => { message.value = '' }, 3000)
}

function buyOffer(id: string) {
  const offer = offers.value.find((item) => item.id === id)
  if (offer && store.purchaseOffer(id)) showMessage(`${formatEnergy(offer.amountWh)} adicionados ao seu saldo.`)
}

function submitOffer() {
  error.value = ''
  if (!amountKwh.value || !pricePerKwh.value) {
    error.value = 'Preencha quantidade e preço.'
    return
  }

  const amountWh = Math.round(amountKwh.value * 1000)
  if (!store.createOffer(amountWh, pricePerKwh.value)) {
    error.value = 'A quantidade deve ser positiva e não pode superar seu saldo.'
    return
  }

  amountKwh.value = null
  pricePerKwh.value = null
  showMessage('Oferta publicada no mercado.')
}
</script>

<template>
  <div>
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow">Mercado aberto</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Energia que circula.</h1>
        <p class="mt-2 max-w-xl text-sm text-muted">Compre créditos disponíveis ou publique parte da energia que você já gerou.</p>
      </div>
      <div class="rounded-2xl border border-line bg-white px-5 py-3">
        <p class="text-[10px] font-bold uppercase tracking-wider text-muted">Seu saldo</p>
        <p class="mt-1 text-lg font-semibold text-green">{{ formatEnergy(balanceWh, 3) }}</p>
      </div>
    </div>

    <div v-if="message" class="fixed right-5 top-20 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-xl sm:right-8">
      <Check :size="16" class="text-lime" /> {{ message }}
    </div>

    <div class="mt-8 grid gap-7 xl:grid-cols-[1fr_320px]">
      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Ofertas disponíveis</h2>
          <span class="text-xs text-muted">{{ offers.length }} ofertas</span>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <OfferCard
            v-for="offer in offers"
            :key="offer.id"
            :offer="offer"
            :is-own="offer.seller === store.user.name"
            @buy="buyOffer"
          />
        </div>
      </section>

      <aside class="xl:sticky xl:top-28 xl:self-start">
        <form class="rounded-[22px] bg-ink p-6 text-white" @submit.prevent="submitOffer">
          <span class="grid size-10 place-items-center rounded-xl bg-lime text-ink"><BadgeDollarSign :size="20" /></span>
          <h2 class="mt-6 text-xl font-semibold">Criar oferta</h2>
          <p class="mt-1 text-xs leading-relaxed text-white/45">Defina a quantidade e seu preço por kWh.</p>

          <label class="mt-6 block text-xs font-semibold text-white/65" for="amount">Quantidade</label>
          <div class="mt-2 flex items-center rounded-xl border border-white/10 bg-white/7 px-3 focus-within:border-lime/60">
            <input id="amount" v-model="amountKwh" type="number" min="0.001" step="0.001" placeholder="0,000" class="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/25" />
            <span class="text-xs text-white/40">kWh</span>
          </div>

          <label class="mt-4 block text-xs font-semibold text-white/65" for="price">Preço por kWh</label>
          <div class="mt-2 flex items-center rounded-xl border border-white/10 bg-white/7 px-3 focus-within:border-lime/60">
            <span class="mr-2 text-xs text-white/40">R$</span>
            <input id="price" v-model="pricePerKwh" type="number" min="0.01" step="0.01" placeholder="0,00" class="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/25" />
          </div>

          <p v-if="error" class="mt-3 text-xs text-coral">{{ error }}</p>
          <p class="mt-4 flex gap-2 text-[11px] leading-relaxed text-white/35"><Info :size="13" class="mt-0.5 shrink-0" /> Publicar não desconta seu saldo. O débito ocorre somente quando a energia for vendida.</p>
          <button class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-lime py-3 text-sm font-bold text-ink transition hover:bg-white" type="submit">
            <Plus :size="16" /> Criar oferta
          </button>
        </form>
      </aside>
    </div>
  </div>
</template>
