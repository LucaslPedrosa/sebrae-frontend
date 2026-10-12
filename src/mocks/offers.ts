import type { MarketOffer } from '@/types/energy'

const createdAt = '2026-09-15T12:00:00.000Z'

export const mockOffers: MarketOffer[] = [
  { id: 'offer-joao', sellerId: 'joao', seller: 'João', amountWh: 20000, pricePerKwh: 0.54, status: 'open', createdAt },
  { id: 'offer-maria', sellerId: 'maria', seller: 'Maria', amountWh: 8000, pricePerKwh: 0.57, status: 'open', createdAt },
  { id: 'offer-sol-norte', sellerId: 'sol-norte', seller: 'Sol do Norte', amountWh: 35000, pricePerKwh: 0.51, status: 'open', createdAt },
  { id: 'offer-ana', sellerId: 'ana', seller: 'Ana Clara', amountWh: 12500, pricePerKwh: 0.56, status: 'open', createdAt },
  { id: 'offer-coop', sellerId: 'coop', seller: 'Cooperativa Raiz', amountWh: 50000, pricePerKwh: 0.49, status: 'open', createdAt },
]
