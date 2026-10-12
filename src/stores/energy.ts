import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getSupabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { mockDevices } from '@/mocks/devices'
import { mockOffers } from '@/mocks/offers'
import { mockTransactions } from '@/mocks/transactions'
import type {
  ActionResult,
  ChartPoint,
  EnergyDevice,
  EnergyTransaction,
  MarketOffer,
  ResourceStatus,
  TransactionType,
} from '@/types/energy'

const isSameDay = (timestamp: string, target: Date) => {
  const date = new Date(timestamp)
  return date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate()
}

const errorMessages: Record<string, string> = {
  insufficient_available_energy: 'Seu saldo disponivel nao e suficiente.',
  offer_not_found: 'A oferta nao foi encontrada.',
  offer_not_open: 'Esta oferta nao esta mais disponivel.',
  cannot_buy_own_offer: 'Voce nao pode comprar sua propria oferta.',
  offer_not_owned: 'Esta oferta nao pertence a sua conta.',
  device_not_owned: 'Dispositivo nao encontrado.',
}

function messageFromError(error: { message?: string } | null, fallback: string) {
  if (!error?.message) return fallback
  const code = Object.keys(errorMessages).find((key) => error.message?.includes(key))
  return code ? errorMessages[code] : fallback
}

function relatedName(value: unknown) {
  if (Array.isArray(value)) return value[0]?.display_name ?? undefined
  if (value && typeof value === 'object' && 'display_name' in value) {
    return String((value as { display_name: unknown }).display_name)
  }
  return undefined
}

const demoStorageKey = 'lumina:demo-data:v1'

interface DemoData {
  transactions: EnergyTransaction[]
  offers: MarketOffer[]
  devices: EnergyDevice[]
}

function createDemoData(): DemoData {
  const sourceDate = new Date(mockTransactions[0]?.timestamp ?? Date.now()).getTime()
  const currentDate = Date.now()
  return {
    transactions: mockTransactions.map((transaction) => ({
      ...transaction,
      timestamp: new Date(currentDate - (sourceDate - new Date(transaction.timestamp).getTime())).toISOString(),
    })),
    offers: mockOffers.map((offer) => ({ ...offer })),
    devices: mockDevices.map((device) => ({ ...device, lastSeenAt: device.status === 'online' ? new Date().toISOString() : undefined })),
  }
}

export const useEnergyStore = defineStore('energy', () => {
  const auth = useAuthStore()
  const transactions = ref<EnergyTransaction[]>([])
  const offers = ref<MarketOffer[]>([])
  const devices = ref<EnergyDevice[]>([])
  const status = ref<ResourceStatus>('idle')
  const error = ref('')
  const pendingAction = ref<string | null>(null)

  const balanceWh = computed(() => transactions.value.reduce((sum, transaction) => sum + transaction.amountWh, 0))
  const reservedWh = computed(() => offers.value
    .filter((offer) => offer.sellerId === auth.user?.id && offer.status === 'open')
    .reduce((sum, offer) => sum + offer.amountWh, 0))
  const availableBalanceWh = computed(() => balanceWh.value - reservedWh.value)
  const referenceDate = computed(() => new Date())

  const totalByType = (type: TransactionType) => transactions.value
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + Math.abs(transaction.amountWh), 0)

  const todayGenerationWh = computed(() => transactions.value
    .filter((transaction) => transaction.type === 'generation' && isSameDay(transaction.timestamp, referenceDate.value))
    .reduce((sum, transaction) => sum + transaction.amountWh, 0))
  const todayConsumptionWh = computed(() => transactions.value
    .filter((transaction) => transaction.type === 'consumption' && isSameDay(transaction.timestamp, referenceDate.value))
    .reduce((sum, transaction) => sum + Math.abs(transaction.amountWh), 0))
  const boughtWh = computed(() => totalByType('transfer_in'))
  const soldWh = computed(() => totalByType('transfer_out'))
  const recentTransactions = computed(() => transactions.value.slice(0, 5))

  const weeklyChart = computed<ChartPoint[]>(() => {
    const points: ChartPoint[] = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(referenceDate.value)
      date.setDate(date.getDate() - offset)
      const entries = transactions.value.filter((transaction) => isSameDay(transaction.timestamp, date))
      points.push({
        label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''),
        generationWh: entries.filter((item) => item.type === 'generation').reduce((sum, item) => sum + item.amountWh, 0),
        consumptionWh: Math.abs(entries.filter((item) => item.type === 'consumption').reduce((sum, item) => sum + item.amountWh, 0)),
      })
    }
    return points
  })

  function saveDemoData() {
    localStorage.setItem(demoStorageKey, JSON.stringify({
      transactions: transactions.value,
      offers: offers.value,
      devices: devices.value,
    } satisfies DemoData))
  }

  function loadDemoData() {
    let data: DemoData
    try {
      const saved = localStorage.getItem(demoStorageKey)
      data = saved ? JSON.parse(saved) as DemoData : createDemoData()
    } catch {
      data = createDemoData()
    }
    transactions.value = data.transactions
    offers.value = data.offers
    devices.value = data.devices
    saveDemoData()
  }

  async function loadTransactions(expectedUserId: string) {
    const { data, error: queryError } = await getSupabase()
      .from('ledger_entries')
      .select('id, type, amount_wh, created_at, description, device_id, counterparty:profiles!ledger_entries_counterparty_id_fkey(display_name)')
      .order('created_at', { ascending: false })
    if (queryError) throw queryError
    if (auth.user?.id !== expectedUserId) return
    transactions.value = (data ?? []).map((entry) => ({
      id: entry.id,
      type: entry.type as TransactionType,
      amountWh: Number(entry.amount_wh),
      timestamp: entry.created_at,
      description: entry.description,
      deviceId: entry.device_id ?? undefined,
      counterparty: relatedName(entry.counterparty),
    }))
  }

  async function loadOffers(expectedUserId: string) {
    const { data, error: queryError } = await getSupabase()
      .from('offers')
      .select('id, seller_id, amount_wh, price_per_kwh, status, created_at, seller:profiles!offers_seller_id_fkey(display_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (queryError) throw queryError
    if (auth.user?.id !== expectedUserId) return
    offers.value = (data ?? []).map((offer) => ({
      id: offer.id,
      sellerId: offer.seller_id,
      seller: relatedName(offer.seller) ?? 'Usuario',
      amountWh: Number(offer.amount_wh),
      pricePerKwh: Number(offer.price_per_kwh),
      status: offer.status as MarketOffer['status'],
      createdAt: offer.created_at,
    }))
  }

  async function loadDevices(expectedUserId: string) {
    const { data, error: queryError } = await getSupabase()
      .from('devices')
      .select('id, name, type, status, location, last_seen_at')
      .order('created_at', { ascending: true })
    if (queryError) throw queryError
    if (auth.user?.id !== expectedUserId) return
    devices.value = (data ?? []).map((device) => ({
      id: device.id,
      name: device.name,
      type: device.type as EnergyDevice['type'],
      status: device.status as EnergyDevice['status'],
      energyTodayWh: transactions.value
        .filter((entry) => entry.deviceId === device.id && isSameDay(entry.timestamp, new Date()))
        .reduce((sum, entry) => sum + Math.abs(entry.amountWh), 0),
      location: device.location,
      lastSeenAt: device.last_seen_at ?? undefined,
    }))
  }

  async function loadAll(force = false) {
    if (status.value === 'loading' || (!force && status.value === 'success')) return
    const userId = auth.user?.id
    if (!userId) return
    status.value = 'loading'
    error.value = ''
    if (auth.demoMode) {
      loadDemoData()
      status.value = 'success'
      return
    }
    try {
      await Promise.all([loadTransactions(userId), loadOffers(userId)])
      if (auth.user?.id !== userId) return
      await loadDevices(userId)
      if (auth.user?.id !== userId) return
      status.value = 'success'
    } catch (cause) {
      if (auth.user?.id !== userId) return
      status.value = 'error'
      error.value = 'Nao foi possivel carregar seus dados.'
      console.error(cause)
    }
  }

  async function purchaseOffer(offerId: string): Promise<ActionResult> {
    pendingAction.value = offerId
    if (auth.demoMode) {
      const offer = offers.value.find((item) => item.id === offerId)
      if (!offer || offer.sellerId === auth.user?.id) {
        pendingAction.value = null
        return { ok: false, message: 'Esta oferta nao pode ser comprada.' }
      }
      transactions.value.unshift({
        id: crypto.randomUUID(),
        type: 'transfer_in',
        amountWh: offer.amountWh,
        timestamp: new Date().toISOString(),
        description: `Compra simulada de ${offer.seller}`,
        counterparty: offer.seller,
      })
      offers.value = offers.value.filter((item) => item.id !== offerId)
      saveDemoData()
      pendingAction.value = null
      return { ok: true }
    }
    const { error: rpcError } = await getSupabase().rpc('buy_offer', { p_offer_id: offerId })
    pendingAction.value = null
    if (rpcError) return { ok: false, message: messageFromError(rpcError, 'Nao foi possivel concluir a compra.') }
    await loadAll(true)
    return { ok: true }
  }

  async function createOffer(amountWh: number, pricePerKwh: number): Promise<ActionResult> {
    if (!Number.isInteger(amountWh) || amountWh <= 0 || pricePerKwh <= 0) {
      return { ok: false, message: 'Informe quantidade e preco validos.' }
    }
    pendingAction.value = 'create-offer'
    if (auth.demoMode) {
      if (amountWh > availableBalanceWh.value) {
        pendingAction.value = null
        return { ok: false, message: 'Seu saldo disponivel nao e suficiente.' }
      }
      offers.value.unshift({
        id: crypto.randomUUID(),
        sellerId: 'demo-user',
        seller: auth.user?.name ?? 'Visitante',
        amountWh,
        pricePerKwh,
        status: 'open',
        createdAt: new Date().toISOString(),
      })
      saveDemoData()
      pendingAction.value = null
      return { ok: true }
    }
    const { error: rpcError } = await getSupabase().rpc('create_offer', {
      p_amount_wh: amountWh,
      p_price_per_kwh: pricePerKwh,
    })
    pendingAction.value = null
    if (rpcError) return { ok: false, message: messageFromError(rpcError, 'Nao foi possivel publicar a oferta.') }
    await loadAll(true)
    return { ok: true }
  }

  async function cancelOffer(offerId: string): Promise<ActionResult> {
    pendingAction.value = offerId
    if (auth.demoMode) {
      const offer = offers.value.find((item) => item.id === offerId)
      if (!offer || offer.sellerId !== auth.user?.id) {
        pendingAction.value = null
        return { ok: false, message: 'Esta oferta nao pertence a voce.' }
      }
      offers.value = offers.value.filter((item) => item.id !== offerId)
      saveDemoData()
      pendingAction.value = null
      return { ok: true }
    }
    const { error: rpcError } = await getSupabase().rpc('cancel_offer', { p_offer_id: offerId })
    pendingAction.value = null
    if (rpcError) return { ok: false, message: messageFromError(rpcError, 'Nao foi possivel cancelar a oferta.') }
    await loadAll(true)
    return { ok: true }
  }

  async function createDevice(input: Pick<EnergyDevice, 'name' | 'type' | 'location'>): Promise<ActionResult> {
    if (!auth.user) return { ok: false, message: 'Sessao expirada.' }
    pendingAction.value = 'create-device'
    if (auth.demoMode) {
      devices.value.push({
        id: crypto.randomUUID(),
        name: input.name.trim(),
        type: input.type,
        status: 'offline',
        energyTodayWh: 0,
        location: input.location.trim(),
      })
      saveDemoData()
      pendingAction.value = null
      return { ok: true }
    }
    const { error: queryError } = await getSupabase().from('devices').insert({
      owner_id: auth.user.id,
      name: input.name.trim(),
      type: input.type,
      location: input.location.trim(),
    })
    pendingAction.value = null
    if (queryError) return { ok: false, message: 'Nao foi possivel adicionar o dispositivo.' }
    await loadAll(true)
    return { ok: true }
  }

  async function recordReading(deviceId: string, amountWh: number): Promise<ActionResult> {
    pendingAction.value = deviceId
    if (auth.demoMode) {
      const device = devices.value.find((item) => item.id === deviceId)
      if (!device || amountWh <= 0) {
        pendingAction.value = null
        return { ok: false, message: 'Informe uma leitura valida.' }
      }
      if (device.type === 'consumer' && amountWh > availableBalanceWh.value) {
        pendingAction.value = null
        return { ok: false, message: 'O consumo supera seu saldo disponivel.' }
      }
      const signedAmount = device.type === 'generator' ? amountWh : -amountWh
      transactions.value.unshift({
        id: crypto.randomUUID(),
        type: device.type === 'generator' ? 'generation' : 'consumption',
        amountWh: signedAmount,
        timestamp: new Date().toISOString(),
        description: `${device.type === 'generator' ? 'Geracao' : 'Consumo'} simulado - ${device.name}`,
        deviceId: device.id,
      })
      device.status = 'online'
      device.lastSeenAt = new Date().toISOString()
      device.energyTodayWh += amountWh
      saveDemoData()
      pendingAction.value = null
      return { ok: true }
    }
    const { error: rpcError } = await getSupabase().rpc('record_simulated_reading', {
      p_device_id: deviceId,
      p_amount_wh: amountWh,
    })
    pendingAction.value = null
    if (rpcError) return { ok: false, message: messageFromError(rpcError, 'Nao foi possivel registrar a leitura.') }
    await loadAll(true)
    return { ok: true }
  }

  function reset() {
    transactions.value = []
    offers.value = []
    devices.value = []
    status.value = 'idle'
    error.value = ''
    pendingAction.value = null
  }

  return {
    transactions,
    offers,
    devices,
    status,
    error,
    pendingAction,
    balanceWh,
    reservedWh,
    availableBalanceWh,
    todayGenerationWh,
    todayConsumptionWh,
    boughtWh,
    soldWh,
    recentTransactions,
    weeklyChart,
    loadAll,
    purchaseOffer,
    createOffer,
    cancelOffer,
    createDevice,
    recordReading,
    reset,
  }
})
