// === PTO Plan Configuration ===
export const PTO_CONFIG = {
  planYear: 2026,
  planTermStart: '2026-01-01',
  planTermEnd: '2026-12-31',
  accrualPerPayPeriod: 7.077,
  maxCarryover: 40,
  maxBorrow: 40,
  hoursPerDay: 8,
  carryoverFrom2025: 22.001,
  purchasedPTO2026: 32,
  floatingHoliday2026: 8,
};

// === Pay Period End Dates (Saturdays) for 2026 ===
// PTO grant is given on the Saturday ending each pay period
export const PAY_PERIOD_END_DATES = [
  '2026-01-10', '2026-01-24',
  '2026-02-07', '2026-02-21',
  '2026-03-07', '2026-03-21',
  '2026-04-04', '2026-04-18',
  '2026-05-02', '2026-05-16', '2026-05-30',
  '2026-06-13', '2026-06-27',
  '2026-07-11', '2026-07-25',
  '2026-08-08', '2026-08-22',
  '2026-09-05', '2026-09-19',
  '2026-10-03', '2026-10-17', '2026-10-31',
  '2026-11-14', '2026-11-28',
  '2026-12-12', '2026-12-26',
];

// === Paydays (Fridays) ===
export const PAY_DATES = [
  '2026-01-02', '2026-01-16', '2026-01-30',
  '2026-02-13', '2026-02-27',
  '2026-03-13', '2026-03-27',
  '2026-04-10', '2026-04-24',
  '2026-05-08', '2026-05-22',
  '2026-06-05', '2026-06-18',
  '2026-07-03', '2026-07-17', '2026-07-31',
  '2026-08-14', '2026-08-28',
  '2026-09-11', '2026-09-25',
  '2026-10-09', '2026-10-23',
  '2026-11-06', '2026-11-20',
  '2026-12-04', '2026-12-18', '2026-12-31',
];

// === Company Holidays 2026 ===
export const COMPANY_HOLIDAYS = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-07-03', name: 'Independence Day (observed)' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving Day' },
  { date: '2026-11-27', name: 'Day after Thanksgiving' },
  { date: '2026-12-25', name: 'Christmas Day' },
];

// === Flex Friday Schedule ===
export const FLEX_GROUPS = {
  group1: {
    name: 'Group 1',
    color: '#3b82f6',
    members: ['Chavey', 'Estefan', 'Heather', 'Jen', 'Johnny', 'Kelly', 'Marissa', 'Tina'],
  },
  group2: {
    name: 'Group 2',
    color: '#f97316',
    members: ['Amaris', 'Carissa', 'Jenna', 'Kerrin', 'Raul', 'Tiff'],
  },
};

export const MARISSA_GROUP = 'group1';

// Flex Friday dates extracted from the 2026 TM Media Flex Friday Schedule
// Group 1 Flex Fridays (blue)
export const GROUP1_FLEX_FRIDAYS = [
  '2026-01-02', '2026-01-16', '2026-01-30',
  '2026-02-13', '2026-02-27',
  '2026-03-13', '2026-03-27',
  '2026-04-10', '2026-04-24',
  '2026-05-08', '2026-05-22',
  '2026-06-05', '2026-06-19',
  '2026-07-10', '2026-07-24',
  '2026-08-07', '2026-08-21',
  '2026-09-04', '2026-09-18',
  '2026-10-02', '2026-10-16', '2026-10-30',
  '2026-11-13', '2026-11-27',
  '2026-12-11', '2026-12-25',
];

// Group 2 Flex Fridays (orange)
export const GROUP2_FLEX_FRIDAYS = [
  '2026-01-09', '2026-01-23',
  '2026-02-06', '2026-02-20',
  '2026-03-06', '2026-03-20',
  '2026-04-03', '2026-04-17',
  '2026-05-01', '2026-05-15', '2026-05-29',
  '2026-06-12', '2026-06-26',
  '2026-07-03', '2026-07-17', '2026-07-31',
  '2026-08-14', '2026-08-28',
  '2026-09-11', '2026-09-25',
  '2026-10-09', '2026-10-23',
  '2026-11-06', '2026-11-20',
  '2026-12-04', '2026-12-18',
];

// Blackout Fridays (both groups work)
export const BLACKOUT_FRIDAYS = [
  '2026-05-01', '2026-05-29',
  '2026-07-03', '2026-07-31',
  '2026-10-30',
  '2026-11-27',
  '2026-12-25',
];

// === Flex Friday Reminders ===
export const FLEX_REMINDERS = [
  'Invites to others should show as Free with No Reminders and the start/end time marked as All Day.',
  'Use the recurrence feature carefully. Due to blackout days, your flex day is not consistently every 2 weeks throughout the year.',
  'Ensure the necessary individuals from Talent Marketing are on your invite for awareness.',
  'Along with sending Outlook invites to your immediate team partners, please also mark your Outlook calendar as "Out of Office" so your availability is visible across the organization.',
  'You must work four 10-hour days during your flex week to take Friday off. Your flex day is not available if PTO or other time off is taken during your flex week.',
  'Please ensure your Outlook calendar and the team SharePoint are updated to accurately reflect the days you are out of office.',
];

// === Default Absences (pre-populated from screenshots) ===
export const DEFAULT_ABSENCES = [
  {
    id: 'abs-1',
    date: '2026-01-02',
    hours: 8,
    type: 'Planned',
    reason: 'New Years',
    status: 'Completed',
    pool: 'granted',
  },
  {
    id: 'abs-2',
    date: '2026-01-16',
    hours: 8,
    type: 'Unplanned',
    reason: 'Tampa General infection test',
    status: 'Completed',
    pool: 'granted',
  },
  {
    id: 'abs-3',
    date: '2026-02-09',
    hours: 8,
    type: 'Unplanned',
    reason: 'Brain day, sick',
    status: 'Completed',
    pool: 'granted',
  },
  {
    id: 'abs-4',
    date: '2026-02-12',
    hours: 8,
    type: 'Planned',
    reason: 'Las Vegas BSB',
    status: 'Scheduled',
    pool: 'granted',
  },
  {
    id: 'abs-5',
    date: '2026-02-13',
    hours: 8,
    type: 'Planned',
    reason: 'Las Vegas BSB',
    status: 'Scheduled',
    pool: 'granted',
  },
];

// === Upcoming Planned (not yet submitted) ===
export const UPCOMING_PLANNED = [
  { dates: ['2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20'], reason: 'Virgin Voyages Family Cruise' },
  { dates: ['2026-04-03'], reason: 'Endometriosis Surgery Mayo Clinic' },
];

// === Non-UHG US Holidays (observed but NOT company days off) ===
export const US_HOLIDAYS_NON_UHG = [
  { date: '2026-02-16', name: "Presidents' Day" },
  { date: '2026-10-12', name: 'Columbus Day' },
  { date: '2026-11-11', name: "Veterans Day" },
];

// === PTO Usage Order ===
// IRS rule: Granted PTO (current balance including carryover + YTD accruals) must be
// exhausted BEFORE Purchased PTO can be used. The current pay period's accrual must
// also be used first. Purchased PTO cannot carry over to next year.
export const PTO_USAGE_ORDER = ['granted', 'purchased', 'floating'];
