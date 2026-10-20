export interface DashboardSummary {
  totalSales?: number;
  salesCount?: number;
  topProducts: { id: number; name: string; unitsSold: number }[];
  lowStockProducts?: { id: number; name: string; currentStock: number; minimumStock: number }[];
  salesTrend7Days?: { day: string; total: number }[];
  activeAlertsCount: number;
}
