import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from './auth.service';
import { Customer, Db, Invoice, Order, OrderItem, Part, STATUSES, Staff, Status, Vehicle } from './models';
import { empty, today } from './seed';

const KEY = 'autcar.data.v3';
const keyFor = (userId: string) => `${KEY}.${userId}`;
const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Camada de dados da plataforma. Hoje persiste no navegador (localStorage), separada por conta;
 * para produção, troque cada método por chamadas HTTP à sua API mantendo a mesma assinatura.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private auth = inject(AuthService);
  private db = signal<Db>(empty());
  /** Utilizador a quem pertencem os dados carregados (evita gravar dados de uma conta noutra). */
  private loadedFor: string | null = null;

  readonly customers = computed(() => this.db().customers);
  readonly vehicles = computed(() => this.db().vehicles);
  readonly staff = computed(() => this.db().staff);
  readonly parts = computed(() => this.db().parts);
  readonly orders = computed(() => [...this.db().orders].sort((a, b) => b.id.localeCompare(a.id)));
  readonly invoices = computed(() => [...this.db().invoices].sort((a, b) => b.id.localeCompare(a.id)));

  readonly stats = computed(() => {
    const orders = this.db().orders;
    const invoices = this.db().invoices;
    const month = today().slice(0, 7);
    const t = today();
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, orders.filter((o) => o.status === s).length])) as Record<Status, number>;
    return {
      byStatus,
      open: byStatus['Aguardando'] + byStatus['Em curso'],
      ready: byStatus['Pronto'],
      overdue: orders.filter((o) => (o.status === 'Aguardando' || o.status === 'Em curso') && o.dueDate < t).length,
      billedMonth: invoices.filter((i) => i.issuedAt.startsWith(month)).reduce((s, i) => s + i.total, 0),
      received: invoices.filter((i) => i.paid).reduce((s, i) => s + i.total, 0),
      receivable: invoices.filter((i) => !i.paid).reduce((s, i) => s + i.total, 0),
      lowStock: this.db().parts.filter((p) => p.qty <= p.min).length,
    };
  });

  constructor() {
    // Cada conta tem os seus dados: ao trocar de utilizador carrega os dele (ou vazio).
    effect(() => {
      const id = this.auth.user()?.id ?? null;
      untracked(() => {
        this.loadedFor = id;
        this.db.set(id ? this.load(id) : empty());
      });
    });
    effect(() => {
      const data = this.db();
      const id = this.loadedFor;
      if (id) localStorage.setItem(keyFor(id), JSON.stringify(data));
    });
  }

  // ---------- consultas ----------
  customer = (id: string) => this.db().customers.find((c) => c.id === id);
  vehicle = (id: string) => this.db().vehicles.find((v) => v.id === id);
  order = (id: string) => this.db().orders.find((o) => o.id === id);
  invoiceOf = (orderId: string) => this.db().invoices.find((i) => i.orderId === orderId);
  customerName = (id: string) => this.customer(id)?.name ?? '—';
  staffName = (id: string) => this.db().staff.find((s) => s.id === id)?.name ?? '—';
  vehicleLabel = (id: string) => {
    const v = this.vehicle(id);
    return v ? `${v.model} · ${v.plate}` : '—';
  };
  total = (o: Order) => o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  // ---------- clientes ----------
  saveCustomer(data: Omit<Customer, 'id'>, id?: string): void {
    this.patch((d) => ({
      ...d,
      customers: id ? d.customers.map((c) => (c.id === id ? { ...c, ...data } : c)) : [...d.customers, { ...data, id: uid() }],
    }));
  }
  /** Devolve false se o cliente tiver ordens ou veículos associados. */
  removeCustomer(id: string): boolean {
    const d = this.db();
    if (d.orders.some((o) => o.customerId === id) || d.vehicles.some((v) => v.customerId === id)) return false;
    this.patch((x) => ({ ...x, customers: x.customers.filter((c) => c.id !== id) }));
    return true;
  }

  // ---------- veículos ----------
  saveVehicle(data: Omit<Vehicle, 'id'>, id?: string): void {
    this.patch((d) => ({
      ...d,
      vehicles: id ? d.vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)) : [...d.vehicles, { ...data, id: uid() }],
    }));
  }
  removeVehicle(id: string): boolean {
    if (this.db().orders.some((o) => o.vehicleId === id)) return false;
    this.patch((x) => ({ ...x, vehicles: x.vehicles.filter((v) => v.id !== id) }));
    return true;
  }

  // ---------- equipa ----------
  saveStaff(data: Omit<Staff, 'id'>, id?: string): void {
    this.patch((d) => ({
      ...d,
      staff: id ? d.staff.map((s) => (s.id === id ? { ...s, ...data } : s)) : [...d.staff, { ...data, id: uid() }],
    }));
  }

  // ---------- stock ----------
  savePart(data: Omit<Part, 'id'>, id?: string): void {
    this.patch((d) => ({
      ...d,
      parts: id ? d.parts.map((p) => (p.id === id ? { ...p, ...data } : p)) : [...d.parts, { ...data, id: uid() }],
    }));
  }
  removePart(id: string): boolean {
    if (this.db().orders.some((o) => o.items.some((i) => i.partId === id))) return false;
    this.patch((x) => ({ ...x, parts: x.parts.filter((p) => p.id !== id) }));
    return true;
  }
  adjustPart(id: string, delta: number): void {
    this.patch((d) => ({ ...d, parts: d.parts.map((p) => (p.id === id ? { ...p, qty: Math.max(0, p.qty + delta) } : p)) }));
  }

  // ---------- ordens ----------
  createOrder(data: Pick<Order, 'customerId' | 'vehicleId' | 'mechanicId' | 'description' | 'dueDate'>): Order {
    const seq = this.db().seq;
    const order: Order = { ...data, id: String(seq).padStart(4, '0'), status: 'Aguardando', createdAt: today(), items: [] };
    this.patch((d) => ({ ...d, seq: seq + 1, orders: [...d.orders, order] }));
    return order;
  }

  /** Ao marcar como Entregue emite a fatura; só reverte se a fatura ainda não estiver paga. */
  setStatus(orderId: string, status: Status): boolean {
    const order = this.order(orderId);
    if (!order || order.status === status) return true;
    const invoice = this.invoiceOf(orderId);
    if (order.status === 'Entregue' && invoice?.paid) return false;
    this.patch((d) => {
      let invoices = d.invoices;
      if (status === 'Entregue' && !invoice) {
        const inv: Invoice = { id: `F-${orderId}`, orderId, issuedAt: today(), total: this.total(order), paid: false, paidAt: null };
        invoices = [...invoices, inv];
      } else if (status !== 'Entregue' && invoice) {
        invoices = invoices.filter((i) => i.orderId !== orderId);
      }
      return { ...d, invoices, orders: d.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) };
    });
    return true;
  }

  /** Peças retiradas do stock; devolve false se não houver quantidade suficiente. */
  addItem(orderId: string, item: OrderItem): boolean {
    if (item.kind === 'peca' && item.partId) {
      const part = this.db().parts.find((p) => p.id === item.partId);
      if (!part || part.qty < item.qty) return false;
    }
    this.patch((d) => ({
      ...d,
      parts: item.partId ? d.parts.map((p) => (p.id === item.partId ? { ...p, qty: p.qty - item.qty } : p)) : d.parts,
      orders: d.orders.map((o) => (o.id === orderId ? { ...o, items: [...o.items, item] } : o)),
    }));
    return true;
  }

  removeItem(orderId: string, index: number): void {
    const item = this.order(orderId)?.items[index];
    if (!item) return;
    this.patch((d) => ({
      ...d,
      parts: item.partId ? d.parts.map((p) => (p.id === item.partId ? { ...p, qty: p.qty + item.qty } : p)) : d.parts,
      orders: d.orders.map((o) => (o.id === orderId ? { ...o, items: o.items.filter((_, i) => i !== index) } : o)),
    }));
  }

  // ---------- faturação ----------
  setPaid(invoiceId: string, paid: boolean): void {
    this.patch((d) => ({
      ...d,
      invoices: d.invoices.map((i) => (i.id === invoiceId ? { ...i, paid, paidAt: paid ? today() : null } : i)),
    }));
  }

  // ---------- administração ----------
  exportJson(): string {
    return JSON.stringify(this.db(), null, 2);
  }
  reset(): void {
    this.db.set(empty());
  }

  private patch(fn: (d: Db) => Db): void {
    this.db.update(fn);
  }

  private load(userId: string): Db {
    try {
      const raw = localStorage.getItem(keyFor(userId));
      if (raw) return JSON.parse(raw) as Db;
    } catch {
      /* dados corrompidos: recomeça vazio */
    }
    return empty();
  }
}
