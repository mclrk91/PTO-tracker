import { parseISO, isBefore, isAfter, isSameDay, startOfDay, isWeekend, format, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { PTO_CONFIG, PAY_PERIOD_END_DATES, COMPANY_HOLIDAYS, GROUP1_FLEX_FRIDAYS } from '../data/constants';

// Get number of accruals earned through a given date
export function getAccrualsThroughDate(dateStr) {
  const date = parseISO(dateStr);
  let count = 0;
  for (const ppEnd of PAY_PERIOD_END_DATES) {
    const ppDate = parseISO(ppEnd);
    if (isBefore(ppDate, date) || isSameDay(ppDate, date)) {
      count++;
    }
  }
  return count;
}

// Get total accrued hours through a date
export function getTotalAccruedThroughDate(dateStr) {
  return getAccrualsThroughDate(dateStr) * PTO_CONFIG.accrualPerPayPeriod;
}

// Get total granted PTO available at a given date (carryover + accruals through that date)
export function getGrantedPTOAtDate(dateStr) {
  return PTO_CONFIG.carryoverFrom2025 + getTotalAccruedThroughDate(dateStr);
}

// Calculate total hours used from absences up through a date
export function getTotalUsedThroughDate(absences, dateStr, pool = null) {
  const date = parseISO(dateStr);
  return absences
    .filter(a => {
      const absDate = parseISO(a.date);
      const dateMatch = isBefore(absDate, date) || isSameDay(absDate, date);
      const poolMatch = pool ? a.pool === pool : true;
      return dateMatch && poolMatch;
    })
    .reduce((sum, a) => sum + a.hours, 0);
}

// Calculate current balances at a given date
export function calculateBalances(absences, dateStr) {
  const grantedTotal = getGrantedPTOAtDate(dateStr);
  const grantedUsed = getTotalUsedThroughDate(absences, dateStr, 'granted');
  const purchasedUsed = getTotalUsedThroughDate(absences, dateStr, 'purchased');
  const floatingUsed = getTotalUsedThroughDate(absences, dateStr, 'floating');

  const grantedBalance = grantedTotal - grantedUsed;
  const purchasedBalance = PTO_CONFIG.purchasedPTO2026 - purchasedUsed;
  const floatingBalance = PTO_CONFIG.floatingHoliday2026 - floatingUsed;

  return {
    granted: {
      total: grantedTotal,
      used: grantedUsed,
      balance: grantedBalance,
      carryover: PTO_CONFIG.carryoverFrom2025,
      accrued: getTotalAccruedThroughDate(dateStr),
    },
    purchased: {
      total: PTO_CONFIG.purchasedPTO2026,
      used: purchasedUsed,
      balance: purchasedBalance,
    },
    floating: {
      total: PTO_CONFIG.floatingHoliday2026,
      used: floatingUsed,
      balance: floatingBalance,
    },
    combined: {
      total: grantedTotal + PTO_CONFIG.purchasedPTO2026 + PTO_CONFIG.floatingHoliday2026,
      used: grantedUsed + purchasedUsed + floatingUsed,
      balance: grantedBalance + purchasedBalance + floatingBalance,
    },
  };
}

// Calculate year-end forecast
export function calculateYearEndForecast(absences, plannedDays = []) {
  const yearEnd = '2026-12-31';
  const totalAccruals = PAY_PERIOD_END_DATES.length * PTO_CONFIG.accrualPerPayPeriod;
  const grantedTotal = PTO_CONFIG.carryoverFrom2025 + totalAccruals;

  // Existing absences
  const existingGrantedUsed = absences.filter(a => a.pool === 'granted').reduce((s, a) => s + a.hours, 0);
  const existingPurchasedUsed = absences.filter(a => a.pool === 'purchased').reduce((s, a) => s + a.hours, 0);
  const existingFloatingUsed = absences.filter(a => a.pool === 'floating').reduce((s, a) => s + a.hours, 0);

  // Planned additional days
  const plannedHours = plannedDays.length * PTO_CONFIG.hoursPerDay;

  // Determine how planned hours draw down pools (granted first, then purchased)
  let remainingPlanned = plannedHours;
  let additionalGrantedUsed = 0;
  let additionalPurchasedUsed = 0;
  let additionalFloatingUsed = 0;

  const grantedRemaining = grantedTotal - existingGrantedUsed;
  if (remainingPlanned > 0) {
    const fromGranted = Math.min(remainingPlanned, grantedRemaining);
    additionalGrantedUsed = fromGranted;
    remainingPlanned -= fromGranted;
  }
  if (remainingPlanned > 0) {
    const purchasedRemaining = PTO_CONFIG.purchasedPTO2026 - existingPurchasedUsed;
    const fromPurchased = Math.min(remainingPlanned, purchasedRemaining);
    additionalPurchasedUsed = fromPurchased;
    remainingPlanned -= fromPurchased;
  }
  if (remainingPlanned > 0) {
    const floatingRemaining = PTO_CONFIG.floatingHoliday2026 - existingFloatingUsed;
    const fromFloating = Math.min(remainingPlanned, floatingRemaining);
    additionalFloatingUsed = fromFloating;
    remainingPlanned -= fromFloating;
  }

  const grantedYearEnd = grantedTotal - existingGrantedUsed - additionalGrantedUsed;
  const purchasedYearEnd = PTO_CONFIG.purchasedPTO2026 - existingPurchasedUsed - additionalPurchasedUsed;
  const floatingYearEnd = PTO_CONFIG.floatingHoliday2026 - existingFloatingUsed - additionalFloatingUsed;

  // Carryover to 2027: max 40 hours of granted PTO
  const carryoverTo2027 = Math.min(grantedYearEnd, PTO_CONFIG.maxCarryover);

  // Purchased PTO forfeited if unused (cannot carry over)
  const purchasedForfeited = Math.max(0, purchasedYearEnd);

  // Floating holiday forfeited
  const floatingForfeited = Math.max(0, floatingYearEnd);

  return {
    grantedYearEnd,
    purchasedYearEnd,
    floatingYearEnd,
    totalYearEnd: grantedYearEnd + purchasedYearEnd + floatingYearEnd,
    carryoverTo2027,
    grantedForfeited: Math.max(0, grantedYearEnd - PTO_CONFIG.maxCarryover),
    purchasedForfeited,
    floatingForfeited,
    totalForfeited: Math.max(0, grantedYearEnd - PTO_CONFIG.maxCarryover) + purchasedForfeited + floatingForfeited,
    deficit: remainingPlanned,
    totalAccrualsYear: totalAccruals,
  };
}

// Determine which pool a new PTO day draws from based on current balances
export function assignPool(absences, newDateStr) {
  // At the time of the new absence, what are the balances?
  const balances = calculateBalances(absences, newDateStr);

  // Granted must be exhausted first (IRS rule)
  if (balances.granted.balance >= 8) {
    return 'granted';
  }
  // Then purchased
  if (balances.purchased.balance >= 8) {
    return 'purchased';
  }
  // Then floating
  if (balances.floating.balance >= 8) {
    return 'floating';
  }
  // Borrowing from granted (can borrow up to 40h)
  return 'granted';
}

// Check if a date is a business day (not weekend, not holiday)
export function isBusinessDay(dateStr) {
  const date = parseISO(dateStr);
  if (isWeekend(date)) return false;
  if (COMPANY_HOLIDAYS.some(h => h.date === dateStr)) return false;
  return true;
}

// Check if Marissa's flex friday is available for a given week
// Flex not available if PTO or other time off is taken during that flex week
export function isFlexFridayAvailable(dateStr, absences) {
  // Check if this is actually a Group 1 flex friday
  if (!GROUP1_FLEX_FRIDAYS.includes(dateStr)) return false;

  const friday = parseISO(dateStr);
  // Get Mon-Thu of that week
  const dayOfWeek = getDay(friday); // should be 5 (Friday)
  const monday = addDays(friday, -4);

  for (let i = 0; i < 4; i++) {
    const day = format(addDays(monday, i), 'yyyy-MM-dd');
    if (absences.some(a => a.date === day)) {
      return false; // PTO during flex week = no flex friday
    }
  }
  return true;
}

// Find long weekend opportunities
export function findLongWeekendOpportunities(absences) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const opportunities = [];

  // Check each company holiday
  COMPANY_HOLIDAYS.forEach(holiday => {
    if (holiday.date <= today) return;
    const hDate = parseISO(holiday.date);
    const dayOfWeek = getDay(hDate);

    // Monday holiday = take Friday before for 4-day weekend (1 PTO day)
    if (dayOfWeek === 1) {
      const friday = format(addDays(hDate, -3), 'yyyy-MM-dd');
      if (isBusinessDay(friday) && !absences.some(a => a.date === friday)) {
        opportunities.push({
          type: '4-day weekend',
          ptoDays: 1,
          ptoHours: 8,
          dates: [friday],
          holiday: holiday.name,
          description: `Take Fri ${format(parseISO(friday), 'MMM d')} off + ${holiday.name} Mon = 4-day weekend`,
        });
      }
    }

    // Friday holiday = take Monday after for 4-day weekend
    if (dayOfWeek === 5) {
      const monday = format(addDays(hDate, 3), 'yyyy-MM-dd');
      if (isBusinessDay(monday) && !absences.some(a => a.date === monday)) {
        opportunities.push({
          type: '4-day weekend',
          ptoDays: 1,
          ptoHours: 8,
          dates: [monday],
          holiday: holiday.name,
          description: `${holiday.name} Fri + take Mon ${format(parseISO(monday), 'MMM d')} off = 4-day weekend`,
        });
      }
    }

    // Thursday holiday = take Friday for 4-day weekend
    if (dayOfWeek === 4) {
      const friday = format(addDays(hDate, 1), 'yyyy-MM-dd');
      if (isBusinessDay(friday) && !absences.some(a => a.date === friday)) {
        opportunities.push({
          type: '4-day weekend',
          ptoDays: 1,
          ptoHours: 8,
          dates: [friday],
          holiday: holiday.name,
          description: `${holiday.name} Thu + take Fri ${format(parseISO(friday), 'MMM d')} off = 4-day weekend`,
        });
      }
    }

    // Wednesday holiday = take Thu+Fri for 5-day weekend
    if (dayOfWeek === 3) {
      const thu = format(addDays(hDate, 1), 'yyyy-MM-dd');
      const fri = format(addDays(hDate, 2), 'yyyy-MM-dd');
      if (isBusinessDay(thu) && isBusinessDay(fri)) {
        opportunities.push({
          type: '5-day weekend',
          ptoDays: 2,
          ptoHours: 16,
          dates: [thu, fri],
          holiday: holiday.name,
          description: `${holiday.name} Wed + take Thu-Fri off = 5-day weekend`,
        });
      }
    }
  });

  // Also check flex Fridays that create natural long weekends
  GROUP1_FLEX_FRIDAYS.forEach(flexDate => {
    if (flexDate <= today) return;
    const fDate = parseISO(flexDate);
    const thursday = format(addDays(fDate, -1), 'yyyy-MM-dd');

    // Flex Friday + take Thursday = 4-day weekend with just 1 PTO day
    if (isBusinessDay(thursday) && !absences.some(a => a.date === thursday)) {
      const isFlexAvail = isFlexFridayAvailable(flexDate, absences);
      if (isFlexAvail) {
        opportunities.push({
          type: 'Flex + PTO combo',
          ptoDays: 1,
          ptoHours: 8,
          dates: [thursday],
          holiday: `Flex Friday ${format(fDate, 'MMM d')}`,
          description: `Take Thu ${format(parseISO(thursday), 'MMM d')} off + Flex Fri = 4-day weekend`,
          isFlex: true,
        });
      }
    }
  });

  return opportunities.sort((a, b) => a.dates[0].localeCompare(b.dates[0]));
}

// Get next upcoming flex friday for Marissa
export function getNextFlexFriday(absences) {
  const today = format(new Date(), 'yyyy-MM-dd');
  for (const flexDate of GROUP1_FLEX_FRIDAYS) {
    if (flexDate > today) {
      return {
        date: flexDate,
        available: isFlexFridayAvailable(flexDate, absences),
      };
    }
  }
  return null;
}

// Get next payday
export function getNextPayday() {
  const today = format(new Date(), 'yyyy-MM-dd');
  for (const pd of PAY_PERIOD_END_DATES) {
    if (pd >= today) {
      return pd;
    }
  }
  return null;
}
