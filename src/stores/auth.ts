import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ActionResult, AppUser } from '@/types/energy'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const demoMode = ref(false)
  const profileName = ref('')
  const initialized = ref(false)
  const loading = ref(false)

  const user = computed<AppUser | null>(() => {
    if (demoMode.value) {
      return { id: 'demo-user', email: 'demo@lumina.local', name: 'Visitante', initials: 'VI' }
    }
    const authUser = session.value?.user
    if (!authUser) return null
    const email = authUser.email ?? ''
    const name = profileName.value || String(authUser.user_metadata.full_name || email.split('@')[0] || 'Usuario')
    return {
      id: authUser.id,
      email,
      name,
      initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(),
    }
  })

  async function loadProfile(authUser: User | undefined) {
    if (!authUser || !isSupabaseConfigured) {
      profileName.value = ''
      return
    }
    const { data } = await getSupabase()
      .from('profiles')
      .select('display_name')
      .eq('id', authUser.id)
      .maybeSingle()
    profileName.value = data?.display_name ?? ''
  }

  async function initialize() {
    if (initialized.value) return
    demoMode.value = localStorage.getItem('lumina:demo-session') === 'active'
    if (demoMode.value) {
      initialized.value = true
      return
    }
    if (!isSupabaseConfigured) {
      initialized.value = true
      return
    }

    const supabase = getSupabase()
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    await loadProfile(data.session?.user)
    supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession
      void loadProfile(nextSession?.user)
    })
    initialized.value = true
  }

  async function signIn(email: string, password: string): Promise<ActionResult> {
    if (!isSupabaseConfigured) return { ok: false, message: 'Configure o Supabase para entrar.' }
    loading.value = true
    const { error } = await getSupabase().auth.signInWithPassword({ email, password })
    loading.value = false
    return error ? { ok: false, message: 'Email ou senha invalidos.' } : { ok: true }
  }

  async function signUp(name: string, email: string, password: string): Promise<ActionResult> {
    if (!isSupabaseConfigured) return { ok: false, message: 'Configure o Supabase para criar uma conta.' }
    loading.value = true
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    loading.value = false
    if (error) return { ok: false, message: error.message }
    if (!data.session) return { ok: true, message: 'Confira seu email para confirmar o cadastro.' }
    return { ok: true }
  }

  async function signOut() {
    if (isSupabaseConfigured) await getSupabase().auth.signOut()
    localStorage.removeItem('lumina:demo-session')
    demoMode.value = false
    session.value = null
    profileName.value = ''
  }

  function startDemo() {
    localStorage.setItem('lumina:demo-session', 'active')
    demoMode.value = true
  }

  return { session, user, demoMode, initialized, loading, initialize, signIn, signUp, signOut, startDemo }
})
