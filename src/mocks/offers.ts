import type { MarketOffer } from '@/types/energy'

export const mockOffers: MarketOffer[] = [
  { id: 'offer-joao', seller: 'João', amountWh: 20000, pricePerKwh: 0.54 },
  { id: 'offer-maria', seller: 'Maria', amountWh: 8000, pricePerKwh: 0.57 },
  { id: 'offer-sol-norte', seller: 'Sol do Norte', amountWh: 35000, pricePerKwh: 0.51 },
  { id: 'offer-ana', seller: 'Ana Clara', amountWh: 12500, pricePerKwh: 0.56 },
  { id: 'offer-coop', seller: 'Cooperativa Raiz', amountWh: 50000, pricePerKwh: 0.49 },
]
