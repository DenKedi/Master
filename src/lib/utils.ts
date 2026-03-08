import { ApiResponse } from '@/types';
import { NextResponse } from 'next/server';

/** Wrap a successful API response */
export function apiOk<T>(data: T, status = 200): NextResponse {
  const body: ApiResponse<T> = { success: true, data };
  return NextResponse.json(body, { status });
}

/** Wrap an error API response */
export function apiError(message: string, status = 400): NextResponse {
  const body: ApiResponse = { success: false, error: message };
  return NextResponse.json(body, { status });
}

/** Generate a random integer between min and max (inclusive) */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Format a number as currency string */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} coins`;
}

/** Calculate discounted price */
export function applyDiscount(price: number, discountPercent?: number): number {
  if (!discountPercent) return price;
  return Math.floor(price * (1 - discountPercent / 100));
}

/** Weighted random rarity picker based on pack type */
export type RarityWeights = Record<string, number>;

export function pickRandomRarity(weights: RarityWeights): string {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights)) {
    rand -= weight;
    if (rand <= 0) return rarity;
  }
  return Object.keys(weights)[0];
}

export const DEFAULT_RARITY_WEIGHTS: RarityWeights = {
  normal: 60,
  nice: 25,
  special: 10,
  uiiiii: 4,
  unknown: 1,
};
