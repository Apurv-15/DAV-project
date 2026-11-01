export type SemanticFieldRole =
  | 'order_id'
  | 'customer_id'
  | 'product'
  | 'category'
  | 'date'
  | 'country'
  | 'quantity'
  | 'price'
  | 'revenue'
  | 'discount'
  | 'payment_method'
  | 'rating'
  | 'unmapped';

export type ColumnDataType = 'string' | 'number' | 'date' | 'boolean' | 'categorical';

export interface ColumnProfile {
  name: string;
  semanticRole: SemanticFieldRole;
  semanticConfidence: number;
  isAmbiguous: boolean;
  dataType: ColumnDataType;
  totalCount: number;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  status: 'Healthy' | 'Warning' | 'Critical';
  statusNote: string;
  sampleValues: string[];
  numericStats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    q25: number;
    q75: number;
    outlierCount: number;
    distribution: { bucket: string; count: number }[];
  };
  categoricalStats?: {
    topValues: { label: string; count: number; percentage: number }[];
    inconsistentCasingCount: number;
  };
  dateStats?: {
    minDate: string;
    maxDate: string;
    invalidDateCount: number;
  };
}

export interface DataQualityReport {
  overallScore: number;
  completeness: number;
  validity: number;
  uniqueness: number;
  consistency: number;
  totalRows: number;
  totalColumns: number;
  missingCellsCount: number;
  duplicateRowsCount: number;
  outlierCellsCount: number;
  invalidDatesCount: number;
  invalidAmountsCount: number;
  inconsistentCategoriesCount: number;
}

export interface CleaningConfig {
  missingValueStrategy: 'impute_median_mode' | 'drop_rows' | 'keep';
  removeDuplicates: boolean;
  standardizeDates: boolean;
  handleInvalidAmounts: 'abs_or_recalc' | 'drop_invalid' | 'keep';
  normalizeCategories: boolean;
  capExtremeOutliers: boolean;
}

export interface CleaningLogEntry {
  id: string;
  timestamp: string;
  operation: string;
  targetColumn: string;
  recordsAffected: number;
  details: string;
  severity: 'info' | 'fixed' | 'preserved';
}

export interface BeforeAfterComparison {
  rawRowCount: number;
  cleanedRowCount: number;
  rawMissingCount: number;
  cleanedMissingCount: number;
  rawDuplicatesCount: number;
  cleanedDuplicatesCount: number;
  rawInvalidDatesCount: number;
  cleanedInvalidDatesCount: number;
  rawInvalidAmountsCount: number;
  cleanedInvalidAmountsCount: number;
  rawQualityScore: number;
  cleanedQualityScore: number;
  rawTotalRevenue: number;
  cleanedTotalRevenue: number;
}

export type RecommendedChartType =
  | 'line'
  | 'bar'
  | 'horizontal_bar'
  | 'map'
  | 'donut'
  | 'scatter'
  | 'stacked_bar'
  | 'histogram'
  | 'heatmap'
  | 'area';

export interface ChartRecommendation {
  id: string;
  title: string;
  subtitle: string;
  ruleApplied: string;
  xField: string;
  yField: string;
  recommendedType: RecommendedChartType;
  alternativeTypes: RecommendedChartType[];
  available: boolean;
  unavailableReason?: string;
}

export interface DashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  averageCustomerRating: number | null;
  repeatPurchaseRate: number;
  revenueGrowthPct: number;
  activeCountriesCount: number;
}

export interface TimeSeriesPoint {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
  aov: number;
}

export interface CountryMetric {
  country: string;
  isoCode: string;
  lat: number;
  lng: number;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  sharePct: number;
  topCategory: string;
}

export interface CategoryMetric {
  category: string;
  revenue: number;
  orders: number;
  quantity: number;
  avgRating: number;
  avgDiscount: number;
  growthPct: number;
  sharePct: number;
}

export interface PaymentMethodMetric {
  method: string;
  revenue: number;
  orders: number;
  sharePct: number;
}

export interface CustomerBehaviorPoint {
  segment: string;
  avgOrderValue: number;
  avgOrdersPerCustomer: number;
  totalRevenue: number;
  customerCount: number;
  repeatRatePct: number;
}

export interface DiscountScatterPoint {
  discountPct: number;
  avgQuantity: number;
  avgRevenue: number;
  orderCount: number;
  category: string;
}

export interface ProductPerformanceRow {
  rank: number;
  productName: string;
  category: string;
  revenue: number;
  orders: number;
  unitsSold: number;
  avgPrice: number;
  avgRating: number;
  returnRatePct: number;
}

export interface RfmSegmentMetric {
  segment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'At Risk' | 'Hibernating';
  description: string;
  customers: number;
  sharePct: number;
  recencyDaysAvg: number;
  frequencyAvg: number;
  monetaryAvg: number;
  totalRevenue: number;
}

export interface DashboardAggregations {
  kpis: DashboardKPIs;
  revenueOverTime: TimeSeriesPoint[];
  revenueByCountry: CountryMetric[];
  revenueByCategory: CategoryMetric[];
  paymentMethodDist: PaymentMethodMetric[];
  monthlySalesTrends: { month: string; revenue: number; orders: number; discountRate: number }[];
  customerBehavior: CustomerBehaviorPoint[];
  discountVsRevenue: DiscountScatterPoint[];
  topProducts: ProductPerformanceRow[];
  rfmSegments: RfmSegmentMetric[];
  correlations: {
    discountToQuantity: number;
    discountToRevenue: number;
    priceToRating: number;
  };
}

export interface GlobalFilterState {
  dateFrom: string;
  dateTo: string;
  country: string;
  category: string;
  paymentMethod: string;
  customerSegment: string;
}

export interface AIInsightCard {
  id: string;
  category: 'Trend' | 'Anomaly' | 'Comparison' | 'Recommendation';
  title: string;
  summary: string;
  metricHighlight: string;
  impact: 'High' | 'Medium';
}

export interface EntityTelemetryProfile {
  entityName: string;
  entityType: 'SKU / Product' | 'Food & Beverage Item' | 'Category' | 'Country Market';
  category: string;
  sourceType: 'Indexed Repository' | 'Uploaded Dataset Index' | 'Dynamic Catalog Synthesis';
  yoyGrowthPct: number;
  qoqGrowthPct: number;
  momGrowthPct: number;
  totalRevenue: number;
  totalOrders: number;
  unitsSold: number;
  avgUnitPrice: number;
  avgDiscountPct: number;
  avgRating: number;
  repeatPurchasePct: number;
  returnRatePct: number;
  monthlySeries: { month: string; revenue: number; units: number; growthPct: number }[];
  quarterlyTable: {
    quarter: string;
    revenue: number;
    units: number;
    qoqGrowthPct: number;
    repeatSharePct: number;
  }[];
  topMarkets: { country: string; sharePct: number; revenue: number }[];
}

export interface InlineChartPayload {
  title: string;
  subtitle: string;
  type: 'area' | 'bar';
  yLabel: string;
  data: { label: string; value: number; secondary?: number }[];
}

export interface BreakdownTablePayload {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  matchedEntityName?: string;
  matchedEntitySource?: string;
  computedEvidence?: {
    label: string;
    value: string;
  }[];
  inlineChart?: InlineChartPayload;
  breakdownTable?: BreakdownTablePayload;
  sqlEquivalent?: string;
}

export interface RawRowRecord {
  [key: string]: string | number | null;
}

export interface DatasetEntry {
  id: string;
  name: string;
  fileName: string;
  fileSizeFormatted: string;
  format: 'CSV' | 'XLSX' | 'Parquet';
  uploadedAt: string;
  completedAt: string;
  status: 'Completed' | 'Processing' | 'Cleaned';
  isCleaned: boolean;
  isSampleDataset: boolean;
  rawRowCount: number;
  cleanedRowCount: number;
  columnCount: number;
  schemaMapping: Record<SemanticFieldRole, string | null>;
  columns: ColumnProfile[];
  quality: DataQualityReport;
  cleaningConfig: CleaningConfig;
  cleaningLogs: CleaningLogEntry[];
  beforeAfter: BeforeAfterComparison;
  chartRecommendations: ChartRecommendation[];
  baseAggregations: DashboardAggregations;
  aiInsights: AIInsightCard[];
  rawPreviewRows: RawRowRecord[];
  cleanedPreviewRows: RawRowRecord[];
  entityIndex?: Record<string, EntityTelemetryProfile>;
}
