<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Zap } from '@lucide/vue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const mode = ref<'login' | 'signup'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const message = ref('')

async function submit() {
  error.value = ''
  message.value = ''
  const result = mode.value === 'login'
    ? await auth.signIn(email.value, password.value)
    : await auth.signUp(name.value, email.value, password.value)

  if (!result.ok) {
    error.value = result.message ?? 'Nao foi possivel continuar.'
    return
  }
  if (result.message) {
    message.value = result.message
    return
  }
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  await router.replace(redirect)
}

async function enterDemo() {
  auth.startDemo()
  await router.replace('/dashboard')
}
</script>

<template>
  <main class="grid min-h-screen bg-ink text-white lg:grid-cols-[1.1fr_.9fr]">
    <section class="relative hidden overflow-hidden p-12 lg:flex lg:flex-col">
      <div class="absolute -left-24 top-1/3 size-96 rounded-full bg-green/20 blur-3xl"></div>
      <div class="relative flex items-center gap-3">
        <span class="grid size-11 place-items-center rounded-xl bg-lime text-ink"><Zap :size="22" fill="currentColor" /></span>
        <span class="text-2xl font-bold">lumina</span>
      </div>
      <div class="relative my-auto max-w-xl">
        <p class="text-xs font-bold uppercase tracking-[0.24em] text-lime">MVP demonstravel</p>
        <h1 class="mt-5 text-6xl font-semibold leading-[1.02] tracking-[-0.055em]">Energia local, com saldo e origem visiveis.</h1>
        <p class="mt-6 max-w-md text-base leading-relaxed text-white/50">Simule geracao, acompanhe seu ledger e negocie creditos entre contas em um ambiente persistente.</p>
      </div>
      <p class="relative text-xs text-white/30">Dados de energia e valores financeiros sao simulados nesta versao.</p>
    </section>

    <section class="flex min-h-screen items-center justify-center bg-canvas px-5 py-10 text-ink sm:px-10">
      <div class="w-full max-w-md">
        <div class="mb-10 flex items-center gap-2.5 lg:hidden">
          <span class="grid size-9 place-items-center rounded-lg bg-ink text-lime"><Zap :size="18" fill="currentColor" /></span>
          <span class="text-lg font-bold">lumina</span>
        </div>
        <p class="eyebrow">Acesso seguro</p>
        <h2 class="mt-3 text-4xl font-semibold tracking-[-0.045em]">{{ mode === 'login' ? 'Entre na sua conta.' : 'Crie sua conta.' }}</h2>
        <p class="mt-3 text-sm text-muted">{{ mode === 'login' ? 'Continue de onde parou.' : 'Comece com dispositivos e leituras simuladas.' }}</p>

        <div v-if="!isSupabaseConfigured" class="mt-6 rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral" role="alert">
          Supabase ainda nao configurado. Preencha as variaveis descritas em <code>.env.example</code>.
        </div>

        <form class="mt-8 space-y-5" @submit.prevent="submit">
          <label v-if="mode === 'signup'" class="block text-xs font-semibold">
            Nome
            <input v-model="name" required maxlength="80" class="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-green" autocomplete="name" />
          </label>
          <label class="block text-xs font-semibold">
            Email
            <input v-model="email" required type="email" class="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-green" autocomplete="email" />
          </label>
          <label class="block text-xs font-semibold">
            Senha
            <input v-model="password" required type="password" minlength="6" class="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-green" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
          </label>
          <p v-if="error" class="text-sm text-coral" role="alert">{{ error }}</p>
          <p v-if="message" class="text-sm text-green" role="status">{{ message }}</p>
          <button :disabled="auth.loading || !isSupabaseConfigured" class="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-sm font-bold text-white transition hover:bg-green disabled:cursor-not-allowed disabled:opacity-50">
            {{ auth.loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta' }} <ArrowRight v-if="!auth.loading" :size="16" />
          </button>
          <button type="button" class="w-full rounded-xl border border-ink/15 bg-white py-3.5 text-sm font-bold text-ink transition hover:border-green hover:text-green" @click="enterDemo">
            Explorar demonstracao local
          </button>
        </form>

        <p class="mt-4 text-xs leading-relaxed text-muted">No modo demonstracao, os dados ficam somente neste navegador e podem ser reiniciados ao limpar os dados do site.</p>

        <button class="mt-6 text-sm font-semibold text-green hover:underline" @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''; message = ''">
          {{ mode === 'login' ? 'Ainda nao tenho conta' : 'Ja tenho uma conta' }}
        </button>
      </div>
    </section>
  </main>
</template>
