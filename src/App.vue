<script setup lang="ts">
import { LayoutDashboard, Store, ScrollText, Cpu, Zap, Bell } from '@lucide/vue'
import { useEnergyStore } from '@/stores/energy'

const store = useEnergyStore()

const navigation = [
  { label: 'Visão geral', shortLabel: 'Início', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Mercado', shortLabel: 'Mercado', to: '/market', icon: Store },
  { label: 'Histórico', shortLabel: 'Histórico', to: '/history', icon: ScrollText },
  { label: 'Dispositivos', shortLabel: 'Medidores', to: '/devices', icon: Cpu },
]
</script>

<template>
  <div class="min-h-screen bg-canvas text-ink">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-ink px-5 py-7 text-white lg:flex">
      <RouterLink to="/dashboard" class="flex items-center gap-3 px-2">
        <span class="grid size-10 place-items-center rounded-xl bg-lime text-ink shadow-[0_0_30px_rgba(193,241,73,.15)]">
          <Zap :size="21" fill="currentColor" />
        </span>
        <span class="text-xl font-bold tracking-tight">lumina</span>
      </RouterLink>

      <p class="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Navegação</p>
      <nav class="mt-3 space-y-1.5">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-link flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/55 transition"
        >
          <component :is="item.icon" :size="19" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mt-auto rounded-2xl border border-white/8 bg-white/5 p-4">
        <p class="text-xs text-white/45">Conta ativa</p>
        <div class="mt-3 flex items-center gap-3">
          <div class="grid size-9 place-items-center rounded-full bg-sky text-sm font-bold text-ink">L</div>
          <div>
            <p class="text-sm font-semibold">{{ store.user.name }}</p>
            <p class="text-xs text-white/40">Conta residencial</p>
          </div>
        </div>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line/80 bg-canvas/90 px-5 backdrop-blur-xl sm:px-8 lg:h-20 lg:px-10">
        <RouterLink to="/dashboard" class="flex items-center gap-2.5 lg:hidden">
          <span class="grid size-8 place-items-center rounded-lg bg-ink text-lime"><Zap :size="17" fill="currentColor" /></span>
          <span class="font-bold">lumina</span>
        </RouterLink>
        <p class="hidden text-sm text-muted lg:block">Créditos de energia distribuída</p>
        <div class="flex items-center gap-3">
          <button class="grid size-9 place-items-center rounded-full border border-line bg-white text-muted transition hover:text-ink" aria-label="Notificações">
            <Bell :size="17" />
          </button>
          <div class="hidden text-right sm:block">
            <p class="text-sm font-semibold leading-tight">{{ store.user.name }}</p>
            <p class="text-[11px] text-muted">Conta verificada</p>
          </div>
          <div class="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-white">L</div>
        </div>
      </header>

      <main class="mx-auto max-w-[1440px] px-5 pb-28 pt-7 sm:px-8 lg:px-10 lg:pb-12 lg:pt-9">
        <RouterView />
      </main>
    </div>

    <nav class="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-white/10 bg-ink/95 p-1.5 shadow-2xl backdrop-blur-lg lg:hidden">
      <RouterLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="mobile-nav-link flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium text-white/45"
      >
        <component :is="item.icon" :size="18" />
        {{ item.shortLabel }}
      </RouterLink>
    </nav>
  </div>
</template>
