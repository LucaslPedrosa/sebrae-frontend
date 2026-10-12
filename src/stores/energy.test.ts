import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth'
import { useEnergyStore } from '@/stores/energy'

describe('energy store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('calcula saldo contabil, reservado e disponivel', () => {
    const auth = useAuthStore()
    auth.session = {
      user: { id: 'user-1', email: 'teste@lumina.local', user_metadata: {} },
    } as Session
    const store = useEnergyStore()
    store.transactions = [
      { id: '1', type: 'generation', amountWh: 10000, timestamp: new Date().toISOString(), description: 'Geracao' },
      { id: '2', type: 'consumption', amountWh: -2500, timestamp: new Date().toISOString(), description: 'Consumo' },
    ]
    store.offers = [{
      id: 'offer-1',
      sellerId: 'user-1',
      seller: 'Teste',
      amountWh: 3000,
      pricePerKwh: 0.5,
      status: 'open',
      createdAt: new Date().toISOString(),
    }]

    expect(store.balanceWh).toBe(7500)
    expect(store.reservedWh).toBe(3000)
    expect(store.availableBalanceWh).toBe(4500)
  })

  it('ignora ofertas de outros usuarios na reserva', () => {
    const auth = useAuthStore()
    auth.session = {
      user: { id: 'user-1', email: 'teste@lumina.local', user_metadata: {} },
    } as Session
    const store = useEnergyStore()
    store.transactions = [
      { id: '1', type: 'generation', amountWh: 10000, timestamp: new Date().toISOString(), description: 'Geracao' },
    ]
    store.offers = [{
      id: 'offer-2',
      sellerId: 'user-2',
      seller: 'Outra pessoa',
      amountWh: 3000,
      pricePerKwh: 0.5,
      status: 'open',
      createdAt: new Date().toISOString(),
    }]

    expect(store.reservedWh).toBe(0)
    expect(store.availableBalanceWh).toBe(10000)
  })

  it('persiste operacoes do modo demonstracao no navegador', async () => {
    const auth = useAuthStore()
    auth.startDemo()
    const store = useEnergyStore()
    await store.loadAll()
    const initialOffers = store.offers.length

    const result = await store.createOffer(1000, 0.5)

    expect(result.ok).toBe(true)
    expect(store.offers).toHaveLength(initialOffers + 1)
    expect(store.reservedWh).toBe(1000)
    expect(localStorage.getItem('lumina:demo-data:v1')).toContain('demo-user')
  })
})
