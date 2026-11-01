import {
  ChartRecommendation,
  ColumnProfile,
  SemanticFieldRole,
} from '../types/analytics';

/**
 * Automatic Chart Selection Engine (Section 5 Specification)
 * Rules:
 * - Date + Numerical = Line Chart
 * - Categorical + Numerical = Bar Chart
 * - Geographic + Numerical = Map
 * - Categorical with few distinct values = Donut Chart
 * - Numerical + Numerical = Scatter Plot
 * - Date + Category + Numerical = Stacked Bar Chart
 * - Numerical distributions = Histogram
 * - Multiple numerical fields = Correlation Heatmap
 */
export function generateChartRecommendations(
  schemaMapping: Record<SemanticFieldRole, string | null>,
  columns: ColumnProfile[]
): ChartRecommendation[] {
  const hasDate = Boolean(schemaMapping.date);
  const hasRevenue = Boolean(schemaMapping.revenue || schemaMapping.price);
  const hasCountry = Boolean(schemaMapping.country);
  const hasCategory = Boolean(schemaMapping.category);
  const hasPayment = Boolean(schemaMapping.payment_method);
  const hasDiscount = Boolean(schemaMapping.discount);
  const hasCustomer = Boolean(schemaMapping.customer_id);
  const hasProduct = Boolean(schemaMapping.product);

  const paymentCol = columns.find((c) => c.name === schemaMapping.payment_method);
  const paymentDistinct = paymentCol?.uniqueCount ?? 5;

  const revenueFieldName = schemaMapping.revenue || schemaMapping.price || 'Revenue';

  return [
    {
      id: 'revenue_over_time',
      title: 'Revenue Trajectory Over Time',
      subtitle: 'Temporal aggregation of gross transaction volume across intervals',
      ruleApplied: 'Date + Numerical → Line Chart',
      xField: schemaMapping.date || 'Date',
      yField: revenueFieldName,
      recommendedType: 'line',
      alternativeTypes: ['line', 'area', 'bar'],
      available: hasDate && hasRevenue,
      unavailableReason: !hasDate
        ? 'Requires a mapped Date/Timestamp column in the uploaded dataset.'
        : !hasRevenue
        ? 'Requires a mapped Revenue or Price numerical column.'
        : undefined,
    },
    {
      id: 'revenue_by_country',
      title: 'Revenue by Country (Top Markets)',
      subtitle: 'Ranked sovereign markets by net transaction volume',
      ruleApplied: 'Categorical + Numerical → Bar Chart',
      xField: schemaMapping.country || 'Country',
      yField: revenueFieldName,
      recommendedType: 'horizontal_bar',
      alternativeTypes: ['horizontal_bar', 'bar'],
      available: hasCountry && hasRevenue,
      unavailableReason: !hasCountry
        ? 'Requires a mapped Geographic / Country column in the dataset.'
        : undefined,
    },
    {
      id: 'global_shopping_map',
      title: 'Global Shopping Distribution',
      subtitle: 'Geospatial density and average order value across international markets',
      ruleApplied: 'Geographic + Numerical → Interactive World Map',
      xField: schemaMapping.country || 'Country',
      yField: revenueFieldName,
      recommendedType: 'map',
      alternativeTypes: ['map', 'horizontal_bar'],
      available: hasCountry && hasRevenue,
      unavailableReason: !hasCountry
        ? 'Requires a mapped Geographic / Country column for spatial projection.'
        : undefined,
    },
    {
      id: 'revenue_by_category',
      title: 'Revenue by Product Category',
      subtitle: 'Category-level gross merchandise value and volume share',
      ruleApplied: 'Categorical + Numerical → Bar Chart',
      xField: schemaMapping.category || 'Category',
      yField: revenueFieldName,
      recommendedType: 'bar',
      alternativeTypes: ['bar', 'horizontal_bar', 'donut'],
      available: hasCategory && hasRevenue,
      unavailableReason: !hasCategory
        ? 'Requires a mapped Product Category column.'
        : undefined,
    },
    {
      id: 'payment_method_dist',
      title: 'Payment Method Distribution',
      subtitle: `Low-cardinality categorical split (${paymentDistinct} distinct tender methods)`,
      ruleApplied: 'Categorical (Few Distinct Values) → Donut Chart',
      xField: schemaMapping.payment_method || 'Payment Method',
      yField: 'Order Share %',
      recommendedType: 'donut',
      alternativeTypes: ['donut', 'bar'],
      available: hasPayment,
      unavailableReason: !hasPayment
        ? 'Requires a mapped Payment Method column.'
        : undefined,
    },
    {
      id: 'monthly_sales_trends',
      title: 'Monthly Sales & Order Velocity Trends',
      subtitle: 'Seasonality index comparing monthly order count and net revenue',
      ruleApplied: 'Date + Category + Numerical → Multi-Series / Stacked Chart',
      xField: 'Month',
      yField: `${revenueFieldName} & Orders`,
      recommendedType: 'line',
      alternativeTypes: ['line', 'stacked_bar', 'area'],
      available: hasDate && hasRevenue,
      unavailableReason: !hasDate
        ? 'Requires a mapped Date column to extract monthly seasonality.'
        : undefined,
    },
    {
      id: 'customer_purchasing_behaviour',
      title: 'Customer Purchasing Behaviour by Cohort',
      subtitle: 'Average Order Value vs. Repeat Purchase Rate across buyer tiers',
      ruleApplied: 'Categorical + Multiple Numerical → Grouped Bar Chart',
      xField: schemaMapping.customer_id || 'Customer Segment',
      yField: 'AOV & Repeat Rate',
      recommendedType: 'bar',
      alternativeTypes: ['bar', 'stacked_bar'],
      available: hasCustomer && hasRevenue,
      unavailableReason: !hasCustomer
        ? 'Requires a mapped Customer ID column to compute buyer cohorts.'
        : undefined,
    },
    {
      id: 'discount_vs_revenue',
      title: 'Discount Rate vs. Order Revenue & Quantity',
      subtitle: 'Price elasticity analysis across promotional markdown brackets',
      ruleApplied: 'Numerical + Numerical → Scatter Plot',
      xField: schemaMapping.discount || 'Discount %',
      yField: revenueFieldName,
      recommendedType: 'scatter',
      alternativeTypes: ['scatter', 'bar'],
      available: hasDiscount && hasRevenue,
      unavailableReason: !hasDiscount
        ? 'Requires a mapped Discount numerical column in the dataset.'
        : undefined,
    },
    {
      id: 'product_performance_table',
      title: 'Product Performance Ranked Ledger',
      subtitle: 'Top SKUs ranked by net revenue, unit velocity, and customer rating',
      ruleApplied: 'High-Cardinality Entity → Ranked Tabular Matrix',
      xField: schemaMapping.product || 'Product',
      yField: revenueFieldName,
      recommendedType: 'bar',
      alternativeTypes: ['bar'],
      available: hasProduct || hasCategory,
      unavailableReason: !hasProduct && !hasCategory
        ? 'Requires a mapped Product or Category column.'
        : undefined,
    },
    {
      id: 'rfm_segmentation',
      title: 'Customer Segmentation (RFM Model)',
      subtitle: 'Recency, Frequency, and Monetary value clustering across active buyers',
      ruleApplied: 'Multi-Dimensional Behavioral Clustering → RFM Matrix',
      xField: 'RFM Segment',
      yField: 'Monetary Value & Share',
      recommendedType: 'bar',
      alternativeTypes: ['bar'],
      available: hasCustomer && hasRevenue,
      unavailableReason: !hasCustomer
        ? 'Requires Customer ID, Date, and Revenue columns for RFM scoring.'
        : undefined,
    },
  ];
}
