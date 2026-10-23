/**
 * Tầng trung thực (redesign-v2, DESIGN-LANGUAGE §7 / LAYOUT-SPEC §2.4–§2.5 / COPY-DIET §4.1–§4.2).
 * Thuần hàm phân loại trình bày: quyết định một kết quả được trình bày đầy đủ ('full'),
 * chưa đủ nghĩa ('not-read'), hay fallback độ tin cậy thấp mà người dùng chủ động xem ('low-direct').
 * File này KHÔNG dịch và KHÔNG đổi kết quả engine — nó chỉ phân loại metadata.
 * Mọi chuỗi từ vựng ở đây đều ở dạng ĐÃ normalizeVi (bỏ dấu, chữ thường).
 */
import {
  CLIENT_RULE_KEYS,
  PARENT_EXAMPLES,
  matchRuleInfo,
  normalizeVi,
  type RelationRole,
} from './translate';
import { SERVER_ENTRY_PATTERNS, SERVER_EXACT_PATTERNS } from './server-patterns';

export type ResultSource = 'server' | 'device';
export type ConfidenceTier = 'role' | 'generic' | 'low';
export type TranslateMeta = { matchKind: 'entry' | 'fallback'; roleSpecific: boolean };

/**
 * Danh sách thán từ / câu cụt thật (dạng đã normalizeVi).
 * = patterns của entry exact:true phía server + 'ok' + 'ừ ừ' ở dạng đã normalize là 'u u'.
 */
export const INTERJECTION_EXACT: readonly string[] = [...SERVER_EXACT_PATTERNS, 'ok', 'u u'];

function tokenize(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Từ vựng engine nhận biết (theo token nguyên vẹn, không substring):
 * hợp token của CLIENT_RULE_KEYS, SERVER_ENTRY_PATTERNS, message của PARENT_EXAMPLES
 * (được normalizeVi trước khi tách token) và INTERJECTION_EXACT.
 */
const KNOWN_TOKENS: ReadonlySet<string> = (() => {
  const set = new Set<string>();
  const addPhrase = (phrase: string) => {
    for (const token of tokenize(phrase)) set.add(token);
  };
  for (const key of CLIENT_RULE_KEYS) addPhrase(key);
  for (const pattern of SERVER_ENTRY_PATTERNS) addPhrase(pattern);
  for (const example of PARENT_EXAMPLES) addPhrase(normalizeVi(example.message));
  for (const item of INTERJECTION_EXACT) addPhrase(item);
  return set;
})();

/**
 * Input phải là chuỗi ĐÃ normalizeVi. Trả true nếu có ít nhất một token nguyên vẹn
 * thuộc từ vựng engine (để 'asdf' không dính 'da' qua substring).
 */
export function hasKnownToken(normalizedMessage: string): boolean {
  return tokenize(normalizedMessage).some((token) => KNOWN_TOKENS.has(token));
}

/** Input phải là chuỗi ĐÃ normalizeVi. Trả true nếu toàn bộ chuỗi là một câu cụt/thán từ đã biết. */
export function isRecognizedCurt(normalizedMessage: string): boolean {
  return INTERJECTION_EXACT.includes(normalizedMessage);
}

export function evaluateClient(
  message: string,
  speaker: RelationRole,
): {
  match: { ruleId: string; roleSpecific: boolean } | null;
  hasKnownToken: boolean;
  isCurt: boolean;
} {
  const normalized = normalizeVi(message);
  return {
    match: matchRuleInfo(message, speaker),
    hasKnownToken: hasKnownToken(normalized),
    isCurt: isRecognizedCurt(normalized),
  };
}

/**
 * Cổng trình bày cho kết quả từ server.
 * - meta entry -> 'full'
 * - meta fallback -> curt ? 'low-direct' : 'not-read'
 * - meta undefined -> 'full': quyết định phân xử — undefined chỉ xảy ra khi API không phải
 *   route của repo này (route hiện tại luôn trả meta); chọn 'full' để tránh chặn nhầm
 *   toàn bộ kết quả khi meta thiếu, thay vì coi như 'not-read' quá gắt cho đường legacy.
 */
export function gateForServer(
  meta: TranslateMeta | undefined,
  curt: boolean,
): 'full' | 'not-read' | 'low-direct' {
  if (meta === undefined) return 'full';
  if (meta.matchKind === 'entry') return 'full';
  return curt ? 'low-direct' : 'not-read';
}

/** Cổng trình bày cho kết quả dịch trên máy (engine client). */
export function gateForDevice(
  match: { roleSpecific: boolean } | null,
  curt: boolean,
): 'full' | 'not-read' | 'low-direct' {
  if (match !== null) return 'full';
  return curt ? 'low-direct' : 'not-read';
}
