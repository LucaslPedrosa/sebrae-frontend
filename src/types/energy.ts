export type TransactionType =
  | 'generation'
  | 'consumption'
  | 'transfer_in'
  | 'transfer_out'

export interface EnergyTransaction {
  id: string
  type: TransactionType
  amountWh: number
  timestamp: string
  description: string
  deviceId?: string
  counterparty?: string
}

export interface EnergyDevice {
  id: string
  name: string
  type: 'generator' | 'consumer'
  status: 'online' | 'offline'
  energyTodayWh: number
  location: string
  lastSeenAt?: string
}

export interface MarketOffer {
  id: string
  sellerId: string
  seller: string
  amountWh: number
  pricePerKwh: number
  status: 'open' | 'sold' | 'cancelled'
  createdAt: string
}

export interface ChartPoint {
  label: string
  generationWh: number
  consumptionWh: number
}

export interface AppUser {
  id: string
  email: string
  name: string
  initials: string
}

export interface ActionResult<T = void> {
  ok: boolean
  data?: T
  message?: string
}

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error'
