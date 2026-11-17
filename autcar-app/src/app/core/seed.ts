import { Db } from './models';

export const today = (offset = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

/** Base de dados vazia: a plataforma começa sem nenhum registo. */
export function empty(): Db {
  return { seq: 1, customers: [], vehicles: [], staff: [], parts: [], orders: [], invoices: [] };
}
