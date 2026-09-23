export const SOURCE_AUTHORITY_LABELS: Record<string, string> = {
  ENGINEERING: 'Engineering source of truth',
  CUSTOMER: 'Customer system of record',
  PRODUCT: 'Product record',
  SECURITY: 'Security record',
  EXECUTIVE: 'Executive record',
  FINANCE: 'Finance record',
  HR: 'People record',
  PUBLIC: 'Internal record',
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}
