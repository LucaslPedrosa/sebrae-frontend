<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Zap, ShieldCheck, Activity, ArrowLeftRight } from '@lucide/vue'
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
  <main class="grid min-h-screen min-h-dvh bg-ink text-white lg:grid-cols-[1.08fr_.92fr]">
    <section class="relative hidden overflow-hidden p-12 lg:flex lg:flex-col xl:p-16">
      <div class="absolute -left-24 top-1/3 size-96 rounded-full bg-green/25 blur-3xl"></div>
      <div class="absolute -right-32 -top-24 size-[28rem] rounded-full border-[1px] border-white/8"></div>
      <div class="absolute -right-16 -top-8 size-80 rounded-full border-[1px] border-lime/10"></div>
      <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>
      <div class="relative flex items-center gap-3">
        <span class="soft-pulse grid size-11 place-items-center rounded-xl bg-lime text-ink"><Zap :size="22" fill="currentColor" /></span>
        <span class="text-2xl font-bold">lumina</span>
      </div>
      <div class="relative my-auto max-w-xl">
        <p class="text-xs font-bold uppercase tracking-[0.24em] text-lime">MVP demonstravel</p>
        <h1 class="mt-5 text-6xl font-semibold leading-[1.02] tracking-[-0.065em] xl:text-7xl">Energia local, com saldo e origem visiveis.</h1>
        <p class="mt-6 max-w-md text-base leading-relaxed text-white/65">Simule geracao, acompanhe seu ledger e negocie creditos entre contas em um ambiente persistente.</p>
        <div class="stagger-grid mt-10 grid grid-cols-3 gap-3">
          <div class="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur"><ShieldCheck :size="17" class="text-lime" /><p class="mt-3 text-xs font-semibold text-white/75">Ledger protegido</p></div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur"><Activity :size="17" class="text-sky" /><p class="mt-3 text-xs font-semibold text-white/75">Fluxo ao vivo</p></div>
          <div class="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur"><ArrowLeftRight :size="17" class="text-coral" /><p class="mt-3 text-xs font-semibold text-white/75">Mercado P2P</p></div>
        </div>
      </div>
      <p class="relative text-xs text-white/55">Dados de energia e valores financeiros sao simulados nesta versao.</p>
    </section>

    <section class="relative flex min-h-screen min-h-dvh items-center justify-center overflow-hidden bg-canvas px-5 py-10 text-ink sm:px-10">
      <div class="pointer-events-none absolute right-0 top-0 size-80 rounded-full bg-sky/20 blur-3xl"></div>
      <div class="relative w-full max-w-md rounded-[28px] border border-white/70 bg-white/55 p-5 backdrop-blur-xl sm:p-7 sm:shadow-[0_28px_80px_rgba(20,32,28,.08)]">
        <div class="mb-10 flex items-center gap-2.5 lg:hidden">
          <span class="grid size-9 place-items-center rounded-lg bg-ink text-lime"><Zap :size="18" fill="currentColor" /></span>
          <span class="text-lg font-bold">lumina</span>
        </div>
        <p class="eyebrow">Acesso seguro</p>
        <h1 class="mt-3 text-4xl font-semibold tracking-[-0.055em]">{{ mode === 'login' ? 'Entre na sua conta.' : 'Crie sua conta.' }}</h1>
        <p class="mt-3 text-sm text-muted">{{ mode === 'login' ? 'Continue de onde parou.' : 'Comece com dispositivos e leituras simuladas.' }}</p>

        <div v-if="!isSupabaseConfigured" class="mt-6 rounded-xl border border-coral/30 bg-coral/10 p-4 text-sm text-coral" role="alert">
          Supabase ainda nao configurado. Preencha as variaveis descritas em <code>.env.example</code>.
        </div>

        <form class="mt-8 space-y-5" @submit.prevent="submit">
          <Transition name="fade-scale">
            <label v-if="mode === 'signup'" class="block text-xs font-semibold">
              Nome
              <input v-model="name" required maxlength="80" class="mt-2 w-full rounded-xl border border-line bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green focus:bg-white" autocomplete="name" />
            </label>
          </Transition>
          <label class="block text-xs font-semibold">
            Email
            <input v-model="email" required type="email" class="mt-2 w-full rounded-xl border border-line bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green focus:bg-white" autocomplete="email" />
          </label>
          <label class="block text-xs font-semibold">
            Senha
            <input v-model="password" required type="password" minlength="6" class="mt-2 w-full rounded-xl border border-line bg-white/80 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-green focus:bg-white" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
          </label>
          <p v-if="error" class="text-sm text-coral" role="alert">{{ error }}</p>
          <p v-if="message" class="text-sm text-green" role="status">{{ message }}</p>
          <button :disabled="auth.loading || !isSupabaseConfigured" class="group flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(20,32,28,.16)] transition duration-300 hover:-translate-y-0.5 hover:bg-green active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">
            {{ auth.loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta' }} <ArrowRight v-if="!auth.loading" :size="16" class="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button type="button" class="w-full rounded-xl border border-ink/15 bg-white/80 py-3.5 text-sm font-bold text-ink shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-green hover:text-green active:scale-[.98]" @click="enterDemo">
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
