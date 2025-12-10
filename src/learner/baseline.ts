import dayjs from '../utils/time';

export type AgeBucketId =
  | '0_2m'
  | '3_4m'
  | '5_7m'
  | '8_10m'
  | '11_14m'
  | '15_24m';

export interface AgeBaseline {
  id: AgeBucketId;
  minMonths: number;
  maxMonths: number;
  // typical awake window in minutes
  wakeWindowMin: number;
  wakeWindowMax: number;
  // typical nap length in minutes
  napLengthMin: number;
  napLengthMax: number;
}

const AGE_BASELINES: AgeBaseline[] = [
  {
    id: '0_2m',
    minMonths: 0,
    maxMonths: 2,
    wakeWindowMin: 45,
    wakeWindowMax: 90,
    napLengthMin: 45,
    napLengthMax: 90,
  },
  {
    id: '3_4m',
    minMonths: 3,
    maxMonths: 4,
    wakeWindowMin: 75,
    wakeWindowMax: 120,
    napLengthMin: 45,
    napLengthMax: 90,
  },
  {
    id: '5_7m',
    minMonths: 5,
    maxMonths: 7,
    wakeWindowMin: 120,
    wakeWindowMax: 150,
    napLengthMin: 60,
    napLengthMax: 90,
  },
  {
    id: '8_10m',
    minMonths: 8,
    maxMonths: 10,
    wakeWindowMin: 150,
    wakeWindowMax: 180,
    napLengthMin: 60,
    napLengthMax: 90,
  },
  {
    id: '11_14m',
    minMonths: 11,
    maxMonths: 14,
    wakeWindowMin: 180,
    wakeWindowMax: 210,
    napLengthMin: 60,
    napLengthMax: 90,
  },
  {
    id: '15_24m',
    minMonths: 15,
    maxMonths: 24,
    wakeWindowMin: 210,
    wakeWindowMax: 240,
    napLengthMin: 60,
    napLengthMax: 90,
  },
];

export function getAgeInMonths(birthDateISO: string, atISO: string): number {
  const birth = dayjs(birthDateISO);
  const at = dayjs(atISO);
  const months =
    at.diff(birth, 'month') +
    (at.date() < birth.date() ? -0.2 : 0); // tiny adjustment to avoid off-by-one
  return Math.max(0, months);
}

export function getAgeBaseline(
  birthDateISO: string,
  atISO: string
): AgeBaseline {
  const months = getAgeInMonths(birthDateISO, atISO);

  const bucket =
    AGE_BASELINES.find(
      (b) => months >= b.minMonths && months <= b.maxMonths
    ) ?? AGE_BASELINES[AGE_BASELINES.length - 1];

  return bucket;
}
