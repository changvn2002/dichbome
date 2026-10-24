'use client';

import { useEffect, useState } from 'react';
import type { RelationRole } from './lib/translate';

/* ------------------------------------------------------------------ */
/* Avatar DiceBear (REDESIGN-V4, TYPE-AND-ICON §3) — @dicebear/core +   */
/* @dicebear/collection ghim 9.4.3, render 100% client-side, KHÔNG     */
/* qua HTTP API. Hai style được dynamic-import LƯỜI trong một chunk     */
/* riêng (chỉ tải khi Board có mục đã lưu/lịch sử để hiển thị) nên      */
/* first-load không đổi; gzip của chunk được đo và ghi V4-IMPL-LOG.     */
/*                                                                     */
/* Vị trí (ĐK-D4): CHỈ hàng mục Đã lưu + Lịch sử trong Board. Mọi bề    */
/* mặt khác (hero/empty/OG/sân khấu/phiếu/header) avatar = 0 theo hồ sơ. */
/*                                                                     */
/* Render bằng SVG INLINE (không <img src=data:...>): CSP hiện hành     */
/* của app khai img-src đúng 'self' (tests/csp.test.mjs khẳng định      */
/* từng token) nên data:-URI sẽ bị chặn — SVG inline là đường duy       */
/* nhất không phải nới CSP (tiền lệ chiatien).                          */
/*                                                                     */
/* Seed: personas dùng seed DANH TÍNH `dichbome:v2:identity:<nhãn vai  */
/* đã chuẩn hoá>` — KHÔNG dùng id bản ghi (FIX v1.4.1, nợ N5-4): id do  */
/* app mint bằng Date.now() nên mỗi kho (Đã lưu/Lịch sử/dịch lại) một   */
/* id khác nhau, cùng một người gửi thành nhiều mặt khác nhau. Danh     */
/* tính duy nhất có trên phiếu ở cả 3 bề mặt là nhãn vai (StoredItem    */
/* chỉ có speaker + message) nên seed khoá theo nhãn vai đã chuẩn hoá   */
/* (NFC + trim + gộp khoảng trắng thừa): cùng vai → cùng mặt ở mọi kho, */
/* hai phiếu khác nội dung cùng vai vẫn cùng mặt. Namespace tăng v1→v2  */
/* CÓ CHỦ ĐÍCH: mặt của các bản ghi cũ đổi ĐÚNG MỘT LẦN khi bản này lên */
/* sóng, từ đó đứng yên theo danh tính. Với initials, glyph của thư     */
/* viện được SUY TỪ seed (lib/utils/initials.js của @dicebear/initials  */
/* prng.seed) nên seed danh tính sẽ in ra glyph vô nghĩa "DC" cho mọi   */
/* liên hệ; vì vậy initials dùng nhãn vai đã chuẩn hoá làm seed-glyph   */
/* (tinh thần luật X1: glyph lấy từ tên gọi của thực thể), còn Ô NỀN    */
/* palette được chọn bằng FNV-1a trên seed danh tính (luật hash         */
/* hồ sơ — cấm tự chế hash thứ hai; đây vẫn là FNV-1a đó).              */
/* ------------------------------------------------------------------ */

/**
 * CÔNG TẮC FALLBACK DUY NHẤT (V4-IMPL-STATE §6): đặt false là personas
 * tắt ở mọi nơi, initials thay toàn cục, build vẫn xanh. Bật mặc định
 * theo khoá hồ sơ; DB-4/real-person gate trượt thì parent lật công tắc
 * này (hoặc từng vai tự rơi về initials theo bảng ĐK-D5 dưới đây).
 */
export const AVATAR_PERSONAS_ENABLED = true;

/** Palette nền duy nhất được phép: Grey 50/100/200 của thang vay + đúng 1
 *  ô tint loại C (token avatar-tint-rose). Cấm seed làm nền. Giá trị được
 *  ĐỌC TỪ CSS vars của app/tokens.css lúc chạy (nguồn sự thật token) —
 *  component không chứa hex literal (luật sink của tokens:verify nhóm 5). */
export const AVATAR_PALETTE_VARS: readonly string[] = [
  '--neutral-50',
  '--neutral-100',
  '--neutral-200',
  '--avatar-tint-rose',
];

function paletteFromCssVars(): string[] {
  const styles = getComputedStyle(document.documentElement);
  return AVATAR_PALETTE_VARS.map((name) => styles.getPropertyValue(name).trim().replace('#', ''));
}

function inkFromCssVar(): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--neutral-900')
    .trim()
    .replace('#', '');
}

/** FNV-1a 32-bit trên UTF-8 (hàm hash palette chuẩn của nhà, TYPE-AND-ICON §3.1). */
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Chuẩn hoá danh tính trước khi khoá seed: NFC + trim + gộp mọi dãy
 *  khoảng trắng thừa thành một dấu cách. Nhãn vai từ enum đã sạch sẵn,
 *  nhưng seed phải bất biến trước mọi biến thể biểu diễn của cùng một
 *  danh tính (chữ tổ hợp vs dựng sẵn, thừa khoảng trắng). */
export function normalizeIdentity(identity: string): string {
  return identity.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** Seed avatar theo DANH TÍNH người gửi (nhãn vai đã chuẩn hoá), không
 *  theo id bản ghi — xem ghi chú N5-4 ở đầu file. Namespace v2 tách hẳn
 *  khỏi v1 (v1 khoá theo id bản ghi). */
export function identitySeed(identity: string): string {
  return `dichbome:v2:identity:${normalizeIdentity(identity)}`;
}

/* Union types chép từ schema của @dicebear/personas 9.4.3 (lib/types.d.ts)
   — bản ghim cố định nên enum này không trôi; khớp với probe ĐK-D5. */
type PersonasHair =
  | 'long'
  | 'sideShave'
  | 'shortCombover'
  | 'curlyHighTop'
  | 'bobCut'
  | 'curly'
  | 'pigtails'
  | 'curlyBun'
  | 'buzzcut'
  | 'bobBangs'
  | 'bald'
  | 'balding'
  | 'cap'
  | 'bunUndercut'
  | 'fade'
  | 'beanie'
  | 'straightBun'
  | 'extraLong'
  | 'shortComboverChops'
  | 'mohawk';
type PersonasEyes = 'open' | 'sleep' | 'wink' | 'glasses' | 'happy' | 'sunglasses';
type PersonasMouth = 'smile' | 'frown' | 'surprise' | 'pacifier' | 'bigSmile' | 'smirk' | 'lips';
type PersonasNose = 'mediumRound' | 'smallRound' | 'wrinkles';

type PersonasConstraint = {
  hair: PersonasHair[];
  hairColor?: string[];
  nose?: PersonasNose[];
  eyes?: PersonasEyes[];
  mouth: PersonasMouth[];
  facialHairProbability: number;
};

/* ĐK-D5 (ràng buộc theo quan hệ) trên schema option của personas 9.4.3 —
   ĐÃ THỬ và ghi kết quả theo vai (chi tiết + bằng chứng ở V4-IMPL-LOG §6):
   personas KHÔNG có option giới/tuổi trực tiếp; ràng buộc làm được một
   cách CƠ HỌC TIN CẬY chỉ là (i) facialHairProbability: 0 (thư viện chỉ
   gắn râu khi prng.bool(probability) — probability 0 = không bao giờ) và
   (ii) thu hẹp mảng biến thể hair/nose/eyes/mouth (pickComponent chỉ chọn
   TRONG mảng được cấp). Tuổi được xấp xỉ cho vai thế hệ cha mẹ bằng
   hairColor xám-trắng 'dee1f5' (màu tóc sáng duy nhất trong palette mặc
   định của style) + nose 'wrinkles'. Các vai mà GIỚI hoặc THẾ HỆ không
   xác định được từ nhãn vai (Cả hai, Con, Anh/Chị, Em, Người yêu, Sếp,
   Đồng nghiệp, Bạn thân) KHÔNG áp được ràng buộc tin cậy → initials. */
const PERSONAS_BY_ROLE: Partial<Record<RelationRole, PersonasConstraint>> = {
  // Thế hệ mẹ (nữ lớn tuổi): tóc búi/bob xám-trắng, 0 râu, mũi có nếp.
  Mẹ: {
    hair: ['straightBun', 'curlyBun', 'bobCut'],
    hairColor: ['dee1f5'],
    nose: ['wrinkles', 'mediumRound'],
    eyes: ['open', 'glasses', 'happy'],
    mouth: ['smile', 'frown', 'smirk', 'lips'],
    facialHairProbability: 0,
  },
  'Mẹ chồng': {
    hair: ['straightBun', 'curlyBun', 'bobCut'],
    hairColor: ['dee1f5'],
    nose: ['wrinkles', 'mediumRound'],
    eyes: ['open', 'glasses', 'happy'],
    mouth: ['smile', 'frown', 'smirk', 'lips'],
    facialHairProbability: 0,
  },
  'Mẹ vợ': {
    hair: ['straightBun', 'curlyBun', 'bobCut'],
    hairColor: ['dee1f5'],
    nose: ['wrinkles', 'mediumRound'],
    eyes: ['open', 'glasses', 'happy'],
    mouth: ['smile', 'frown', 'smirk', 'lips'],
    facialHairProbability: 0,
  },
  // Thế hệ bố (nam lớn tuổi): tóc thưa/hói xám-trắng, mũi có nếp.
  Bố: {
    hair: ['balding', 'bald', 'shortCombover'],
    hairColor: ['dee1f5'],
    nose: ['wrinkles', 'mediumRound'],
    eyes: ['open', 'glasses'],
    mouth: ['smile', 'frown', 'smirk', 'bigSmile'],
    facialHairProbability: 25,
  },
  // Nữ trưởng thành trẻ: tóc dài/bob, 0 râu tuyệt đối.
  'Nàng dâu': {
    hair: ['long', 'extraLong', 'bobCut', 'bobBangs', 'curly', 'straightBun'],
    mouth: ['smile', 'frown', 'surprise', 'bigSmile', 'smirk', 'lips'],
    facialHairProbability: 0,
  },
  Vợ: {
    hair: ['long', 'extraLong', 'bobCut', 'bobBangs', 'curly', 'straightBun'],
    mouth: ['smile', 'frown', 'surprise', 'bigSmile', 'smirk', 'lips'],
    facialHairProbability: 0,
  },
  // Nam trưởng thành trẻ: tóc ngắn, miệng không lips/pacifier.
  Chồng: {
    hair: ['shortCombover', 'fade', 'buzzcut', 'curlyHighTop', 'bunUndercut'],
    mouth: ['smile', 'frown', 'surprise', 'bigSmile', 'smirk'],
    facialHairProbability: 25,
  },
  'Con rể': {
    hair: ['shortCombover', 'fade', 'buzzcut', 'curlyHighTop', 'bunUndercut'],
    mouth: ['smile', 'frown', 'surprise', 'bigSmile', 'smirk'],
    facialHairProbability: 25,
  },
};

const svgCache = new Map<string, string>();

type DicebearModule = {
  createAvatar: typeof import('@dicebear/core').createAvatar;
  personas: typeof import('@dicebear/personas');
  initials: typeof import('@dicebear/initials');
};

let dicebearPromise: Promise<DicebearModule> | null = null;
function loadDicebear(): Promise<DicebearModule> {
  // Import TỪNG style-package riêng (@dicebear/personas, @dicebear/initials)
  // thay vì qua @dicebear/collection: phép đo thật trên build của app cho
  // thấy Turbopack KHÔNG tree-shake dynamic import của collection — chunk
  // lười phình thành 676.571 B gzip chứa cả 30+ style (đúng con số hồ sơ
  // đã cảnh báo cho việc import cả collection). Hai style-package là cùng
  // một mã nguồn mà collection re-export; mọi gói DiceBear vẫn ghim đúng
  // 9.4.3 (core + collection vẫn khai ở package.json theo luật hồ sơ).
  dicebearPromise ??= (async () => {
    const [core, personas, initials] = await Promise.all([
      import('@dicebear/core'),
      import('@dicebear/personas'),
      import('@dicebear/initials'),
    ]);
    return { createAvatar: core.createAvatar, personas, initials };
  })();
  return dicebearPromise;
}

function stripMetadataAndHide(svg: string): string {
  // Như chiatien: DiceBear nhúng khối <metadata> RDF dài vào đầu SVG —
  // lột bỏ (hình/glyph/màu nằm ngoài khối đó) và gắn aria-hidden ở gốc
  // vì avatar là trang trí (nhãn chữ thật luôn đi kèm, TYPE-AND-ICON §3.4).
  return svg
    .replace(/<metadata[\s\S]*?<\/metadata>/, '')
    .replace(/<svg/, '<svg aria-hidden="true"');
}

export async function buildAvatarSvg(speaker: RelationRole): Promise<string> {
  const identity = normalizeIdentity(speaker);
  const seed = identitySeed(identity);
  const cacheKey = seed;
  const cached = svgCache.get(cacheKey);
  if (cached) return cached;
  const { createAvatar, personas, initials } = await loadDicebear();
  const palette = paletteFromCssVars();
  const background = palette[fnv1a(seed) % palette.length];
  const constraint = AVATAR_PERSONAS_ENABLED
    ? PERSONAS_BY_ROLE[identity as RelationRole]
    : undefined;
  let raw: string;
  if (constraint) {
    raw = createAvatar(personas, {
      seed,
      backgroundColor: [background],
      ...constraint,
    }).toString();
  } else {
    // initials: seed-glyph = nhãn vai đã chuẩn hoá. Vai một từ: ép chars 1
    // như chiatien (mặc định thư viện lấy 2 ký tự đầu của từ duy nhất).
    // Vai nhiều từ: glyph = chữ đầu của từ đầu + từ cuối theo mặc định
    // thư viện.
    const wordCount = identity.split(/\s+/).filter(Boolean).length;
    raw = createAvatar(initials, {
      seed: identity,
      backgroundColor: [background],
      textColor: [inkFromCssVar()],
      fontFamily: ['Be Vietnam Pro', 'sans-serif'],
      fontWeight: 700,
      fontSize: 46,
      ...(wordCount === 1 ? { chars: 1 } : {}),
    }).toString();
  }
  const svg = stripMetadataAndHide(raw);
  svgCache.set(cacheKey, svg);
  return svg;
}

/**
 * Avatar tròn cho một mục Đã lưu/Lịch sử. Trước khi chunk DiceBear tải
 * xong (hoặc khi tải lỗi), hiện đĩa trung tính mang chữ cái đầu của vai —
 * cùng kích thước, không nhảy layout; nhãn tên/vai dạng chữ thật luôn ở
 * cạnh avatar nên avatar không bao giờ là kênh định danh duy nhất.
 */
/**
 * Đĩa chữ cái người gửi cho các bề mặt CHAT của hướng «Chat» (sân khấu,
 * câu mẫu, hàng Bảng–Câu mẫu): đĩa đặc mực + chữ trắng, MỘT quy tắc duy
 * nhất cho mọi người gửi đang hoạt động (panel revote ghế 2+3: đĩa xám
 * nhạt đọc như bị vô hiệu hoá là lỗi). Đây KHÔNG phải DiceBear —
 * DiceBear (ContactAvatar ở trên) giữ nguyên vị trí ĐK-D4: chỉ hàng Đã
 * lưu + Lịch sử trong Board, kèm kill switch. Chữ = chữ cái đầu của
 * nhãn vai (quy tắc phân biệt duy nhất là chính chữ cái đó).
 */
export function SenderDisc({ speaker, size = 34 }: { speaker: RelationRole; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-canvas bg-ink font-bold text-canvas shadow-[0_0_0_1px_var(--neutral-300)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {speaker.charAt(0)}
    </span>
  );
}

export function ContactAvatar({ speaker, size = 36 }: { speaker: RelationRole; size?: number }) {
  const [svg, setSvg] = useState<string | null>(() => svgCache.get(identitySeed(speaker)) ?? null);
  useEffect(() => {
    let cancelled = false;
    buildAvatarSvg(speaker)
      .then((built) => {
        if (!cancelled) setSvg(built);
      })
      .catch(() => {
        // Tải chunk lỗi (mất mạng trước khi SW kịp cache): giữ đĩa chữ dự phòng.
      });
    return () => {
      cancelled = true;
    };
  }, [speaker]);

  if (!svg) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-bubble font-bold text-ink-2"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      >
        {speaker.charAt(0)}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 overflow-hidden rounded-full [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
