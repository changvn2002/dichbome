/**
 * Dịch Tiếng Bố Mẹ — engine rule-based tiếng Việt, deterministic, không gọi AI ngoài.
 * v2: dịch nhiều mối quan hệ (bố mẹ <-> con, thông gia, vợ chồng, người yêu, sếp...).
 * Engine chuẩn hoá bỏ dấu -> tra dictionary mẫu câu (ưu tiên rule gắn đúng vai người nhắn)
 * -> fallback theo vai/keyword/context -> cộng/trừ angerLevel theo dấu hiệu câu chữ.
 * Replies luôn là câu dành cho người dùng app đáp lại người nhắn.
 */

export type DichbomeSpeaker =
  | 'me'
  | 'bo'
  | 'both'
  | 'mom'
  | 'dad'
  | 'parents'
  | 'child'
  | 'mother-in-law'
  | 'mother-of-wife'
  | 'daughter-in-law'
  | 'son-in-law'
  | 'wife'
  | 'husband'
  | 'older-sibling'
  | 'younger-sibling'
  | 'lover'
  | 'boss'
  | 'coworker'
  | 'friend';

export type DichbomeContext =
  | 'tien'
  | 've-que'
  | 'cong-viec'
  | 'nguoi-yeu'
  | 'cuoi'
  | 'suc-khoe'
  | 'o-chung'
  | 'con-cai'
  | 'khac';

/** Gập alias mom/dad/parents về legacy me/bo/both để engine chỉ xử lý một bộ vai. */
export function canonicalSpeaker(speaker: DichbomeSpeaker): DichbomeSpeaker {
  if (speaker === 'mom') return 'me';
  if (speaker === 'dad') return 'bo';
  if (speaker === 'parents') return 'both';
  return speaker;
}

export interface DichbomeTranslateInput {
  message: string;
  speaker?: DichbomeSpeaker;
  context?: DichbomeContext;
}

export interface DichbomeReply {
  label: string;
  text: string;
}

export interface DichbomeTranslateResult {
  meaning: string;
  realWant: string;
  angerLevel: number;
  dangerLabel: string;
  replies: DichbomeReply[];
  warning?: string;
}

export interface DichbomeExample {
  message: string;
  speaker: DichbomeSpeaker;
  context: DichbomeContext;
  tease: string;
}

export const DICHBOME_REPLY_LABELS = ['Ngoan nhất', 'Khéo nhất', 'An toàn nhất'] as const;

export const DICHBOME_EXAMPLES: DichbomeExample[] = [
  {
    message: 'Tùy con',
    speaker: 'me',
    context: 'khac',
    tease: 'Hiểu câu này là "được tự quyết" thì xác định...',
  },
  {
    message: 'Mẹ không buồn đâu, con cứ đi đi',
    speaker: 'me',
    context: 've-que',
    tease: 'Tin là không buồn thật là toang đấy',
  },
  {
    message: 'Ăn cơm chưa?',
    speaker: 'me',
    context: 'suc-khoe',
    tease: 'Không phải hỏi chuyện cơm đâu',
  },
  {
    message: 'Bao giờ thì về?',
    speaker: 'both',
    context: 've-que',
    tease: 'Hỏi lịch về nhưng ý ở đằng sau khác hẳn',
  },
  {
    message: 'Con nhà người ta...',
    speaker: 'bo',
    context: 'cong-viec',
    tease: 'Nhân vật quốc dân không bao giờ lộ diện',
  },
  {
    message: 'Tiền bạc không quan trọng',
    speaker: 'bo',
    context: 'tien',
    tease: 'Quan trọng là câu nói tiếp ngay sau câu này',
  },
  {
    message: 'Mẹ không sao đâu, hơi mệt tí thôi',
    speaker: 'me',
    context: 'suc-khoe',
    tease: '"Hơi mệt tí" của mẹ thường không "tí" chút nào',
  },
  {
    message: 'Con cứ làm đi, bố mẹ già rồi biết gì',
    speaker: 'both',
    context: 'cong-viec',
    tease: 'Nghe câu này là phải ngồi xuống ngay',
  },
  {
    message: 'Con bận, để sau đi mẹ',
    speaker: 'child',
    context: 'con-cai',
    tease: 'Bố mẹ nên đáp sao để con đỡ áp lực?',
  },
  {
    message: 'Để đấy mẹ làm cho, con cứ nghỉ đi',
    speaker: 'mother-in-law',
    context: 'o-chung',
    tease: 'Thương thật hay đang thử nàng dâu?',
  },
  {
    message: 'Dạ để con làm ạ, con sao cũng được',
    speaker: 'daughter-in-law',
    context: 'o-chung',
    tease: 'Mẹ chồng dịch xem dâu đang mệt hay đang ngại',
  },
  {
    message: 'Em không sao, anh tự hiểu đi',
    speaker: 'wife',
    context: 'khac',
    tease: 'Tin là không sao thật thì nguy',
  },
  {
    message: 'Ừ để anh, em quyết đi cũng được',
    speaker: 'husband',
    context: 'khac',
    tease: 'Chồng nói ngắn là muốn vợ hỏi rõ điều gì?',
  },
  {
    message: 'Em xem lại nhé, cái này đơn giản mà',
    speaker: 'boss',
    context: 'cong-viec',
    tease: '"Đơn giản" của sếp là đơn giản cỡ nào?',
  },
  {
    message: 'Em không giận đâu, anh bận thì thôi',
    speaker: 'lover',
    context: 'nguoi-yeu',
    tease: '"Không giận đâu" bản người yêu đáng sợ hơn bản gốc',
  },
];

/** Bỏ dấu + thường hoá để match không phụ thuộc cách gõ của người dùng. */
export function normalizeVi(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasWord(norm: string, word: string): boolean {
  return ` ${norm} `.includes(` ${word} `);
}

function hasAnyPhrase(norm: string, phrases: string[]): boolean {
  return phrases.some((p) => norm.includes(p));
}

/**
 * Đại từ theo vai người nhắn (đã canonical).
 * p = cách người đáp gọi người nhắn; s/S = cách người đáp tự xưng.
 */
const ADDRESSES: Partial<Record<DichbomeSpeaker, { p: string; s: string }>> = {
  me: { p: 'mẹ', s: 'con' },
  bo: { p: 'bố', s: 'con' },
  both: { p: 'bố mẹ', s: 'con' },
  child: { p: 'con', s: 'bố mẹ' },
  'mother-in-law': { p: 'mẹ', s: 'con' },
  'mother-of-wife': { p: 'mẹ', s: 'con' },
  'daughter-in-law': { p: 'con', s: 'mẹ' },
  'son-in-law': { p: 'con', s: 'bố mẹ' },
  wife: { p: 'em', s: 'anh' },
  husband: { p: 'anh', s: 'em' },
  'older-sibling': { p: 'anh/chị', s: 'em' },
  'younger-sibling': { p: 'em', s: 'anh/chị' },
  lover: { p: 'em', s: 'anh' },
  boss: { p: 'sếp', s: 'em' },
  coworker: { p: 'bạn', s: 'mình' },
  friend: { p: 'bạn', s: 'mình' },
};

function fill(template: string, speaker: DichbomeSpeaker): string {
  const addr = ADDRESSES[speaker] ?? { p: 'mẹ', s: 'con' };
  const cap = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
  return template
    .replaceAll('{P}', cap(addr.p))
    .replaceAll('{p}', addr.p)
    .replaceAll('{S}', cap(addr.s))
    .replaceAll('{s}', addr.s);
}

function dangerLabelFor(angerLevel: number): string {
  if (angerLevel >= 80) return 'Báo động đỏ — nói một đằng, lòng một nẻo';
  if (angerLevel >= 60) return 'Giận ngầm — cần hạ nhiệt sớm';
  if (angerLevel >= 40) return 'Hơi cấn — đáp khéo là qua';
  if (angerLevel >= 20) return 'Chủ yếu là quan tâm, giận chỉ một ít';
  return 'An toàn — thương là chính';
}

/** Cộng điểm giận theo dấu hiệu bề mặt: nói ngược, gắt chữ, "thôi", lửng lơ "...". */
function adjustAnger(base: number, raw: string, norm: string): number {
  let level = base;
  if (raw.includes('!')) level += 6;
  if (raw.includes('...')) level += 4;
  const letters = raw.replace(/[^A-Za-zÀ-ỹ]/g, '');
  if (letters.length >= 4 && letters === letters.toUpperCase()) level += 8;
  if (hasWord(norm, 'thoi')) level += 4; // "thôi" hay đi kèm giọng dỗi
  if (norm.includes('cu di') || norm.includes('cu lam')) level += 6; // "cứ đi đi" = thả cho đi nhưng lòng không thả
  return Math.max(0, Math.min(100, Math.round(level)));
}

interface EntryDef {
  id: string;
  patterns: string[];
  /** Nếu khai báo: rule chỉ áp dụng cho các vai này (đã canonical). Không khai = mọi vai. */
  speakers?: DichbomeSpeaker[];
  /** true = so khớp toàn bộ câu (cho câu siêu ngắn kiểu "Ừ"). */
  exact?: boolean;
  meaning: string;
  realWant: string;
  /** Điểm giận gốc 0-100 trước khi cộng dấu hiệu bề mặt. */
  anger: number;
  warning?: string;
  /** Đúng 3 câu trả lời mẫu, thứ tự: Ngoan nhất / Khéo nhất / An toàn nhất. Dùng {p} = mẹ/bố/bố mẹ. */
  replies: [string, string, string];
}

// Thứ tự quan trọng: mẫu cụ thể đặt trước mẫu chung (vd "không buồn" trước "không sao").
// Rule gắn speakers được matchEntry ưu tiên trước rule chung khi vai trùng.
const ENTRIES: EntryDef[] = [
  // ----- Con (bố mẹ dịch con) -----
  {
    id: 'con-ban',
    speakers: ['child'],
    patterns: ['con ban', 'dang ban lam', 'ban lam a', 'ban qua', 'con dang ban'],
    meaning:
      'Con nói "con bận" thường là đang quá tải thật hoặc sợ mở lời lại thêm việc phải lo — không phải từ chối bố mẹ. Đây là tín hiệu cần giảm áp lực, không cần thêm kỳ vọng.',
    realWant:
      'Con cần được thông cảm và một lối thoát nhẹ nhàng để tự quay lại khi rảnh, thay vì bị trách hay giục thêm.',
    anger: 25,
    replies: [
      'Ừ con cứ lo việc của con đi, không sao đâu. Rảnh lúc nào nhắn lại cho bố mẹ một tiếng là được.',
      'Nhà mình vẫn ổn, con đừng lo. Con nhớ ăn uống tử tế, đừng gắng quá sức nhé.',
      'Thôi con làm đi, tối về tới nhà thì gọi bố mẹ một lúc, nói vài câu thôi cũng được.',
    ],
  },
  {
    id: 'con-de-sau',
    speakers: ['child'],
    patterns: ['de sau di', 'de con sau', 'luc khac di', 'de mai di', 'de khi khac'],
    meaning:
      '"Để sau đi" của con thường là né vì chưa biết trả lời sao, hoặc đang dồn việc. Càng giục lúc này con càng lảng xa hơn.',
    realWant:
      'Con cần một mốc cụ thể mà nhẹ nhàng để quay lại câu chuyện, thay vì bị ép trả lời ngay.',
    anger: 38,
    replies: [
      'Ừ để sau cũng được con. Vậy tối nay hoặc mai con rảnh lúc nào, nhà mình nói tiếp lúc đó nhé.',
      'Không gấp đâu con. Chuyện này để khi nào con thoải mái mình hẵng bàn, bố mẹ chờ được.',
      'Con cứ nói thật là đang kẹt ở đâu, bố mẹ giúp được gì thì giúp, không thì cùng nhau tính.',
    ],
  },
  {
    id: 'con-on-ma',
    speakers: ['child'],
    patterns: ['con on ma', 'con on', 'on ma me', 'on ma bo', 'con khong sao dau'],
    meaning:
      'Con nói "con ổn mà" hay là ổn kiểu gắng gượng: sợ bố mẹ lo nên giấu mệt, giấu áp lực. Càng nói tỉnh càng nên hỏi thêm một câu.',
    realWant:
      'Con muốn bố mẹ tin mình tự lo được, nhưng vẫn muốn được hỏi han thêm và biết nhà luôn là chỗ dựa.',
    anger: 22,
    replies: [
      'Ổn thật không con? Có gì mệt cứ nói với bố mẹ, nhà mình là chỗ để con dựa mà.',
      'Bố mẹ tin con lo được. Nhưng mệt quá thì nghỉ, đừng gắng một mình rồi đổ bệnh ra đấy.',
      'Để bố mẹ gửi con ít đồ ăn nhé. Nhận cho bố mẹ vui, con khỏi phải từ chối.',
    ],
  },
  {
    id: 'con-mai-goi',
    speakers: ['child'],
    patterns: [
      'mai con goi',
      'de mai con goi',
      'ranh con goi',
      'luc nao con goi lai',
      'con goi lai sau',
    ],
    meaning:
      '"Mai con gọi" không có giờ cụ thể thì mai dễ trôi luôn. Thường không phải vô tâm — con mệt và sợ cuộc gọi kéo dài.',
    realWant:
      'Con cần một lời hẹn ngắn và rõ: gọi mấy giờ, nói bao lâu. Bố mẹ chốt giúp thì con dễ làm theo hơn.',
    anger: 20,
    replies: [
      'Ừ mai con gọi nhé. Vậy mai tầm 8 giờ tối con gọi, nhà mình nói 10 phút thôi cũng được.',
      'Được rồi, mai con gọi lại cho bố mẹ. Giờ con nghỉ đi, mai nói chuyện tiếp.',
      'Mai gọi thật đấy nhé. Bố mẹ chờ điện thoại của con, gọi trễ chút cũng không sao.',
    ],
  },
  // ----- Mẹ chồng / Mẹ vợ -----
  {
    id: 'me-chong-de-day-lam',
    speakers: ['mother-in-law', 'mother-of-wife'],
    patterns: [
      'de day me lam cho',
      'de me lam cho',
      'cu de day me',
      'me lam cho nhanh',
      'de do me lam',
    ],
    meaning:
      '"Để đấy {p} làm cho" phần nhiều là thương con, phần còn lại là {p} quen tay việc nhà và muốn việc theo ý nhà mình. Chưa phải giận — nhưng ngồi nghỉ luôn cả buổi là mất điểm khéo.',
    realWant:
      '{P} muốn được tôn trọng kinh nghiệm việc nhà và muốn con cùng làm để học nếp nhà, hơn là để con nghỉ hẳn.',
    anger: 25,
    replies: [
      'Dạ con cảm ơn {p}. {P} chỉ con cách nhà mình hay làm, con làm cùng {p} cho quen tay ạ.',
      'Vậy {p} làm phần này, con phụ {p} phần kia nhé. Hai mẹ con làm chung cho nhanh ạ.',
      'Hôm nay để con làm chính, {p} ngồi chỉ con thôi. Con sai đâu {p} sửa đấy ạ.',
    ],
  },
  {
    id: 'nha-minh-xua-nay',
    speakers: ['mother-in-law', 'mother-of-wife'],
    patterns: [
      'xua nay van the',
      'nha minh van the',
      'nha minh tu xua',
      'tu truoc den gio nha minh',
      'nha minh van lam the',
    ],
    meaning:
      '"Nhà mình xưa nay vẫn thế" là {p} đang giữ nếp nhà: không hẳn cấm thay đổi, mà muốn cách mới tôn trọng lệ cũ và người lớn trong nhà.',
    realWant:
      '{P} muốn được hỏi ý trước và muốn con công nhận nếp nhà trước khi đề xuất cách khác.',
    anger: 55,
    warning:
      'Đừng nói "thời buổi này ai làm thế nữa" — câu đó chạm đúng điều người lớn giữ gìn nhất.',
    replies: [
      'Dạ con hiểu nếp nhà mình rồi ạ. Con giữ cách cũ của nhà, chỉ xin thêm một chút này cho tiện hơn, {p} xem có được không ạ.',
      'Chuyện này con chưa dám quyết, {p} thấy làm theo cách nhà mình từ trước là hợp nhất phải không ạ?',
      'Dạ con theo nhà mình ạ. Có gì con chưa biết, {p} cứ chỉ con, con sửa dần ạ.',
    ],
  },
  {
    id: 'me-chong-cu-nghi-di',
    speakers: ['mother-in-law', 'mother-of-wife'],
    patterns: ['con cu nghi di', 'cu nghi di con', 'nghi di con', 'con nghi di de me'],
    meaning:
      '"Con cứ nghỉ đi" thường là {p} thương thật khi thấy con mệt. Nhưng nghỉ luôn cả buổi thì mất điểm — {p} vẫn mong con để ý xung quanh một chút.',
    realWant: '{P} muốn con nghỉ ngơi nhưng vẫn có mặt cùng nhà, chứ không biến mất hẳn.',
    anger: 20,
    replies: [
      'Dạ con cảm ơn {p}, con nghỉ một lát rồi con ra phụ {p} tiếp ạ.',
      'Con nghỉ cũng được, mà {p} cũng đừng làm một mình. Việc nặng {p} để phần con nhé ạ.',
      'Dạ, vậy con ngồi đây với {p}, {p} làm gì con phụ tay luôn cho vui ạ.',
    ],
  },
  // ----- Nàng dâu / Con rể -----
  {
    id: 'dau-da-de-con-lam',
    speakers: ['daughter-in-law', 'son-in-law'],
    patterns: ['da de con lam', 'de con lam a', 'con lam duoc a', 'de con lam cho'],
    meaning:
      '"Dạ để con làm" rất nhanh và ngoan — nhưng thường kèm mệt hoặc ngại từ chối. Con dâu/con rể sợ bị đánh giá nên nhận việc trước, sức tính sau.',
    realWant:
      'Con cần được chia bớt việc và nghe rõ câu "mệt thì nghỉ" để yên tâm nghỉ thật khi cần.',
    anger: 35,
    replies: [
      'Ừ con làm phần này giúp nhà, phần còn lại để {s} lo. Làm chung cho nhanh, mệt thì cứ nghỉ con nhé.',
      'Con làm được nhà biết rồi. Hôm nay con mệt thì cứ ngồi nghỉ, việc này để nhà lo.',
      'Cảm ơn con. Con chu đáo thế này là nhà mình mừng rồi, đừng gắng quá sức nhé.',
    ],
  },
  {
    id: 'dau-sao-cung-duoc',
    speakers: ['daughter-in-law', 'son-in-law'],
    patterns: [
      'con sao cung duoc',
      'con the nao cung duoc',
      'me quyet di a',
      'bo quyet di a',
      'con theo y nha minh',
    ],
    meaning:
      '"Con sao cũng được" ở vai dâu/rể hiếm khi là không có ý kiến — là ngại nói vì sợ trái ý nhà. Ép "nói đi" con càng thu lại.',
    realWant: 'Con cần được người lớn chủ động mời ý kiến và đảm bảo nói ra sẽ không bị để bụng.',
    anger: 38,
    replies: [
      'Nhà hỏi thật ý con đấy. Con cứ nói cách nào tiện cho con, nhà mình tính theo cả ý con nữa.',
      'Vậy phần này con quyết giúp nhà nhé. Con chọn sao nhà mình theo vậy.',
      'Con về nhà này là người nhà rồi, có ý gì cứ nói thẳng, không ai để bụng đâu con.',
    ],
  },
  // ----- Vợ / Người yêu -----
  {
    id: 'vo-em-khong-sao',
    speakers: ['wife'],
    patterns: ['em khong sao', 'em khong sao dau', 'khong sao dau anh'],
    meaning:
      'Khác với "không sao" của mẹ, "em không sao" của vợ thường là đang dỗi hoặc tủi thân và muốn chồng tự nhận ra. Tin ngay rồi quay đi là điểm trừ lớn nhất.',
    realWant:
      'Muốn {s} dừng lại, hỏi han và ở cạnh một lúc. Cần được lắng nghe trước, giải pháp tính sau.',
    anger: 82,
    warning: 'Đừng đáp "ừ không sao thì tốt" rồi đi chỗ khác — mức dỗi sẽ nhân đôi.',
    replies: [
      '{S} không tin là {p} không sao đâu. Lại đây, {p} nói {s} nghe, {s} nghe hết không cãi đâu.',
      'Chắc {s} lại vô tâm chuyện gì rồi. {P} cứ nói thẳng, {s} sửa ngay.',
      'Thôi để {s} pha cho {p} ly nước, ngồi xuống nói chuyện với {s} một lúc đã.',
    ],
  },
  {
    id: 'vo-anh-tu-hieu',
    speakers: ['wife', 'lover'],
    patterns: ['anh tu hieu di', 'tu ma hieu', 'anh tu biet di', 'tu hieu di anh'],
    meaning:
      '"Anh tự hiểu đi" là bài kiểm tra không có đáp án in sẵn: đối phương cho rằng chuyện đã quá rõ, nhắc lại lần nữa thì mất hay. Đoán sai còn tệ hơn không đoán.',
    realWant:
      'Muốn {s} tự nhớ lại mình đã quên/hứa/sai điều gì và chủ động sửa trước khi bị nhắc thẳng.',
    anger: 80,
    replies: [
      '{S} biết {s} sai ở đâu rồi. Cho {s} xin lỗi trước, rồi {p} nói thêm cho chắc chắn nhé.',
      '{S} đang nghĩ lại đây. {P} gợi ý cho {s} một ý thôi, {s} sửa ngay không để nhắc lần hai.',
      'Thôi {s} chịu thua, tự hiểu không nổi thật. {P} nói {s} nghe, đổi lại {s} mời {p} bữa ngon.',
    ],
  },
  {
    id: 'vo-tuy-anh',
    speakers: ['wife', 'lover'],
    patterns: ['tuy anh', 'anh quyet di', 'tuy anh day', 'anh muon lam gi thi lam'],
    meaning:
      '"Tùy anh" trong chuyện vợ chồng/người yêu ít khi là trao quyền thật — thường là đã góp ý vài lần không được nghe nên buông cho đối phương tự chịu trách nhiệm.',
    realWant:
      'Muốn được hỏi lại ý kiến nghiêm túc, hoặc được cùng chọn chứ không phải quyết hộ rồi báo sau.',
    anger: 65,
    replies: [
      '{S} không quyết một mình đâu. {P} thấy cách nào hợp hơn, mình bàn lại một phút rồi chốt.',
      'Vậy {s} theo ý {p} lần này. {P} chọn đi, {s} làm theo.',
      'Nghe "tùy anh" là {s} biết {p} chưa ưng rồi. Mình nói lại từ đầu nhé.',
    ],
  },
  {
    id: 'ny-khong-gian',
    speakers: ['lover'],
    patterns: ['em khong gian dau', 'khong gian dau ma', 'co gian dau', 'anh khong gian dau'],
    meaning:
      '"Em không giận đâu" kèm "anh bận thì thôi" là giận kiểu rút lui: không làm ầm lên nhưng đang tự hạ kỳ vọng xuống. Để yên là khoảng cách xa dần.',
    realWant:
      'Muốn được ưu tiên lại cụ thể: một lời hẹn bù, một tin nhắn tử tế — không phải câu "thôi đừng giận nữa".',
    anger: 68,
    replies: [
      '{S} biết {p} giận chứ. Tối nay {s} bù: qua đón {p} đi ăn món {p} thích, không điện thoại việc nữa.',
      '{S} xin lỗi vì để {p} phải nói câu này. Lần sau {s} báo trước, không để {p} chờ.',
      'Giờ {s} đang kẹt thật, nhưng 9 giờ {s} gọi {p} nói chuyện đàng hoàng. {P} chờ {s} nhé.',
    ],
  },
  {
    id: 'ny-ban-thi-thoi',
    speakers: ['lover', 'wife'],
    patterns: ['anh ban thi thoi', 'ban thi thoi', 'em ban thi thoi', 'ban qua thi thoi'],
    meaning:
      '"Bận thì thôi" là câu rút lui kinh điển: ngoài mặt nhường nhịn, trong lòng đang tính điểm trừ cho mỗi lần bị xếp sau công việc.',
    realWant:
      'Muốn một mốc cụ thể được ưu tiên lại và một lời khẳng định mình quan trọng — không phải hứa chung chung.',
    anger: 62,
    replies: [
      'Không "thôi" được. {S} xong việc lúc 8 giờ, 8 giờ gọi {p} ngay. Chuyện này không để trôi nữa.',
      '{P} không phải lựa chọn thứ hai đâu. {S} kẹt một lúc thôi, xong là dành thời gian cho {p}.',
      '{S} xin lỗi để {p} phải nói vậy. Cuối tuần này mình đi chơi, {s} tắt thông báo công việc.',
    ],
  },
  // ----- Chồng -----
  {
    id: 'chong-u-de-anh',
    speakers: ['husband'],
    patterns: ['u de anh', 'de anh lam', 'de anh lo', 'ok de anh', 'u de anh lam'],
    meaning:
      '"Ừ để anh" của chồng thường là đồng ý cho yên chuyện trước, kế hoạch cụ thể chưa có. Không phải lười — quen nhận việc bằng miệng rồi tính sau.',
    realWant:
      'Muốn {p} yên tâm và đừng giục thêm lúc này. Nhưng để việc thành thật cần chốt thêm thời điểm.',
    anger: 20,
    replies: [
      'Ừ {p} làm giúp {s} nhé. {P} tính làm lúc nào để {s} khỏi phải nhắc nữa?',
      'Vậy {s} giao {p} phần này nhé. Xong {p} nhắn {s} một tiếng là được.',
      '{P} làm phần này thôi đúng không, phần còn lại {s} lo. Mình chia vậy cho rõ nhé {p}.',
    ],
  },
  {
    id: 'chong-em-quyet-di',
    speakers: ['husband'],
    patterns: ['em quyet di', 'tuy em', 'em muon sao cung duoc', 'em thay sao thi lam vay'],
    meaning:
      '"Em quyết đi" đa phần là chồng thật sự không để tâm chuyện này, hoặc tránh tranh luận. Hiếm khi là bẫy — nhưng quyết xong mà chê là chuyện khác hẳn.',
    realWant:
      'Muốn {p} chốt nhanh cho xong việc và không khí nhẹ nhàng. Chỉ cần chốt lại: đã giao quyền thì tôn trọng kết quả.',
    anger: 22,
    replies: [
      'Vậy {s} quyết nhé. {P} đã giao {s} thì {s} chọn cách này, {p} ủng hộ {s} là được.',
      '{S} quyết cũng được, {p} chỉ cần nói {s} nghe {p} thích phương án nào hơn trong hai cái này thôi.',
      'Rồi, vụ này {s} làm chủ. {P} phụ {s} phần nặng tay chân nhé.',
    ],
  },
  // ----- Sếp -----
  {
    id: 'sep-xem-lai-nhe',
    speakers: ['boss'],
    patterns: [
      'em xem lai nhe',
      'xem lai nhe em',
      'em xem lai di',
      'coi lai nhe em',
      'xem lai cho anh',
      'xem lai cho chi',
    ],
    meaning:
      '"Em xem lại nhé" của sếp dịch thẳng là: bản này chưa đạt, sửa đi. Sếp nói nhẹ để giữ thể diện cho cả hai, nhưng kỳ vọng là sửa thật, không phải xem qua loa.',
    realWant:
      'Muốn nhân viên chủ động rà lại, sửa điểm yếu và báo mốc hoàn thành — sếp không muốn chỉ tay từng lỗi.',
    anger: 45,
    replies: [
      'Dạ em cảm ơn sếp. Em rà lại toàn bộ và gửi bản chỉnh sửa trước cuối ngày ạ. Sếp có điểm nào muốn em ưu tiên không ạ?',
      'Dạ em xem lại ngay ạ. Em tập trung vào phần số liệu và kết luận trước, sếp xem hướng đó ổn chưa ạ?',
      'Dạ em nhận ạ. Em sửa xong em báo lại kèm danh sách điểm đã chỉnh để sếp dễ kiểm tra.',
    ],
  },
  {
    id: 'sep-don-gian-ma',
    speakers: ['boss'],
    patterns: ['cai nay don gian ma', 'don gian ma em', 'co gi kho dau', 'viec nay de ma'],
    meaning:
      '"Cái này đơn giản mà" thường là sếp đánh giá thấp độ khó, hoặc muốn giao việc nhanh. Nhận ngay không chốt phạm vi là dễ ôm việc quá sức và trễ hẹn.',
    realWant:
      'Muốn nhân viên nhận việc sẵn sàng, nhưng vẫn cần chốt lại đầu việc và thời hạn cho chắc.',
    anger: 48,
    warning:
      'Đừng cãi "không đơn giản đâu sếp" — chốt phạm vi và mốc nháp là cách bảo vệ mình khéo nhất.',
    replies: [
      'Dạ em nhận ạ. Em xác nhận lại: đầu việc gồm những phần này, hạn là ngày này — đúng ý sếp chưa ạ?',
      'Dạ em làm được ạ. Có một phần cần thêm dữ liệu từ phòng khác, em báo trước để sếp nắm tiến độ.',
      'Dạ em bắt tay ngay ạ. Em gửi trước bản nháp vào mốc này để sếp xem hướng, tránh sửa muộn.',
    ],
  },
  {
    id: 'sep-khi-nao-xong',
    speakers: ['boss'],
    patterns: [
      'khi nao xong vay em',
      'bao gio xong',
      'khi nao thi xong',
      'sap xong chua em',
      'may gio xong',
    ],
    meaning:
      '"Khi nào xong vậy em?" là sếp đang sốt ruột hoặc có việc phụ thuộc vào kết quả này. Trả lời "dạ sắp" là đáp án nguy hiểm nhất.',
    realWant: 'Muốn một mốc giờ/ngày cụ thể và biết ngay nếu có nguy cơ trễ để sếp còn xoay xở.',
    anger: 60,
    replies: [
      'Dạ em chốt 16 giờ hôm nay em gửi sếp ạ. Hiện em xong khoảng 70%, phần còn lại là rà soát cuối.',
      'Dạ em báo thật: mốc cũ hơi căng vì đang chờ dữ liệu. Em đề xuất gửi trước phần chính hôm nay, phần còn lại sáng mai ạ.',
      'Dạ em cập nhật tiến độ mỗi 2 giờ cho sếp tới khi xong ạ, sếp khỏi phải hỏi lại.',
    ],
  },
  {
    id: 'tuy-con',
    patterns: [
      'tuy con',
      'tuy em',
      'tuy may',
      'the nao cung duoc',
      'sao cung duoc',
      'tuy con quyet dinh',
    ],
    meaning:
      "'Tùy con' nghe như cho tự quyết, nhưng đa phần {p} đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý {p} đang nghĩ không.",
    realWant:
      'Muốn con chọn phương án {p} thấy yên tâm nhất, hoặc ít nhất ngồi xuống bàn thêm một câu trước khi quyết — chứ không phải quyết xong rồi mới báo lại.',
    anger: 62,
    warning:
      "Nghe 'tùy' mà quyết luôn trong 5 giây rồi thông báo lại là rất dễ ăn dỗi dài hạn. Hỏi thêm đúng một câu là hạ nhiệt được kha khá.",
    replies: [
      'Dạ, con cũng đang phân vân. Theo {p} thì cách nào hợp hơn ạ? {P} góp ý cho con rồi con quyết.',
      'Dạ con cảm ơn {p}. Con đang tính thế này, {p} nghe thử xem có ổn không, thiếu gì {p} bảo con.',
      'Dạ chuyện này con chưa quyết vội đâu. Tối con gọi về, cả nhà mình bàn kỹ rồi con mới làm ạ.',
    ],
  },
  {
    id: 'khong-buon',
    patterns: [
      'khong buon dau',
      'khong buon',
      'co buon gi dau',
      'buon gi dau',
      'me khong buon',
      'bo khong buon',
    ],
    meaning:
      "Càng khẳng định 'không buồn' thì càng là đang buồn. {P} nói vậy để con khỏi khó xử thôi, chứ trong lòng tủi thân rõ ràng — câu nói ngược kinh điển của phụ huynh Việt.",
    realWant:
      "Muốn con ở lại thêm một lúc, hoặc hứa một dịp cụ thể sẽ về bù. Điều {p} sợ nhất là câu 'hôm nào con về' mà không có ngày tháng.",
    anger: 78,
    warning:
      "Tin là 'không buồn thật' rồi đi luôn thì chuyện này sẽ được nhắc lại vào một dịp không ngờ tới. Ở lại thêm 30 phút thôi cũng khác hẳn.",
    replies: [
      'Thôi, con ở lại với {p} thêm chút nữa. Con đi muộn một tí cũng không sao đâu ạ.',
      'Con biết {p} nói vậy cho con yên tâm thôi. Cuối tháng này con sắp xếp về hẳn một ngày với {p} nhé.',
      'Dạ lần này con phải đi thật, nhưng con hứa cuối tuần con gọi video với {p}. Con nhớ {p} nhiều.',
    ],
  },
  {
    id: 'gia-roi',
    patterns: ['gia roi biet gi', 'gia roi', 'biet gi dau', 'con hon bo me', 'bo me gia roi'],
    meaning:
      'Câu này nghe như buông xuôi nhưng thực ra là tự ái. {P} thấy ý kiến của mình không được coi trọng nên rút lui bằng một câu rất nhẹ mà rất đau.',
    realWant:
      'Muốn con lắng nghe và coi trọng kinh nghiệm của {p} một chút. Không cần làm theo hết, chỉ cần đừng gạt đi ngay.',
    anger: 72,
    warning:
      'Đây là lúc không nên tranh luận đúng sai nữa. Ngồi xuống nghe cho hết đã, chuyện tính sau.',
    replies: [
      'Ơ, {p} nói thế con buồn đấy. Chuyện này {p} có kinh nghiệm hơn con nhiều, {p} chỉ cho con với.',
      'Dạ con xin lỗi, nãy con nói nhanh quá. Ý {p} là nên làm thế nào ạ, con nghe đây.',
      'Dạ, vậy để con kể lại đầu đuôi cho {p} nghe, rồi {p} thấy sao thì bảo con.',
    ],
  },
  {
    id: 'khong-sao',
    patterns: [
      'khong sao dau',
      'khong sao',
      'co sao dau',
      'cha sao',
      'khong viec gi',
      'khong co gi dau',
    ],
    meaning:
      "'Không sao đâu' là câu cửa miệng khi có sao mà không muốn nói. {P} sợ con lo, sợ con tốn công nên gói hết vào hai chữ 'không sao' — nghe càng thản nhiên càng nên hỏi lại.",
    realWant:
      "Muốn con hỏi thêm một câu nữa và để ý một chút, chứ đừng tin ngay rồi thôi. Nhiều khi chỉ cần con quan tâm là 'sao' tự hết một nửa.",
    anger: 70,
    warning:
      "Câu này trả lời 'dạ vâng' rồi bỏ qua là dễ bỏ lỡ tín hiệu nhất. Hỏi lại đúng một câu 'thật không ạ?' là biết ngay.",
    replies: [
      'Thật không ạ? {P} kể con nghe đi, có gì con lo cùng {p}.',
      'Dạ, {p} cứ nói thật với con. Con lớn rồi, chuyện gì con cũng nghe được ạ.',
      'Vậy để con gọi về nói chuyện với {p} một lúc nhé, nghe giọng {p} con mới yên tâm.',
    ],
  },
  {
    id: 'khong-can-tien',
    patterns: [
      'khong can gui tien',
      'dung gui tien',
      'khong can gui',
      'giu tien ma',
      'bo me con du',
      'me con du',
    ],
    meaning:
      'Nói không cần tiền thường là sợ con tốn kém, chứ ít khi là không cần thật. {P} hay tính phần thiệt về mình: con còn phải lo nhà cửa, ăn uống, đủ thứ trên vai.',
    realWant:
      'Muốn con giữ tiền lo cho bản thân, nhưng trong lòng vẫn rất vui nếu con nhớ tới. Quan trọng là tấm lòng, số tiền xếp sau.',
    anger: 25,
    replies: [
      'Dạ, con gửi ít thôi, {p} cầm mua gì ngon ngon ăn nhé. Con lo được, {p} đừng lo cho con.',
      'Tiền này là con biếu {p}, không phải tiền để dành đâu ạ. {P} nhận cho con vui.',
      'Dạ vậy tháng này con không gửi tiền, con gửi đồ về cho {p} nhé. {P} thích ăn gì con mua.',
    ],
  },
  {
    id: 'tien-khong-quan-trong',
    patterns: [
      'tien bac khong quan trong',
      'tien khong quan trong',
      'tien bac gi nua',
      'tien nong gi',
    ],
    meaning:
      "'Tiền bạc không quan trọng' mới là câu mở đầu — câu quan trọng nằm ngay sau đó, thường là chuyện tình cảm, thời gian hoặc sự có mặt của con. Nghe hết câu mới hiểu được ý {p}.",
    realWant:
      'Muốn con hiểu là {p} cần con về mặt tình cảm hơn vật chất: một cuộc gọi, một bữa cơm, một lần về nhà đúng hẹn.',
    anger: 35,
    replies: [
      'Dạ con hiểu ạ. Tiền thì con lo được, quan trọng là con phải dành thời gian cho {p} nhiều hơn.',
      'Dạ, vậy cuối tuần này con về ăn cơm với {p} nhé, lâu rồi nhà mình chưa ngồi với nhau.',
      'Con cảm ơn {p}. Có gì {p} cứ nói thẳng với con, con sửa được ạ.',
    ],
  },
  {
    id: 'con-nha-nguoi-ta',
    patterns: ['con nha nguoi ta', 'con nha hang xom', 'nguoi ta bang tuoi', 'nhin nguoi ta'],
    meaning:
      "'Con nhà người ta' là nhân vật quốc dân không bao giờ lộ diện nhưng thành tích thì vô địch. Đây là cách {p} so sánh để thúc con cố gắng, dù biết nói ra con sẽ khó chịu.",
    realWant:
      'Muốn con có động lực phấn đấu và cho {p} một tin vui để yên tâm — không nhất thiết phải bằng người ta, chỉ cần thấy con đang tiến lên.',
    anger: 55,
    warning:
      "Đừng bật lại bằng cách kể khuyết điểm của 'con nhà người ta'. Khoe một tiến bộ nhỏ của mình là dập được bài này ngay.",
    replies: [
      'Dạ, con cũng đang cố đây ạ. Tháng này con mới được giao thêm việc, để con làm tốt rồi con khoe {p}.',
      "Hì, 'con nhà người ta' giỏi thật, mà con của {p} cũng đang cố từng ngày đây ạ.",
      'Dạ con biết {p} lo cho con. Con có kế hoạch rồi, để con làm dần cho {p} yên tâm.',
    ],
  },
  {
    id: 'bao-gio-ve',
    patterns: [
      'bao gio thi ve',
      'bao gio ve',
      'khi nao ve',
      'may gio ve',
      'sap ve chua',
      've chua con',
      'bao gio moi ve',
    ],
    meaning:
      "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — {p} muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
    realWant:
      "Muốn một mốc thời gian cụ thể để chuẩn bị cơm nước, dọn phòng, và kể với hàng xóm là 'con tôi sắp về'.",
    anger: 30,
    replies: [
      'Dạ, cuối tháng này con về ạ. Con đặt vé xong con báo {p} ngay.',
      'Chắc khoảng 2 tuần nữa con về được. Về con ở nhà mấy hôm với {p} luôn.',
      'Dạ để con xin nghỉ phép rồi con báo ngày chắc chắn cho {p}. Con cũng nhớ nhà lắm.',
    ],
  },
  {
    id: 'an-com-chua',
    patterns: [
      'an com chua',
      'an com gi chua',
      'an uong gi chua',
      'an gi chua',
      'an chua con',
      'an chua',
      'com nuoc the nao',
    ],
    meaning:
      "'Ăn cơm chưa?' rất ít khi chỉ là chuyện cơm. Đó là cách {p} kiểm tra hôm nay con có ổn không, có tự lo cho bản thân không — quan tâm nhưng gói trong chuyện ăn uống.",
    realWant:
      'Muốn biết con ăn uống đàng hoàng và tiện thể nghe giọng con một lúc. Trả lời qua loa một chữ là {p} lại lo thêm.',
    anger: 8,
    replies: [
      'Dạ con ăn rồi ạ, hôm nay con ăn cơm với cá kho. {P} ăn chưa, nay nhà mình ăn gì ạ?',
      'Dạ con vừa ăn xong. Để con gọi video, con khoe bữa cơm của con cho {p} xem.',
      'Dạ con chưa ăn, giờ con đi ăn đây. {P} nhắc là con thấy đói luôn.',
    ],
  },
  {
    id: 'ngan-gon',
    exact: true,
    patterns: ['u', 'uh', 'um', 'o', 'da', 'vang', 'biet roi'],
    meaning:
      'Một chữ mà nặng cả buổi tối. Trả lời càng ngắn thì trong đầu {p} càng nhiều chuyện — thường là đang không vui nhưng chưa muốn nói, hoặc đang chờ con tự nhận ra điều gì đó.',
    realWant: "Muốn con tinh ý hỏi thêm một câu, chứ đừng thấy 'ừ' là tưởng mọi chuyện đã xong.",
    anger: 58,
    warning:
      'Đừng đáp lại bằng một chữ tương tự. Hai bên mỗi người một chữ là cuộc trò chuyện đi vào ngõ cụt.',
    replies: [
      'Dạ, {p} sao thế ạ? Có chuyện gì {p} kể con nghe đi.',
      'Nghe giọng {p} hình như đang không vui. Con làm gì sai {p} cứ nói thẳng với con.',
      'Dạ, để con gọi lại cho {p} nói chuyện đàng hoàng nhé.',
    ],
  },
];

type FallbackCategory =
  'tien' | 've-que' | 'suc-khoe' | 'tinh-cam' | 'cong-viec' | 'quan-tam' | 'chung';

interface CategoryDef {
  meaning: string;
  realWant: string;
  anger: number;
  warning?: string;
  replies: [string, string, string];
}

const FALLBACKS: Record<FallbackCategory, CategoryDef> = {
  tien: {
    meaning:
      'Nhắc tới tiền mà nói vòng vo là {p} đang ngại mở lời. Phụ huynh rất ít khi nói thẳng chuyện tiền, thường chờ con tự hiểu và chủ động trước.',
    realWant:
      'Muốn con chủ động quan tâm chuyện tiền nong trong nhà, để {p} khỏi phải mở miệng — với {p}, mở miệng xin con là điều khó nhất.',
    anger: 38,
    replies: [
      'Dạ, chuyện tiền {p} cứ để con lo. Tháng này con gửi về một ít, {p} cầm chi tiêu nhé.',
      'Dạ con cảm ơn {p} lo cho con. Con vẫn ổn, {p} đừng dè sẻn quá với bản thân.',
      'Để con tính lại rồi con báo {p}. Có gì thiếu {p} cứ nói với con, đừng giấu.',
    ],
  },
  've-que': {
    meaning:
      'Chuyện về quê, về nhà mà được nhắc tới là {p} đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
    realWant:
      'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để {p} có cái mà đợi.',
    anger: 32,
    replies: [
      'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho {p} sớm.',
      'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với {p}.',
      'Giờ con chưa về được, nhưng con gọi video với {p} mỗi tối nhé.',
    ],
  },
  'suc-khoe': {
    meaning:
      'Chuyện sức khỏe mà {p} nói nhẹ đi thì phải nghe ngược lại. Phụ huynh hay giấu bệnh vì sợ con lo và sợ tốn tiền đi khám.',
    realWant: 'Muốn con hỏi kỹ và quan tâm thật, chứ không phải nghe qua loa rồi yên tâm luôn.',
    anger: 24,
    warning:
      'Riêng sức khỏe thì đừng dịch vui nữa — gọi hỏi kỹ triệu chứng, hoặc sắp xếp về xem tận mắt cho chắc.',
    replies: [
      'Dạ, {p} nói thật với con đi, đau ở đâu, lâu chưa? Con đặt lịch khám cho {p} nhé.',
      'Để con gọi về hỏi kỹ. Chuyện này không để "kệ nó tự khỏi" được đâu ạ.',
      'Dạ, cuối tuần con về đưa {p} đi khám. {P} đừng lo chuyện tiền, có con đây.',
    ],
  },
  'tinh-cam': {
    meaning:
      'Chuyện người yêu, cưới xin mà {p} nhắc khéo là đang sốt ruột thay con, nhưng sợ nói thẳng thì con áp lực nên cứ bóng gió mãi.',
    realWant:
      'Muốn biết con có tính chuyện lâu dài chưa để {p} yên tâm, và muốn được con chia sẻ như người trong nhà chứ không phải người ngoài.',
    anger: 42,
    replies: [
      'Dạ, chuyện này con có tính rồi ạ. Khi nào chắc chắn con thưa chuyện với {p} đầu tiên.',
      'Con biết {p} lo cho con. {P} cứ yên tâm, con không để {p} phải nhắc mãi đâu.',
      'Dạ, để con kể {p} nghe từ từ. {P} nghe xong cho con ý kiến nhé.',
    ],
  },
  'cong-viec': {
    meaning:
      'Hỏi chuyện công việc là cách {p} đo xem con ở ngoài kia có ổn không. Công việc ổn thì {p} mới ngủ ngon được.',
    realWant:
      'Muốn nghe con kể thật chuyện đi làm — vui buồn gì cũng được, miễn là còn chia sẻ với {p}.',
    anger: 28,
    replies: [
      'Dạ công việc con vẫn ổn ạ. Dạo này con đang làm một việc mới, để con kể {p} nghe.',
      'Có hơi bận một chút nhưng con lo được. {P} đừng lo, con vẫn ăn ngủ đàng hoàng.',
      'Dạ, cảm ơn {p} hỏi. Cuối tuần con gọi về kể {p} nghe kỹ hơn nhé.',
    ],
  },
  'quan-tam': {
    meaning:
      'Câu hỏi kiểu này thường là nhớ con nên tìm cớ bắt chuyện. Chuyện ăn uống chỉ là mở đầu, cái {p} muốn là nghe giọng con lâu hơn một chút.',
    realWant: 'Muốn trò chuyện với con thêm vài câu và biết chắc con đang tự lo cho mình ổn.',
    anger: 12,
    replies: [
      'Dạ con ổn ạ. {P} nay thế nào, ăn uống có ngon miệng không ạ?',
      'Dạ, để con gọi video cho {p} luôn, nói chuyện thế này không đã.',
      'Con cảm ơn {p}. {P} giữ gìn sức khỏe nhé, con gọi về thường xuyên mà.',
    ],
  },
  chung: {
    meaning:
      'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. {P} hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
    realWant:
      'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với {p}, được con để ý là đã vui rồi.',
    anger: 30,
    replies: [
      'Dạ, {p} nói vậy là còn chuyện gì nữa không ạ? {P} kể con nghe đi.',
      'Con cảm ơn {p}. Có gì {p} cứ nói thẳng với con, con nghe hết ạ.',
      'Dạ, để con gọi về nói chuyện với {p} kỹ hơn nhé.',
    ],
  },
};

/** Fallback theo keyword trong câu; không thấy thì dùng context người dùng chọn. */
function detectCategory(norm: string): FallbackCategory | null {
  if (
    hasAnyPhrase(norm, ['gui tien', 'tien bac', 'tien nong']) ||
    hasWord(norm, 'tien') ||
    hasWord(norm, 'luong')
  ) {
    return 'tien';
  }
  if (
    hasAnyPhrase(norm, ['ve que', 've nha', 've tham', 'an tet', 've tet']) ||
    hasWord(norm, 'tet') ||
    hasWord(norm, 'gio')
  ) {
    return 've-que';
  }
  if (
    hasWord(norm, 'met') ||
    hasWord(norm, 'om') ||
    hasWord(norm, 'benh') ||
    hasWord(norm, 'khoe') ||
    hasAnyPhrase(norm, ['vao vien', 'di kham', 'suc khoe', 'dau om'])
  ) {
    return 'suc-khoe';
  }
  if (
    hasWord(norm, 'cuoi') ||
    hasWord(norm, 'vo') ||
    hasWord(norm, 'chong') ||
    hasAnyPhrase(norm, ['nguoi yeu', 'ban gai', 'ban trai', 'lay vo', 'lay chong', 'ra mat'])
  ) {
    return 'tinh-cam';
  }
  if (
    hasAnyPhrase(norm, ['cong viec', 'di lam', 'lam them']) ||
    hasWord(norm, 'viec') ||
    hasWord(norm, 'sep')
  ) {
    return 'cong-viec';
  }
  if (hasWord(norm, 'com') || hasWord(norm, 'an') || hasWord(norm, 'doi')) {
    return 'quan-tam';
  }
  return null;
}

function categoryFromContext(context: DichbomeContext): FallbackCategory {
  switch (context) {
    case 'tien':
      return 'tien';
    case 've-que':
      return 've-que';
    case 'suc-khoe':
      return 'suc-khoe';
    case 'nguoi-yeu':
    case 'cuoi':
      return 'tinh-cam';
    case 'cong-viec':
      return 'cong-viec';
    default:
      return 'chung';
  }
}

/** Fallback theo vai khi không khớp từ điển — replies vẫn đúng người đáp của từng quan hệ. */
const SPEAKER_FALLBACKS: Partial<Record<DichbomeSpeaker, CategoryDef>> = {
  child: {
    meaning:
      'Con nói ngắn thế này thường là đang mệt hoặc chưa sẵn sàng nói sâu. Bố mẹ đáp dài và nặng lúc này là con càng thu mình lại.',
    realWant: 'Con cần một câu hỏi mở, nhẹ, được quyền trả lời lúc khác mà vẫn thấy nhà luôn ở đó.',
    anger: 22,
    replies: [
      'Ừ con cứ từ từ, khi nào muốn nói thì nói với bố mẹ. Nhà mình không giục con đâu.',
      'Con có mệt không? Mệt thì nghỉ đi, chuyện này để lúc khác mình nói.',
      'Để lúc nào rảnh bố mẹ gọi con, nói vài câu thôi cho đỡ nhớ.',
    ],
  },
  'daughter-in-law': {
    meaning:
      'Con dâu nói ngắn và ngoan thế này thường là đang giữ kẽ: ngại từ chối, ngại trái ý nhà chồng. Người lớn nên chủ động nới lỏng thay vì hỏi dồn.',
    realWant: 'Con cần được chia việc, được hỏi ý thật và yên tâm là nói thật sẽ không bị để bụng.',
    anger: 35,
    replies: [
      'Con cứ nói thật ý con nhé, nhà mình tính sao cho cả nhà cùng thoải mái.',
      'Việc này mình chia nhau làm cho nhẹ con ạ, con đừng ôm hết một mình.',
      'Cảm ơn con đã để ý nhà mình. Có gì chưa quen con cứ hỏi, không ai trách đâu.',
    ],
  },
  'son-in-law': {
    meaning:
      'Con rể nói ngắn và ngoan thế này thường là đang giữ kẽ: ngại từ chối, ngại trái ý nhà vợ. Người lớn nên chủ động nới lỏng thay vì hỏi dồn.',
    realWant: 'Con cần được chia việc, được hỏi ý thật và yên tâm là nói thật sẽ không bị để bụng.',
    anger: 35,
    replies: [
      'Con cứ nói thật ý con nhé, nhà mình tính sao cho cả nhà cùng thoải mái.',
      'Việc này mình chia nhau làm cho nhẹ con ạ, con đừng ôm hết một mình.',
      'Cảm ơn con đã để ý nhà mình. Có gì chưa quen con cứ hỏi, không ai trách đâu.',
    ],
  },
  'mother-in-law': {
    meaning:
      'Mẹ chồng nói ngắn thường là đang giữ nếp hoặc thử xem con có để ý không. Đáp tôn trọng và xin chỉ dẫn trước là an toàn nhất.',
    realWant: '{P} muốn được tôn trọng kinh nghiệm và được con hỏi ý trước khi làm khác đi.',
    anger: 40,
    replies: [
      'Dạ chuyện này con nghe {p} ạ. {P} chỉ con cách làm cho đúng ý nhà mình nhé.',
      'Con chưa rõ phần này, {p} thấy nên làm thế nào thì con làm theo ạ.',
      'Dạ con cảm ơn {p} đã nhắc. Lần sau con để ý hơn, {p} cứ nói thẳng với con ạ.',
    ],
  },
  'mother-of-wife': {
    meaning:
      'Mẹ vợ nói ngắn thường là đang giữ nếp hoặc thử xem con có để ý không. Đáp tôn trọng và xin chỉ dẫn trước là an toàn nhất.',
    realWant: '{P} muốn được tôn trọng kinh nghiệm và được con hỏi ý trước khi làm khác đi.',
    anger: 40,
    replies: [
      'Dạ chuyện này con nghe {p} ạ. {P} chỉ con cách làm cho đúng ý nhà mình nhé.',
      'Con chưa rõ phần này, {p} thấy nên làm thế nào thì con làm theo ạ.',
      'Dạ con cảm ơn {p} đã nhắc. Lần sau con để ý hơn, {p} cứ nói thẳng với con ạ.',
    ],
  },
  wife: {
    meaning:
      'Vợ nói ngắn trong chuyện tình cảm thường là đang cần được quan tâm, không cần tranh luận đúng sai ngay lúc này.',
    realWant:
      'Muốn {s} dừng lại lắng nghe, xác nhận cảm xúc của mình trước khi bàn cách giải quyết.',
    anger: 45,
    replies: [
      '{S} nghe {p} nói hết đã. {P} cứ nói thật, {s} không cãi đâu.',
      '{S} biết chuyện này làm {p} khó chịu rồi. Mình ngồi xuống nói cho rõ nhé.',
      'Giờ {p} muốn {s} làm gì nhất? {P} nói thẳng, {s} làm theo.',
    ],
  },
  husband: {
    meaning:
      'Chồng nói ngắn trong chuyện tình cảm thường là đang tránh tranh luận hoặc thật sự không để tâm chi tiết này — cần hỏi rõ một câu là biết.',
    realWant:
      'Muốn {s} chốt lại nhu cầu cụ thể thay vì đoán, để mình đáp ứng đúng thay vì làm cho có.',
    anger: 35,
    replies: [
      '{S} nói rõ giúp {s} một câu: phần nào quan trọng nhất với {p} lúc này?',
      'Ừ {s} hiểu rồi. Vậy mình chốt làm theo cách này nhé {p}, khỏi bàn đi bàn lại.',
      '{P} cứ nói thẳng điều {p} cần, {s} làm theo luôn cho nhanh.',
    ],
  },
  lover: {
    meaning:
      'Người yêu nói ngắn thường là đang cần được quan tâm, không cần tranh luận đúng sai ngay lúc này.',
    realWant:
      'Muốn {s} dừng lại lắng nghe, xác nhận cảm xúc của mình trước khi bàn cách giải quyết.',
    anger: 45,
    replies: [
      '{S} nghe {p} nói hết đã. {P} cứ nói thật, {s} không cãi đâu.',
      '{S} biết chuyện này làm {p} khó chịu rồi. Mình ngồi xuống nói cho rõ nhé.',
      'Giờ {p} muốn {s} làm gì nhất? {P} nói thẳng, {s} làm theo.',
    ],
  },
  boss: {
    meaning:
      'Tin nhắn công việc của sếp nói gọn thường ẩn kỳ vọng về tiến độ hoặc chất lượng. Cách đáp an toàn nhất là xác nhận đầu việc và mốc thời gian cụ thể.',
    realWant: 'Muốn nhân viên xác nhận đã hiểu việc, chốt mốc hoàn thành và chủ động báo tiến độ.',
    anger: 40,
    replies: [
      'Dạ em nhận thông tin ạ. Em xác nhận lại đầu việc và báo mốc hoàn thành cụ thể ngay sau đây.',
      'Dạ phần này em đang xử lý, em cập nhật tiến độ vào cuối buổi để sếp nắm ạ.',
      'Dạ cho em xác nhận lại một điểm này để làm đúng ngay từ đầu, tránh sửa lại ạ.',
    ],
  },
  coworker: {
    meaning:
      'Đồng nghiệp nhắn gọn về công việc thường là đang cần xác nhận tiến độ để phối hợp tiếp, không hẳn là giục.',
    realWant: 'Muốn một mốc cụ thể và một đầu mối rõ ràng để hai bên không chờ nhau.',
    anger: 30,
    replies: [
      'Mình nhận thông tin rồi nhé. Mình xác nhận lại mốc này và báo bạn ngay khi xong.',
      'Phần này mình đang làm, mình cập nhật tiến độ cuối buổi cho bạn nhé.',
      'Cho mình hỏi rõ một điểm này để hai bên làm khớp nhau từ đầu nhé.',
    ],
  },
  friend: {
    meaning:
      'Bạn thân nói cụt thường là đang bận hoặc có chuyện chưa muốn kể. Hỏi dồn lúc này chỉ làm bạn lảng thêm.',
    realWant: 'Muốn được để yên một lúc nhưng vẫn biết luôn có người hỏi han khi cần.',
    anger: 20,
    replies: [
      'Ừ có gì thì nói mình nghe nhé, lúc nào cũng được, không cần trả lời ngay đâu.',
      'Nghe là biết đang có chuyện rồi. Cần gì cứ nhắn, mình qua ngay.',
      'Thôi nghỉ đi một lát, khi nào thoải mái hơn mình nói tiếp.',
    ],
  },
  'older-sibling': {
    meaning:
      'Anh/chị nói cụt thường là đang bận hoặc có chuyện chưa muốn kể. Hỏi dồn lúc này chỉ làm người ta lảng thêm.',
    realWant: 'Muốn được để yên một lúc nhưng vẫn biết em luôn ở đó khi cần.',
    anger: 22,
    replies: [
      'Dạ có gì {p} cứ nói em nghe nhé, lúc nào cũng được ạ.',
      'Nghe là biết {p} đang có chuyện rồi. Cần gì {p} cứ nhắn em.',
      'Thôi {p} nghỉ đi một lát, khi nào thoải mái hơn mình nói tiếp ạ.',
    ],
  },
  'younger-sibling': {
    meaning:
      'Em nói cụt thường là đang bận hoặc có chuyện chưa muốn kể với anh/chị. Hỏi dồn lúc này chỉ làm em lảng thêm.',
    realWant: 'Muốn được để yên một lúc nhưng vẫn biết anh/chị luôn ở đó khi cần.',
    anger: 22,
    replies: [
      'Ừ có gì thì nói với nhà nhé, lúc nào cũng được, không cần trả lời ngay đâu.',
      'Nghe là biết đang có chuyện rồi. Cần gì cứ nhắn, nhà qua ngay.',
      'Thôi nghỉ đi một lát, khi nào thoải mái hơn mình nói tiếp.',
    ],
  },
};

const PARENT_SPEAKERS: DichbomeSpeaker[] = ['me', 'bo', 'both'];

function matchEntry(norm: string, speaker: DichbomeSpeaker): EntryDef | null {
  // Câu siêu ngắn ("Ừ") phải so khớp toàn câu trước, tránh nuốt nhầm câu dài.
  const exact = ENTRIES.find((e) => e.exact && e.patterns.includes(norm));
  if (exact) return exact;
  const matched = ENTRIES.filter((e) => !e.exact && e.patterns.some((p) => norm.includes(p)));
  // Ưu tiên rule gắn đúng vai (vd "không sao" của Vợ) trước rule chung mọi vai.
  return (
    matched.find((e) => e.speakers?.includes(speaker)) ?? matched.find((e) => !e.speakers) ?? null
  );
}

/**
 * Metadata phân loại cho tầng trung thực (redesign-v2) — KHÔNG đổi thuật toán dịch.
 * Tái dùng đúng đường matchEntry/canonicalSpeaker của translateDichbome:
 * khớp entry -> 'entry', ngược lại -> 'fallback'.
 */
export function classifyDichbomeInput(input: DichbomeTranslateInput): {
  matchKind: 'entry' | 'fallback';
  roleSpecific: boolean;
} {
  const speaker = canonicalSpeaker(input.speaker ?? 'me');
  const norm = normalizeVi((input.message ?? '').trim());
  const entry = norm ? matchEntry(norm, speaker) : null;
  if (!entry) return { matchKind: 'fallback', roleSpecific: false };
  return { matchKind: 'entry', roleSpecific: entry.speakers?.includes(speaker) ?? false };
}

/** Trích patterns của ENTRIES cho snapshot phía client (exact mặc định false nếu không khai). */
export function getEntryPatterns(): Array<{ patterns: string[]; exact: boolean }> {
  return ENTRIES.map((e) => ({ patterns: [...e.patterns], exact: e.exact ?? false }));
}

/** Nhãn hoàn cảnh khớp chữ UI phía client, để output nhắc đúng hoàn cảnh người dùng đã chọn. */
const CONTEXT_LABELS: Record<DichbomeContext, string> = {
  tien: 'Xin tiền',
  've-que': 'Về quê',
  'cong-viec': 'Công việc',
  'nguoi-yeu': 'Người yêu',
  cuoi: 'Cưới hỏi',
  'suc-khoe': 'Sức khoẻ',
  'o-chung': 'Ở chung',
  'con-cai': 'Con cái',
  khac: 'Khác',
};

/**
 * M-2 (Panel #02): tin từ mốc này mới coi là "tin dài" để xét độ sâu ở đường
 * mẫu chung. Panel #03 (§10.2) chứng minh dải 30–60 ký tự nuốt chi tiết 100%
 * (ca 43 ký tự cho kết quả giống stub 6/6) → hạ ngưỡng 50 → 30 cho đường
 * ENTRY CHUNG ĐÃ KHỚP (fix wave 4); đường fallback thuần giữ mốc 80
 * (GENERIC_LIMIT_MIN_MESSAGE) — lý do ở khối độ sâu trong translateDichbome.
 */
const GENERIC_DEPTH_MIN_MESSAGE = 30;
/** Tin rất dài mà vẫn không tách được chi tiết riêng: khai báo giới hạn ngay trong Ý thật. */
const GENERIC_LIMIT_MIN_MESSAGE = 80;

const ALL_ENTRY_PATTERNS: string[] = ENTRIES.flatMap((e) => e.patterns);

/** Cắt chi tiết quá dài ở biên từ (giữ nguyên quy tắc bản Panel #02). */
function trimDetail(segment: string): string {
  if (segment.length <= 90) return segment;
  const cut = segment.slice(0, 90);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * Trích tối đa HAI chi tiết riêng nổi bật từ chính tin nhắn, trích nguyên
 * văn — không bịa thêm nội dung:
 * - một đoạn con "đủ riêng" = dài ≥ 15 ký tự và còn ≥ 4 từ riêng sau khi gỡ
 *   các mẫu ĐÃ KHỚP (mẫu của entry đang xét; đường fallback gỡ mọi mẫu).
 *   Gỡ theo entry đã khớp là điểm chốt của Panel #03 §10.2: «Tối nay con
 *   bận» từng bị mẫu 'con ban' của MỘT ENTRY KHÁC ăn mất 2/4 từ nên rơi
 *   khỏi ngưỡng và bị nuốt 100% ở ca 43 ký tự.
 * - chi tiết thứ nhất = đoạn đủ riêng dài nhất; chi tiết thứ hai = đoạn đủ
 *   riêng CUỐI CÙNG trong tin (khác đoạn thứ nhất) — vế kết thường là vế
 *   đau nhất («khỏi cần về ăn cơm với mẹ đâu»), bản Panel #02 chỉ trích
 *   một chi tiết nên mất hẳn vế này (bao phủ 1/2).
 */
function extractSalientDetails(
  raw: string,
  stripPatterns: readonly string[],
): { first: string | null; second: string | null } {
  const segments = raw
    .split(/[.!?…;]+/)
    .flatMap((part) => part.split(','))
    .map((s) =>
      s
        .trim()
        .replace(/^["'“”‘’«»]+|["'“”‘’«»]+$/g, '')
        .trim(),
    )
    .filter(Boolean);
  const qualified: Array<{ segment: string; index: number }> = [];
  segments.forEach((segment, index) => {
    if (segment.length < 15) return;
    let residual = normalizeVi(segment);
    for (const pattern of stripPatterns) residual = residual.split(pattern).join(' ');
    const residualWords = residual.split(/\s+/).filter(Boolean);
    if (residualWords.length < 4) return;
    qualified.push({ segment, index });
  });
  if (qualified.length === 0) return { first: null, second: null };
  const longest = qualified.reduce((a, b) => (b.segment.length > a.segment.length ? b : a));
  const rest = qualified.filter((q) => q.index !== longest.index);
  const secondPick = rest.length > 0 ? rest[rest.length - 1] : null;
  return {
    first: trimDetail(longest.segment),
    second: secondPick ? trimDetail(secondPick.segment) : null,
  };
}

/**
 * Engine dịch rule-based (port nguyên logic từ Nest module
 * `server/src/products/dichbome/dichbome.service.ts` của repo gốc ChangtoTech —
 * bản standalone bỏ NestJS, route handlers của Next gọi trực tiếp 2 hàm này).
 */
export function translateDichbome(input: DichbomeTranslateInput): DichbomeTranslateResult {
  // Validation ở tầng engine (KI-VAL-1, fix wave 3): engine tự chặn message
  // quá 500 ký tự — cùng giới hạn route khai (handler trả 400 trước khi gọi
  // engine, nhưng engine không còn phụ thuộc route để giữ contract).
  if ((input.message ?? '').length > 500) {
    throw new Error('message must be shorter than or equal to 500 characters');
  }
  const speaker = canonicalSpeaker(input.speaker ?? 'me');
  const context = input.context ?? 'khac';
  const raw = (input.message ?? '').trim();
  const norm = normalizeVi(raw);

  const entry = norm ? matchEntry(norm, speaker) : null;
  // Vai ngoài bố mẹ: ưu tiên fallback theo vai; bố mẹ giữ fallback keyword/context cũ.
  const speakerFallback = PARENT_SPEAKERS.includes(speaker)
    ? undefined
    : SPEAKER_FALLBACKS[speaker];
  const def: EntryDef | CategoryDef =
    entry ?? speakerFallback ?? FALLBACKS[detectCategory(norm) ?? categoryFromContext(context)];

  const angerLevel = adjustAnger(def.anger, raw, norm);
  const result: DichbomeTranslateResult = {
    meaning: fill(def.meaning, speaker),
    realWant: fill(def.realWant, speaker),
    angerLevel,
    dangerLabel: dangerLabelFor(angerLevel),
    replies: def.replies.map((text, i) => ({
      label: DICHBOME_REPLY_LABELS[i],
      text: fill(text, speaker),
    })),
    ...(def.warning ? { warning: fill(def.warning, speaker) } : {}),
  };

  // M-2 (Panel #02, D-3): độ sâu cho tin ở đường MẪU CHUNG.
  // Chỉ áp dụng khi kết quả đến từ entry chung (không gắn vai) hoặc fallback —
  // entry gắn đúng vai giữ nguyên từng byte (corpus vàng khoá ở tests/golden-corpus-parents).
  // Tin ngắn/điển hình cũng giữ nguyên: chỉ tin từ 30 ký tự (Panel #03 §10.2,
  // xem GENERIC_DEPTH_MIN_MESSAGE) mới được bổ sung (a) hoàn cảnh đã chọn và
  // (b) tối đa HAI chi tiết riêng trích nguyên văn từ chính tin — vế thứ hai
  // vào Ý thật + câu trả lời thứ hai, kèm câu lý do mức (điều kiện R3 của
  // Panel #03: dòng mức không được identical ca leo thang mà không có lý do).
  // Phân loại tier (chip "Khớp câu mẫu chung") nằm ở classifyDichbomeInput — không đổi.
  // Ngưỡng theo loại đường (Panel #03 §10.2, fix wave 4): entry chung đã
  // khớp → 30 ký tự; fallback thuần (không entry nào khớp) → 80. Corpus
  // vàng khoá nguyên văn các fallback 31–48 ký tự DẠNG MỘT Ý — ở đó toàn
  // bộ tin đã là nội dung category đọc, "chi tiết riêng" trích ra chỉ là
  // cả tin tự trích chính nó; từ 80 ký tự fallback mới có cấu trúc nhiều
  // vế tách bạch (ca khoá ở tests/generic-depth).
  const isGenericPath = entry ? !entry.speakers : true;
  const depthMin = entry ? GENERIC_DEPTH_MIN_MESSAGE : GENERIC_LIMIT_MIN_MESSAGE;
  if (isGenericPath && raw.length >= depthMin) {
    const { first: detail, second: detail2 } = extractSalientDetails(
      raw,
      entry ? entry.patterns : ALL_ENTRY_PATTERNS,
    );
    const contextLabel = CONTEXT_LABELS[context];
    if (detail) {
      result.meaning += ` Chi tiết riêng trong tin này: “${detail}”.`;
      if (context !== 'khac') {
        result.meaning += ` Tin thuộc hoàn cảnh “${contextLabel}” bạn đã chọn, nên phần cần đáp lại là chi tiết riêng đó trong đúng hoàn cảnh này, không chỉ là câu mẫu chung.`;
        result.realWant += ` Khi đáp, nhắc thẳng tới chi tiết “${detail}” và chốt một hướng cụ thể thuộc hoàn cảnh ${contextLabel}, thay vì trả lời chung chung.`;
      } else {
        result.realWant += ` Khi đáp, nhắc thẳng tới chi tiết “${detail}” và chốt một hướng cụ thể, thay vì trả lời chung chung.`;
      }
      result.replies[0] = {
        ...result.replies[0],
        text:
          result.replies[0].text +
          fill(` Riêng chuyện “${detail}”, {s} sẽ nói rõ thêm với {p} cho chắc.`, speaker),
      };
      if (detail2) {
        result.meaning += ` Tin còn một vế riêng nữa: “${detail2}”. Mức căng thẳng chấm theo vế chính của câu — vế riêng là chi tiết cá nhân, app nhắc lại để bạn đáp cho trúng chứ không tính vào mức.`;
        result.replies[1] = {
          ...result.replies[1],
          text:
            result.replies[1].text +
            fill(` Riêng chuyện “${detail2}”, {s} sẽ nói rõ thêm với {p} cho chắc.`, speaker),
        };
      }
    } else if (raw.length >= GENERIC_LIMIT_MIN_MESSAGE) {
      // Không tách được chi tiết riêng: nói rõ giới hạn ngay trong Ý thật thay vì
      // để phiếu trông như một bản đọc riêng đầy đủ.
      result.meaning +=
        context !== 'khac'
          ? ` Tin này dài nhưng app chưa tách được chi tiết riêng nào ngoài mẫu chung ở hoàn cảnh “${contextLabel}” bạn đã chọn, nên phần đọc trên chỉ chắc ở mức mẫu chung cho hoàn cảnh đó.`
          : ' Tin này dài nhưng app chưa tách được chi tiết riêng nào ngoài mẫu chung, nên phần đọc trên chỉ chắc ở mức mẫu chung.';
    }
  }
  return result;
}

export function getDichbomeExamples(): DichbomeExample[] {
  return DICHBOME_EXAMPLES;
}
