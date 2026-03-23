/**
 * Reference Code Generator
 *
 * FORMAT RULES
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner (fixed):        10
 *
 * Marketer codes are built by appending two digits to the parent code.
 *   Level 1  (parent = owner "10"):      1001, 1002, …, 1099
 *   Level 2  (parent = L1 "1001"):       100101, 100102, …
 *   Level 3  (parent = L2 "100101"):     10010101, 10010102, …
 *   Maximum marketer depth = 3.
 *   A Level-3 marketer CANNOT create child marketers.
 *
 * Cafeteria codes append "P" + two digits to the direct parent marketer code.
 *   Under L1 "1001":       1001P01, 1001P02, …
 *   Under L2 "100101":     100101P01, 100101P02, …
 *   Under L3 "10010101":   10010101P01, 10010101P02, …
 *
 * Marketer numbering and cafeteria numbering are INDEPENDENT sequences per parent.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { and, eq, like, sql } from "drizzle-orm";
import { getDb } from "../db.js";
import { cafeterias, marketers } from "../../drizzle/schema.js";

// ─── Constants ───────────────────────────────────────────────────────────────

export const OWNER_REFERENCE_CODE = "10";
export const MAX_MARKETER_DEPTH = 3;

/** @deprecated Use OWNER_REFERENCE_CODE instead */
export enum ReferenceCodePrefix {
  OWNER = "10",
  MARKETER = "",   // no prefix – codes are pure numeric
  CAFETERIA = "P",
  TABLE = "T",
  WAITER = "W",
}

export enum EntityType {
  OWNER = "owner",
  MARKETER = "marketer",
  CAFETERIA = "cafeteria",
}

// ─── Depth helpers ───────────────────────────────────────────────────────────

/**
 * Returns the marketer depth level of a numeric marketer code.
 *   "10"       → 0  (owner, not a marketer)
 *   "1001"     → 1
 *   "100101"   → 2
 *   "10010101" → 3
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
 * Returns true when the code belongs to a cafeteria (contains "P").
 */
export function isCafeteriaCode(code: string): boolean {
  return /P\d{2}$/.test(code);
}

// ─── Entity type detection ───────────────────────────────────────────────────

export function getEntityTypeFromCode(code: string): EntityType | null {
  if (code === OWNER_REFERENCE_CODE) return EntityType.OWNER;
  if (isMarketerCode(code)) return EntityType.MARKETER;
  if (isCafeteriaCode(code)) return EntityType.CAFETERIA;
  return null;
}

// ─── Parent code extraction ──────────────────────────────────────────────────

/**
 * Extracts the parent reference code from a child code.
 *   "1001"       → "10"
 *   "100101"     → "1001"
 *   "10010101"   → "100101"
 *   "1001P01"    → "1001"
 *   "100101P01"  → "100101"
 */
export function getParentCode(childCode: string): string | null {
  if (childCode === OWNER_REFERENCE_CODE) return null;

  if (isCafeteriaCode(childCode)) {
    const pIndex = childCode.lastIndexOf("P");
    return childCode.substring(0, pIndex) || null;
  }

  if (isMarketerCode(childCode)) {
    if (childCode.length <= OWNER_REFERENCE_CODE.length + 2) {
      return OWNER_REFERENCE_CODE;
    }
    return childCode.substring(0, childCode.length - 2);
  }

  return null;
}

// ─── Capability check ────────────────────────────────────────────────────────

/**
 * Returns true when the entity identified by `marketerCode` is allowed to
 * create a child of type `childType`.
 *
 * Rules:
 *  - Owner ("10") can create level-1 marketers.
 *  - Marketers at depth 1 or 2 can create child marketers.
 *  - Marketers at depth 3 CANNOT create child marketers.
 *  - Any marketer (depth 1-3) can create cafeterias.
 */
export function canMarketerCreateChild(
  marketerCode: string,
  childType: EntityType.MARKETER | EntityType.CAFETERIA
): boolean {
  if (childType === EntityType.CAFETERIA) {
    return isMarketerCode(marketerCode);
  }

  // Creating a child marketer
  if (marketerCode === OWNER_REFERENCE_CODE) return true;
  if (!isMarketerCode(marketerCode)) return false;

  const depth = getMarketerDepth(marketerCode);
  return depth < MAX_MARKETER_DEPTH;
}

// ─── Code generators ─────────────────────────────────────────────────────────

/**
 * Generates the next child MARKETER code under `parentCode`.
 *
 * Queries the marketers table for siblings whose code is exactly
 * parentCode + 2 digits, then appends the next available two-digit suffix.
 *
 * @throws if parentCode is a level-3 marketer (depth limit reached).
 * @throws if 99 children already exist.
 */
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

/**
 * Generates the next CAFETERIA code under `parentMarketerCode`.
 *
 * Format: `<parentMarketerCode>P<nn>`
 * Queries the cafeterias table for siblings.
 *
 * @throws if 99 cafeterias already exist under this marketer.
 */
export async function generateCafeteriaChildCode(parentMarketerCode: string): Promise<string> {
  if (!isMarketerCode(parentMarketerCode) && parentMarketerCode !== OWNER_REFERENCE_CODE) {
    throw new Error(`Invalid parent marketer code: ${parentMarketerCode}`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const prefix = `${parentMarketerCode}P`;

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

/**
 * Unified child code generator (backward-compatible with existing callers).
 */
export async function generateChildReferenceCode(
  parentCode: string,
  childType: EntityType.MARKETER | EntityType.CAFETERIA
): Promise<string> {
  if (childType === EntityType.CAFETERIA) {
    return generateCafeteriaChildCode(parentCode);
  }
  return generateMarketerChildCode(parentCode);
}

/**
 * Legacy function kept for backward compatibility.
 * Owner code is always "10" (fixed).
 * For root marketers (direct children of owner) delegates to generateMarketerChildCode("10").
 */
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
  // Marketer: "10" + 1-3 pairs of digits  → length 4, 6, or 8
  if (/^10(\d{2}){1,3}$/.test(code)) return true;
  // Cafeteria: marketer code + "P" + two digits
  if (/^10(\d{2}){1,3}P\d{2}$/.test(code)) return true;
  return false;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Given an array of existing child codes and the prefix length,
 * extracts the numeric suffix from each code and returns the next available
 * suffix integer (1-based, max 99).
 */
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
