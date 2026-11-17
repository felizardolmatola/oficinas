import { Injectable, signal } from '@angular/core';
import { createClient, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Account {
  id: string;
  name: string;
  workshop: string;
  email: string;
  phone: string;
  provider: 'google' | 'email';
}

export interface Profile {
  name: string;
  workshop: string;
  phone: string;
}

export type Result = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

const REMEMBER = 'autcar.remember';

/** A sessão fica no localStorage (lembrar) ou no sessionStorage (não lembrar). */
const storage = {
  getItem: (k: string) => localStorage.getItem(k) ?? sessionStorage.getItem(k),
  setItem: (k: string, v: string) => (localStorage.getItem(REMEMBER) === '0' ? sessionStorage : localStorage).setItem(k, v),
  removeItem: (k: string) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  },
};

function toAccount(u: User | null | undefined): Account | null {
  if (!u) return null;
  const m = (u.user_metadata ?? {}) as Record<string, string | undefined>;
  return {
    id: u.id,
    name: m['name'] ?? m['full_name'] ?? '',
    workshop: m['workshop'] ?? '',
    email: u.email ?? '',
    phone: m['phone'] ?? '',
    provider: u.app_metadata?.['provider'] === 'google' ? 'google' : 'email',
  };
}

function explain(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'Email ou palavra-passe incorretos.';
  if (m.includes('not confirmed')) return 'Confirme o seu email antes de entrar (veja a caixa de entrada e o lixo eletrónico).';
  if (m.includes('already registered')) return 'Já existe uma conta com este email.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiadas tentativas. Aguarde uns minutos e tente de novo.';
  if (m.includes('provider is not enabled') || m.includes('unsupported provider')) return 'O início de sessão com Google não está ativo.';
  if (m.includes('password should be')) return 'A palavra-passe é demasiado fraca. Use pelo menos 6 caracteres.';
  if (m.includes('network') || m.includes('fetch')) return 'Sem ligação ao servidor. Verifique a internet.';
  return 'Não foi possível concluir. Tente de novo.';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** false enquanto o environment.ts não tiver o URL e a chave do Supabase. */
  readonly configured = !!environment.supabaseUrl && !!environment.supabaseAnonKey && !environment.supabaseUrl.includes('SEU');
  readonly user = signal<Account | null>(null);
  /** Resolve quando a sessão (incluindo o regresso do Google ou do email) foi lida. */
  readonly ready: Promise<void>;

  private sb: SupabaseClient | null = null;

  constructor() {
    if (!this.configured) {
      this.ready = Promise.resolve();
      return;
    }
    this.sb = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    this.sb.auth.onAuthStateChange((_event, session: Session | null) => this.user.set(toAccount(session?.user)));
    this.ready = this.sb.auth.getSession().then(({ data }) => this.user.set(toAccount(data.session?.user)));
  }

  profileComplete(): boolean {
    const u = this.user();
    return !!u && !!u.workshop && !!u.phone;
  }

  async hasSession(): Promise<boolean> {
    await this.ready;
    return !!this.user();
  }

  async register(p: Profile & { email: string; password: string }): Promise<Result> {
    if (!this.sb) return this.notConfigured();
    const { data, error } = await this.sb.auth.signUp({
      email: p.email.trim(),
      password: p.password,
      options: {
        data: { name: p.name.trim(), workshop: p.workshop.trim(), phone: p.phone.trim() },
        emailRedirectTo: window.location.origin + '/painel',
      },
    });
    if (error) return { ok: false, error: explain(error.message) };
    // Com a confirmação de email ligada, um email já registado devolve um utilizador sem identidades.
    if (data.user && data.user.identities?.length === 0) return { ok: false, error: 'Já existe uma conta com este email.' };
    return { ok: true, needsConfirmation: !data.session };
  }

  async login(email: string, password: string, remember: boolean): Promise<Result> {
    if (!this.sb) return this.notConfigured();
    localStorage.setItem(REMEMBER, remember ? '1' : '0');
    const { error } = await this.sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: explain(error.message) };
    return { ok: true };
  }

  async loginWithGoogle(): Promise<Result> {
    if (!this.sb) return this.notConfigured();
    localStorage.setItem(REMEMBER, '1');
    const { error } = await this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/painel' },
    });
    // Em caso de sucesso o navegador segue para o Google; só chegamos aqui com erro.
    return error ? { ok: false, error: explain(error.message) } : { ok: true };
  }

  async saveProfile(p: Profile): Promise<Result> {
    if (!this.sb) return this.notConfigured();
    const { data, error } = await this.sb.auth.updateUser({
      data: { name: p.name.trim(), workshop: p.workshop.trim(), phone: p.phone.trim() },
    });
    if (error) return { ok: false, error: explain(error.message) };
    this.user.set(toAccount(data.user));
    return { ok: true };
  }

  async requestPasswordReset(email: string): Promise<Result> {
    if (!this.sb) return this.notConfigured();
    const { error } = await this.sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/redefinir-palavra-passe',
    });
    return error ? { ok: false, error: explain(error.message) } : { ok: true };
  }

  async updatePassword(password: string): Promise<Result> {
    if (!this.sb) return this.notConfigured();
    const { error } = await this.sb.auth.updateUser({ password });
    return error ? { ok: false, error: explain(error.message) } : { ok: true };
  }

  async logout(): Promise<void> {
    await this.sb?.auth.signOut();
    this.user.set(null);
  }

  private notConfigured(): Result {
    return { ok: false, error: 'O Supabase ainda não está configurado (veja src/environments/environment.ts).' };
  }
}
