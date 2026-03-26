/**
 * Reference Code Generator - Hierarchical Structure
 *
 * FORMAT RULES (As per User Report)
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner (fixed):        10
 *
 * Marketer codes are built by appending two digits to the parent code.
 *   Level 1  (parent = owner "10"):      1001, 1002, …, 1099
 *   Level 2  (parent = L1 "1001"):       100101, 100102, …
 *   Level 3  (parent = L2 "100101"):     10010101, 10010102, …
 *   Level 4  (parent = L3 "10010101"):   1001010101, 1001010102, …
 *   Maximum marketer depth = 4.
 *
 * Cafeteria codes append "C" + two digits to the direct parent marketer code.
 *   Under L1 "1001":       1001C01, 1001C02, …
 *   Under L2 "100101":     100101C01, 100101C02, …
 *   Under L3 "10010101":   10010101C01, 10010101C02, …
 *   Under L4 "1001010101": 1001010101C01, 1001010101C02, …
 *
 * Staff/Table codes append Role Letter + two digits to the cafeteria code.
 *   Waiter: {cafeCode}W01, W02...
 *   Chef:   {cafeCode}K01, K02...
 *   Admin:  {cafeCode}A01, A02... (Waiters/Chefs created by Admin)
 *   Table:  {cafeCode}T01, T02...
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { and, eq, like, sql } from "drizzle-orm";
import { getDb } from "../db.js";
import { cafeterias, marketers } from "../../drizzle/schema.js";

// ─── Constants ───────────────────────────────────────────────────────────────

export const OWNER_REFERENCE_CODE = "10";
export const MAX_MARKETER_DEPTH = 4;

export enum EntityType {
  OWNER = "owner",
  MARKETER = "marketer",
  CAFETERIA = "cafeteria",
}

// ─── Depth helpers ───────────────────────────────────────────────────────────

/**
 * Returns the marketer depth level of a numeric marketer code.
 *   "10"         → 0  (owner)
 *   "1001"       → 1
 *   "100101"     → 2
 *   "10010101"   → 3
 *   "1001010101" → 4
 */
export function getMarketerDepth(code: string): number {
  if (code === OWNER_REFERENCE_CODE) return 0;
  const extra = code.length - OWNER_REFERENCE_CODE.length;
  return extra / 2;
}

/**
 * Returns true when the code belongs to a marketer
 * (pure numeric, longer than owner code "10").
 */
export function isMarketerCode(code: string): boolean {
  return /^\d+$/.test(code) && code !== OWNER_REFERENCE_CODE && code.length > OWNER_REFERENCE_CODE.length;
}

/**
 * Returns true when the code belongs to a cafeteria (contains "C").
 */
export function isCafeteriaCode(code: string): boolean {
  return /C\d{2}$/.test(code);
}

// ─── Entity type detection ───────────────────────────────────────────────────

export function getEntityTypeFromCode(code: string): EntityType | null {
  if (code === OWNER_REFERENCE_CODE) return EntityType.OWNER;
  if (isMarketerCode(code)) return EntityType.MARKETER;
  if (isCafeteriaCode(code)) return EntityType.CAFETERIA;
  return null;
}

// ─── Parent code extraction ──────────────────────────────────────────────────

export function getParentCode(childCode: string): string | null {
  if (childCode === OWNER_REFERENCE_CODE) return null;

  if (isCafeteriaCode(childCode)) {
    const cIndex = childCode.lastIndexOf("C");
    return childCode.substring(0, cIndex) || null;
  }

  if (isMarketerCode(childCode)) {
    if (childCode.length <= OWNER_REFERENCE_CODE.length + 2) {
      return OWNER_REFERENCE_CODE;
    }
    return childCode.substring(0, childCode.length - 2);
  }

  return null;
}

// ─── Code generators ─────────────────────────────────────────────────────────

export async function generateMarketerChildCode(parentCode: string): Promise<string> {
  if (parentCode !== OWNER_REFERENCE_CODE) {
    if (!isMarketerCode(parentCode)) {
      throw new Error(`Invalid parent code for marketer creation: ${parentCode}`);
    }
    const depth = getMarketerDepth(parentCode);
    if (depth >= MAX_MARKETER_DEPTH) {
      throw new Error(
        `Marketer at depth ${depth} cannot create child marketers (max depth = ${MAX_MARKETER_DEPTH})`
      );
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingChildren = await db
    .select({ code: marketers.referenceCode })
    .from(marketers)
    .where(
      and(
        like(marketers.referenceCode, `${parentCode}__`),
        sql`LENGTH(${marketers.referenceCode}) = ${parentCode.length + 2}`
      )
    );

  const nextSuffix = _nextSuffix(existingChildren.map((r) => r.code), parentCode.length);
  return `${parentCode}${String(nextSuffix).padStart(2, "0")}`;
}

export async function generateCafeteriaChildCode(parentMarketerCode: string): Promise<string> {
  if (!isMarketerCode(parentMarketerCode) && parentMarketerCode !== OWNER_REFERENCE_CODE) {
    throw new Error(`Invalid parent marketer code: ${parentMarketerCode}`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const prefix = `${parentMarketerCode}C`;

  const existingChildren = await db
    .select({ code: cafeterias.referenceCode })
    .from(cafeterias)
    .where(
      and(
        like(cafeterias.referenceCode, `${prefix}__`),
        sql`LENGTH(${cafeterias.referenceCode}) = ${prefix.length + 2}`
      )
    );

  const nextSuffix = _nextSuffix(existingChildren.map((r) => r.code), prefix.length);
  return `${prefix}${String(nextSuffix).padStart(2, "0")}`;
}

export async function generateChildReferenceCode(
  parentCode: string,
  childType: EntityType.MARKETER | EntityType.CAFETERIA
): Promise<string> {
  if (childType === EntityType.CAFETERIA) {
    return generateCafeteriaChildCode(parentCode);
  }
  return generateMarketerChildCode(parentCode);
}

export async function generateInitialReferenceCode(
  type: EntityType.OWNER | EntityType.MARKETER
): Promise<string> {
  if (type === EntityType.OWNER) {
    return OWNER_REFERENCE_CODE;
  }
  return generateMarketerChildCode(OWNER_REFERENCE_CODE);
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function isValidReferenceCode(code: string): boolean {
  if (code === OWNER_REFERENCE_CODE) return true;
  // Marketer: "10" + 1-4 pairs of digits
  if (/^10(\d{2}){1,4}$/.test(code)) return true;
  // Cafeteria: marketer code + "C" + two digits
  if (/^10(\d{2}){1,4}C\d{2}$/.test(code)) return true;
  return false;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function _nextSuffix(codes: (string | null)[], prefixLength: number): number {
  let max = 0;
  for (const code of codes) {
    if (!code) continue;
    const suffix = code.substring(prefixLength);
    if (/^\d{2}$/.test(suffix)) {
      const n = parseInt(suffix, 10);
      if (n > max) max = n;
    }
  }
  const next = max + 1;
  if (next > 99) {
    throw new Error("99-child limit reached for this parent code");
  }
  return next;
}
