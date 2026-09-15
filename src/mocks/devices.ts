import type { EnergyDevice } from '@/types/energy'

export const mockDevices: EnergyDevice[] = [
  {
    id: 'solar-house',
    name: 'Solar House',
    type: 'generator',
    status: 'online',
    energyTodayWh: 13400,
    location: 'Casa · Campinas, SP',
  },
  {
    id: 'ev-charger-182',
    name: 'EV Charger #182',
    type: 'consumer',
    status: 'online',
    energyTodayWh: 7200,
    location: 'Shopping Aurora · Campinas, SP',
  },
  {
    id: 'studio-meter',
    name: 'Medidor Studio',
    type: 'consumer',
    status: 'offline',
    energyTodayWh: 0,
    location: 'Studio · São Paulo, SP',
  },
]
