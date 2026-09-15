import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { mockDevices } from '@/mocks/devices'
import { mockOffers } from '@/mocks/offers'
import { mockTransactions } from '@/mocks/transactions'
import type { ChartPoint, EnergyTransaction, MarketOffer, TransactionType } from '@/types/energy'

const isSameDay = (timestamp: string, target: Date) => {
  const date = new Date(timestamp)
  return date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate()
}


export const useEnergyStore = defineStore('energy', () => {
  const user = { name: 'Lucas' }
  const transactions = ref<EnergyTransaction[]>([...mockTransactions])
  const offers = ref<MarketOffer[]>([...mockOffers])
  const devices = ref([...mockDevices])

  const balanceWh = computed(() =>
    transactions.value.reduce((sum, transaction) => sum + transaction.amountWh, 0),
  )

  const referenceDate = computed(() => {
    const latest = transactions.value[0]?.timestamp
    return latest ? new Date(latest) : new Date()
  })

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
      const dayTransactions = transactions.value.filter((transaction) => isSameDay(transaction.timestamp, date))
      points.push({
        label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date).replace('.', ''),
        generationWh: dayTransactions.filter((item) => item.type === 'generation').reduce((sum, item) => sum + item.amountWh, 0),
        consumptionWh: Math.abs(dayTransactions.filter((item) => item.type === 'consumption').reduce((sum, item) => sum + item.amountWh, 0)),
      })
    }
    return points
  })

  function purchaseOffer(offerId: string) {
    const offer = offers.value.find((item) => item.id === offerId)
    if (!offer || offer.seller === user.name) return false

    transactions.value.unshift({
      id: crypto.randomUUID(),
      type: 'transfer_in',
      amountWh: offer.amountWh,
      timestamp: new Date().toISOString(),
      description: `Compra de ${offer.seller}`,
      counterparty: offer.seller,
    })
    offers.value = offers.value.filter((item) => item.id !== offerId)
    return true
  }

  function createOffer(amountWh: number, pricePerKwh: number) {
    if (!Number.isInteger(amountWh) || amountWh <= 0 || pricePerKwh <= 0 || amountWh > balanceWh.value) return false

    offers.value.unshift({
      id: crypto.randomUUID(),
      seller: user.name,
      amountWh,
      pricePerKwh,
    })
    return true
  }

  return {
    user,
    transactions,
    offers,
    devices,
    balanceWh,
    todayGenerationWh,
    todayConsumptionWh,
    boughtWh,
    soldWh,
    recentTransactions,
    weeklyChart,
    purchaseOffer,
    createOffer,
  }
})
