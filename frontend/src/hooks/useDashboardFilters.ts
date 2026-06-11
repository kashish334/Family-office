// frontend/src/hooks/useDashboardFilters.ts
// NEW FILE — manages month/year filter state for the Dashboard

import { useState } from 'react';

export interface DashboardFilters {
  year: number;
  month: number; // 1–12
}

export function useDashboardFilters() {
  const now = new Date();

  const [filters, setFilters] = useState<DashboardFilters>({
    year: now.getFullYear(),
    month: now.getMonth() + 1, // JS months are 0-indexed
  });

  function setMonth(month: number) {
    setFilters(f => ({ ...f, month }));
  }

  function setYear(year: number) {
    setFilters(f => ({ ...f, year }));
  }

  /** Step forward or back by one month, wrapping year automatically */
  function stepMonth(direction: 1 | -1) {
    setFilters(f => {
      let m = f.month + direction;
      let y = f.year;
      if (m > 12) { m = 1; y += 1; }
      if (m < 1)  { m = 12; y -= 1; }
      return { year: y, month: m };
    });
  }

  /** True when the selected month/year equals the current real month */
  const isCurrentMonth =
    filters.year === now.getFullYear() && filters.month === now.getMonth() + 1;

  const monthLabel = new Date(filters.year, filters.month - 1, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });

  return { filters, setMonth, setYear, stepMonth, isCurrentMonth, monthLabel };
}