<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { LayoutDashboard, Store, ScrollText, Cpu, Zap, LogOut, RefreshCw } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { useEnergyStore } from '@/stores/energy'

const auth = useAuthStore()
const store = useEnergyStore()
const route = useRoute()
const router = useRouter()
const { status, updatedAt } = storeToRefs(store)
const publicLayout = computed(() => Boolean(route.meta.publicLayout))
const updateTitle = computed(() => updatedAt.value ? 'Atualizado agora. Clique para atualizar novamente.' : 'Atualizar dados')

watch(() => auth.user?.id, (userId, previousUserId) => {
  if (userId === previousUserId) return
  store.reset()
  if (userId) void store.loadAll(true)
  else if (previousUserId) void router.replace('/login')
})

async function signOut() {
  store.reset()
  await auth.signOut()
  await router.replace('/login')
}

const navigation = [
  { label: 'Visão geral', shortLabel: 'Início', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Mercado', shortLabel: 'Mercado', to: '/market', icon: Store },
  { label: 'Histórico', shortLabel: 'Histórico', to: '/history', icon: ScrollText },
  { label: 'Dispositivos', shortLabel: 'Medidores', to: '/devices', icon: Cpu },
]
</script>

<template>
  <RouterView v-if="publicLayout" v-slot="{ Component, route: currentRoute }">
    <Transition name="route-view" mode="out-in"><component :is="Component" :key="currentRoute.path" /></Transition>
  </RouterView>
  <div v-else class="app-shell text-ink">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden border-r border-white/5 bg-ink px-5 py-7 text-white shadow-[20px_0_70px_rgba(20,32,28,.08)] lg:flex">
      <div class="pointer-events-none absolute -left-24 top-1/3 size-72 rounded-full bg-green/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-20 -right-24 size-64 rounded-full bg-lime/10 blur-3xl"></div>
      <RouterLink to="/dashboard" class="flex items-center gap-3 px-2">
        <span class="soft-pulse grid size-10 place-items-center rounded-xl bg-lime text-ink shadow-[0_0_30px_rgba(193,241,73,.18)]">
          <Zap :size="21" fill="currentColor" />
        </span>
        <span class="text-xl font-bold tracking-tight">lumina</span>
      </RouterLink>

      <p class="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">Navegação</p>
      <nav class="relative mt-3 space-y-1.5" aria-label="Navegacao principal">
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-link flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/60 transition duration-300 hover:bg-white/6 hover:text-white"
        >
          <component :is="item.icon" :size="19" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="relative mt-auto rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-lg">
        <p class="text-xs text-white/60">Conta ativa</p>
        <div class="mt-3 flex items-center gap-3">
          <div class="grid size-9 place-items-center rounded-full bg-sky text-sm font-bold text-ink">{{ auth.user?.initials }}</div>
          <div>
            <p class="text-sm font-semibold">{{ auth.user?.name }}</p>
            <p class="text-xs text-white/55">Conta residencial</p>
          </div>
        </div>
      </div>
    </aside>

    <div class="lg:pl-64">
      <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/60 bg-canvas/75 px-5 shadow-[0_1px_0_rgba(20,32,28,.03)] backdrop-blur-2xl sm:px-8 lg:h-20 lg:px-10">
        <RouterLink to="/dashboard" class="flex items-center gap-2.5 lg:hidden">
          <span class="grid size-8 place-items-center rounded-lg bg-ink text-lime"><Zap :size="17" fill="currentColor" /></span>
          <span class="font-bold">lumina</span>
        </RouterLink>
        <p class="hidden text-sm text-muted lg:block">{{ auth.demoMode ? 'Demonstracao local - dados neste navegador' : 'Creditos de energia distribuida' }}</p>
        <div class="flex items-center gap-3">
          <button class="group grid size-9 place-items-center rounded-full border border-line/80 bg-white/80 text-muted shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-green/30 hover:text-green" aria-label="Atualizar dados" :title="updateTitle" @click="store.loadAll(true)">
            <RefreshCw :size="15" :class="status === 'loading' ? 'animate-spin' : 'transition-transform duration-500 group-hover:rotate-180'" />
          </button>
          <div class="hidden text-right sm:block">
            <p class="text-sm font-semibold leading-tight">{{ auth.user?.name }}</p>
            <p class="text-[11px] text-muted">{{ auth.demoMode ? 'Modo local' : 'Conta conectada' }}</p>
          </div>
          <div class="grid size-9 place-items-center rounded-full bg-ink text-sm font-bold text-white shadow-[0_6px_18px_rgba(20,32,28,.16)] ring-2 ring-white">{{ auth.user?.initials }}</div>
          <button class="grid size-9 place-items-center rounded-full border border-line/80 bg-white/80 text-muted shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-coral/30 hover:text-coral" aria-label="Sair" @click="signOut">
            <LogOut :size="16" />
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-[1440px] px-5 pb-28 pt-7 sm:px-8 lg:px-10 lg:pb-12 lg:pt-9">
        <RouterView v-slot="{ Component, route: currentRoute }">
          <Transition name="route-view" mode="out-in">
            <component :is="Component" :key="currentRoute.path" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <nav class="safe-bottom fixed inset-x-3 z-40 grid grid-cols-4 rounded-[20px] border border-white/10 bg-ink/92 p-1.5 shadow-[0_20px_55px_rgba(20,32,28,.28)] backdrop-blur-xl lg:hidden" aria-label="Navegacao mobile">
      <RouterLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        class="mobile-nav-link flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold text-white/55 transition duration-300 active:scale-95"
      >
        <component :is="item.icon" :size="18" />
        {{ item.shortLabel }}
      </RouterLink>
    </nav>
  </div>
</template>
