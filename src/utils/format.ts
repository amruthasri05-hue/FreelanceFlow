/**
 * Formatting utilities for FreelanceFlow
 * Formats currency values in Indian Rupees (₹ / INR) using Indian numbering system (en-IN).
 */

export const formatCurrency = (amount: number | string | undefined | null): string => {
  const val = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(val)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: val % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatINR = (amount: number | string | undefined | null): string => {
  return formatCurrency(amount);
};

export const formatCompactINR = (amount: number | undefined | null): string => {
  const val = amount || 0;
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(1)}Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(0)}k`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
};
