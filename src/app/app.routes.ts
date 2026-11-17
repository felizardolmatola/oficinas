import { Routes } from '@angular/router';
import { authGuard, sessionGuard } from './core/auth.guard';
import { ShellComponent } from './shared/shell.component';
import { LoginPage } from './pages/login.page';
import { RegisterPage } from './pages/register.page';
import { ForgotPasswordPage } from './pages/forgot-password.page';
import { ResetPasswordPage } from './pages/reset-password.page';
import { CompleteProfilePage } from './pages/complete-profile.page';
import { DashboardPage } from './pages/dashboard.page';
import { OrdersPage } from './pages/orders.page';
import { NewOrderPage } from './pages/new-order.page';
import { OrderDetailPage } from './pages/order-detail.page';
import { CustomersPage } from './pages/customers.page';
import { VehiclesPage } from './pages/vehicles.page';
import { StockPage } from './pages/stock.page';
import { InvoicesPage } from './pages/invoices.page';
import { InvoiceDetailPage } from './pages/invoice-detail.page';
import { ReportsPage } from './pages/reports.page';
import { TeamPage } from './pages/team.page';
import { SettingsPage } from './pages/settings.page';

export const routes: Routes = [
  { path: 'entrar', component: LoginPage },
  { path: 'criar-conta', component: RegisterPage },
  { path: 'recuperar-palavra-passe', component: ForgotPasswordPage },
  { path: 'redefinir-palavra-passe', component: ResetPasswordPage },
  { path: 'completar-perfil', component: CompleteProfilePage, canActivate: [sessionGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'painel' },
      { path: 'painel', component: DashboardPage },
      { path: 'ordens', component: OrdersPage },
      { path: 'ordens/nova', component: NewOrderPage },
      { path: 'ordens/:id', component: OrderDetailPage },
      { path: 'clientes', component: CustomersPage },
      { path: 'veiculos', component: VehiclesPage },
      { path: 'stock', component: StockPage },
      { path: 'faturacao', component: InvoicesPage },
      { path: 'faturacao/:id', component: InvoiceDetailPage },
      { path: 'relatorios', component: ReportsPage },
      { path: 'equipa', component: TeamPage },
      { path: 'definicoes', component: SettingsPage },
    ],
  },
  { path: '**', redirectTo: '' },
];
