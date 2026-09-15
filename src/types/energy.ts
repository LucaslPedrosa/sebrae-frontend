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
}

export interface MarketOffer {
  id: string
  seller: string
  amountWh: number
  pricePerKwh: number
}

export interface ChartPoint {
  label: string
  generationWh: number
  consumptionWh: number
}
