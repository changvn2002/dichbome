/**
 * Rule-based "dịch tiếng nhà mình" engine — bản local chạy trên máy, dùng cho chế độ offline.
 * Phản chiếu đúng contract server: POST /api/products/dichbome/translate.
 * v2: dịch được nhiều mối quan hệ (bố mẹ <-> con, thông gia, vợ chồng, người yêu, sếp...).
 * Nguyên tắc: replies LUÔN là câu dành cho người đang dùng app đáp lại người nhắn.
 * Engine không dùng AI: chuẩn hoá bỏ dấu rồi khớp câu cửa miệng theo từng vai.
 */

export type RelationRole =
  | 'Mẹ'
  | 'Bố'
  | 'Cả hai'
  | 'Con'
  | 'Mẹ chồng'
  | 'Mẹ vợ'
  | 'Nàng dâu'
  | 'Con rể'
  | 'Vợ'
  | 'Chồng'
  | 'Anh/Chị'
  | 'Em'
  | 'Người yêu'
  | 'Sếp'
  | 'Đồng nghiệp'
  | 'Bạn thân';

/** Alias cũ: trước đây app chỉ dịch bố mẹ, nay ParentSpeaker chính là RelationRole. */
export type ParentSpeaker = RelationRole;

export type ParentContext =
  | 'Xin tiền'
  | 'Về quê'
  | 'Công việc'
  | 'Người yêu'
  | 'Cưới hỏi'
  | 'Sức khoẻ'
  | 'Ở chung'
  | 'Con cái'
  | 'Khác';

export const RELATION_ROLES: RelationRole[] = [
  'Mẹ',
  'Bố',
  'Cả hai',
  'Con',
  'Mẹ chồng',
  'Mẹ vợ',
  'Nàng dâu',
  'Con rể',
  'Vợ',
  'Chồng',
  'Anh/Chị',
  'Em',
  'Người yêu',
  'Sếp',
  'Đồng nghiệp',
  'Bạn thân',
];

export const RELATION_GROUPS: Array<{ label: string; roles: RelationRole[] }> = [
  { label: 'Bố mẹ & con', roles: ['Mẹ', 'Bố', 'Cả hai', 'Con'] },
  { label: 'Thông gia', roles: ['Mẹ chồng', 'Mẹ vợ', 'Nàng dâu', 'Con rể'] },
  { label: 'Vợ chồng & người yêu', roles: ['Vợ', 'Chồng', 'Người yêu'] },
  { label: 'Anh em & bạn', roles: ['Anh/Chị', 'Em', 'Bạn thân'] },
  { label: 'Công việc', roles: ['Sếp', 'Đồng nghiệp'] },
];

/** Tên cũ giữ cho app.tsx hiện tại; nay chứa toàn bộ vai như RELATION_ROLES. */
export const PARENT_SPEAKERS: ParentSpeaker[] = RELATION_ROLES;

export const PARENT_CONTEXTS: ParentContext[] = [
  'Xin tiền',
  'Về quê',
  'Công việc',
  'Người yêu',
  'Cưới hỏi',
  'Sức khoẻ',
  'Ở chung',
  'Con cái',
  'Khác',
];

export type TranslationReply = { label: string; text: string };

export type TranslateResult = {
  meaning: string;
  realWant: string;
  /** 0 = không giận chút nào, 5 = bão cấp cuối. */
  angerLevel: number;
  dangerLabel: string;
  replies: TranslationReply[];
  warning?: string;
};

export type TranslateInput = {
  message: string;
  speaker?: RelationRole;
  context?: ParentContext;
};

export type ParentExample = {
  message: string;
  speaker: RelationRole;
  context: ParentContext;
  tease: string;
};

/**
 * Thư viện câu mẫu phía client — CQ-14 (fix wave 3): ĐỒNG BỘ NGUYÊN VĂN với
 * DICHBOME_EXAMPLES phía server (lib/server/engine.ts), chỉ khác biểu diễn
 * (nhãn vai/hoàn cảnh tiếng Việt thay cho mã code — ánh xạ đúng
 * SPEAKER_CODE_BY_ROLE / CONTEXT_CODE_BY_LABEL ở api/http.ts, gồm cả tease).
 * Trước đây hai phía là hai bộ câu mẫu khác nhau (15 ↔ 14, lệch cả nội
 * dung) nên chế độ http và chế độ local gợi ý hai thư viện khác nhau.
 * Parity suite (tests-evidence/engine-parity.test.mjs) + KI-PARITY-3 khoá
 * việc đồng bộ này — sửa một phía là phải sửa phía kia trong cùng thay đổi.
 */
export const PARENT_EXAMPLES: ParentExample[] = [
  {
    message: 'Tùy con',
    speaker: 'Mẹ',
    context: 'Khác',
    tease: 'Hiểu câu này là "được tự quyết" thì xác định...',
  },
  {
    message: 'Mẹ không buồn đâu, con cứ đi đi',
    speaker: 'Mẹ',
    context: 'Về quê',
    tease: 'Tin là không buồn thật là toang đấy',
  },
  {
    message: 'Ăn cơm chưa?',
    speaker: 'Mẹ',
    context: 'Sức khoẻ',
    tease: 'Không phải hỏi chuyện cơm đâu',
  },
  {
    message: 'Bao giờ thì về?',
    speaker: 'Cả hai',
    context: 'Về quê',
    tease: 'Hỏi lịch về nhưng ý ở đằng sau khác hẳn',
  },
  {
    message: 'Con nhà người ta...',
    speaker: 'Bố',
    context: 'Công việc',
    tease: 'Nhân vật quốc dân không bao giờ lộ diện',
  },
  {
    message: 'Tiền bạc không quan trọng',
    speaker: 'Bố',
    context: 'Xin tiền',
    tease: 'Quan trọng là câu nói tiếp ngay sau câu này',
  },
  {
    message: 'Mẹ không sao đâu, hơi mệt tí thôi',
    speaker: 'Mẹ',
    context: 'Sức khoẻ',
    tease: '"Hơi mệt tí" của mẹ thường không "tí" chút nào',
  },
  {
    message: 'Con cứ làm đi, bố mẹ già rồi biết gì',
    speaker: 'Cả hai',
    context: 'Công việc',
    tease: 'Nghe câu này là phải ngồi xuống ngay',
  },
  {
    message: 'Con bận, để sau đi mẹ',
    speaker: 'Con',
    context: 'Con cái',
    tease: 'Bố mẹ nên đáp sao để con đỡ áp lực?',
  },
  {
    message: 'Để đấy mẹ làm cho, con cứ nghỉ đi',
    speaker: 'Mẹ chồng',
    context: 'Ở chung',
    tease: 'Thương thật hay đang thử nàng dâu?',
  },
  {
    message: 'Dạ để con làm ạ, con sao cũng được',
    speaker: 'Nàng dâu',
    context: 'Ở chung',
    tease: 'Mẹ chồng dịch xem dâu đang mệt hay đang ngại',
  },
  {
    message: 'Em không sao, anh tự hiểu đi',
    speaker: 'Vợ',
    context: 'Khác',
    tease: 'Tin là không sao thật thì nguy',
  },
  {
    message: 'Ừ để anh, em quyết đi cũng được',
    speaker: 'Chồng',
    context: 'Khác',
    tease: 'Chồng nói ngắn là muốn vợ hỏi rõ điều gì?',
  },
  {
    message: 'Em xem lại nhé, cái này đơn giản mà',
    speaker: 'Sếp',
    context: 'Công việc',
    tease: '"Đơn giản" của sếp là đơn giản cỡ nào?',
  },
  {
    message: 'Em không giận đâu, anh bận thì thôi',
    speaker: 'Người yêu',
    context: 'Người yêu',
    tease: '"Không giận đâu" bản người yêu đáng sợ hơn bản gốc',
  },
];

/**
 * Bỏ dấu + thường hoá để match không phụ thuộc cách gõ của người dùng.
 * CQ-14 (fix wave 3): dùng CHUNG một thuật toán với normalizeVi phía server
 * (lib/server/engine.ts) — trước đây bản client giữ nguyên dấu câu nên hai
 * engine chuẩn hoá lệch nhau (parity suite: "me oi! con ve..." ↔
 * "me oi con ve"). Mọi ký tự ngoài [a-z0-9] thành khoảng trắng, gộp đôi.
 */
export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dangerLabelFor(level: number): string {
  if (level <= 0) return 'An toàn tuyệt đối';
  if (level === 1) return 'Hơi nhạy cảm thôi';
  if (level === 2) return 'Hơi nguy hiểm — đáp khéo vào';
  if (level === 3) return 'Đang nguội giận, đừng châm thêm';
  if (level === 4) return 'Giận thật rồi đấy';
  return 'Bão cấp 5 — xin lỗi trước, giải thích sau';
}

type Rule = {
  id: string;
  /** Cụm (đã bỏ dấu) — khớp nếu câu chứa bất kỳ cụm nào. */
  keys: string[];
  /**
   * Cụm khớp theo RANH GIỚI TỪ (như hasWord phía server) — dùng cho cụm
   * ngắn dễ nuốt nhầm qua biên từ: 'om roi' dạng substring sẽ khớp cả
   * "ăn cơm rồi" ("c[om roi]"), phía server tránh bằng hasWord nên phía
   * client cũng phải tránh (CQ-14, fix wave 3).
   */
  wordKeys?: string[];
  /** Nếu khai báo: rule chỉ áp dụng khi người nhắn thuộc các vai này. Không khai = mọi vai. */
  roles?: RelationRole[];
  meaning: string;
  realWant: string;
  angerLevel: number;
  /**
   * Mẫu trả lời cho NGƯỜI DÙNG APP đáp lại người nhắn.
   * {x}/{X} = cách gọi người nhắn (mẹ/con/em/sếp...), {s}/{S} = cách người đáp tự xưng (con/anh/em/mẹ...).
   */
  replies: [TranslationReply, TranslationReply, TranslationReply];
  warning?: string;
};

const RULES: Rule[] = [
  // ---------- Theo vai: Con (bố mẹ dịch con) ----------
  {
    id: 'con-ban',
    keys: ['con ban', 'dang ban lam', 'ban lam a', 'ban qua', 'con dang ban'],
    roles: ['Con'],
    // CQ-14 (fix wave 3): meaning dùng NGUYÊN VĂN entry con-ban phía server
    // (lib/server/engine.ts) — hai engine không còn hai bản diễn đạt cho
    // cùng một câu; parity suite ở tests-evidence/ khoá việc này.
    meaning:
      'Con nói "con bận" thường là đang quá tải thật hoặc sợ mở lời lại thêm việc phải lo — không phải từ chối bố mẹ. Đây là tín hiệu cần giảm áp lực, không cần thêm kỳ vọng.',
    realWant:
      'Điều con cần nghe lúc này là sự thông cảm và một lối thoát nhẹ nhàng: không trách, không giục, để con tự quay lại khi rảnh.',
    angerLevel: 1,
    replies: [
      {
        label: 'Nhẹ nhàng nhất',
        text: 'Ừ con cứ lo việc của con đi, không sao đâu. Khi nào rảnh thì nhắn lại cho bố mẹ một tiếng là được.',
      },
      {
        label: 'Quan tâm đúng cách',
        text: 'Con bận thì để bố mẹ nhắn gọn thôi: nhà mình vẫn ổn, con đừng lo. Con nhớ ăn uống tử tế nhé.',
      },
      {
        label: 'Mở đường quay lại',
        text: 'Thôi con làm đi, tối về tới nhà thì gọi bố mẹ một lúc, nói vài câu thôi cũng được.',
      },
    ],
  },
  {
    id: 'con-de-sau',
    keys: ['de sau di', 'de con sau', 'luc khac di', 'de mai di', 'de khi khac'],
    roles: ['Con'],
    meaning:
      '"Để sau đi" của con cái thường là né tránh vì chưa biết trả lời sao, hoặc đang dồn quá nhiều việc. Càng giục lúc này con càng lảng đi xa hơn.',
    realWant:
      'Con cần một mốc cụ thể và nhẹ nhàng để quay lại câu chuyện, thay vì bị ép trả lời ngay khi chưa sẵn sàng.',
    angerLevel: 2,
    replies: [
      {
        label: 'Chốt mốc nhẹ',
        text: 'Ừ để sau cũng được con. Vậy tối nay hoặc mai con rảnh lúc nào, nhà mình nói tiếp lúc đó nhé.',
      },
      {
        label: 'Không gây áp lực',
        text: 'Không gấp đâu con. Chuyện này để khi nào con thoải mái mình hẵng bàn, bố mẹ chờ được.',
      },
      {
        label: 'Hỏi thẳng mà thương',
        text: 'Con cứ nói thật là con đang kẹt ở đâu, bố mẹ giúp được gì thì giúp, không thì cùng nhau tính.',
      },
    ],
  },
  {
    id: 'con-on-ma',
    keys: ['con on ma', 'con on', 'on ma me', 'on ma bo', 'con khong sao dau'],
    roles: ['Con'],
    meaning:
      'Con nói "con ổn mà" rất hay là ổn kiểu gắng gượng: sợ bố mẹ lo nên giấu mệt, giấu áp lực. Giọng càng tỉnh thì càng nên hỏi thêm một câu.',
    realWant:
      'Con muốn bố mẹ tin mình tự lo được, nhưng sâu bên trong vẫn muốn được hỏi han thêm và biết là nhà luôn là chỗ dựa.',
    angerLevel: 1,
    replies: [
      {
        label: 'Hỏi thêm một câu',
        text: 'Ổn thật không con? Có gì mệt cứ nói với bố mẹ, nhà mình là chỗ để con dựa mà.',
      },
      {
        label: 'Động viên',
        text: 'Bố mẹ tin con lo được. Nhưng mệt quá thì nghỉ, đừng gắng một mình rồi đổ bệnh ra đấy.',
      },
      {
        label: 'Hành động nhỏ',
        text: 'Để bố mẹ gửi con ít đồ ăn nhé. Nhận cho bố mẹ vui, con khỏi phải từ chối.',
      },
    ],
  },
  {
    id: 'con-mai-goi',
    keys: [
      'mai con goi',
      'de mai con goi',
      'ranh con goi',
      'luc nao con goi lai',
      'con goi lai sau',
    ],
    roles: ['Con'],
    meaning:
      '"Mai con gọi" mà không có giờ cụ thể thì tám phần là mai cũng trôi luôn. Không hẳn con vô tâm — thường là con mệt và sợ cuộc gọi kéo dài.',
    realWant:
      'Con cần một lời hẹn ngắn và rõ: gọi mấy giờ, nói bao lâu. Bố mẹ chủ động chốt giúp thì con dễ thực hiện hơn nhiều.',
    angerLevel: 1,
    replies: [
      {
        label: 'Chốt giờ giúp con',
        text: 'Ừ mai con gọi nhé. Vậy mai tầm 8 giờ tối con gọi, nhà mình nói 10 phút thôi cũng được.',
      },
      {
        label: 'Ngắn gọn mà ấm',
        text: 'Được rồi, mai con gọi lại cho bố mẹ. Giờ con nghỉ đi, mai nói chuyện tiếp.',
      },
      {
        label: 'Nhắc khéo',
        text: 'Mai gọi thật đấy nhé. Bố mẹ chờ điện thoại của con, gọi trễ chút cũng không sao.',
      },
    ],
  },
  // ---------- Theo vai: Mẹ chồng / Mẹ vợ ----------
  {
    id: 'me-chong-de-day-lam',
    keys: [
      'de day me lam cho',
      'de me lam cho',
      'cu de day me',
      'me lam cho nhanh',
      'de do me lam',
    ],
    roles: ['Mẹ chồng', 'Mẹ vợ'],
    meaning:
      '"Để đấy mẹ làm cho" có hai lớp: phần nhiều là mẹ thương, muốn con nghỉ; phần còn lại là mẹ quen tay việc nhà và muốn việc được làm theo ý nhà mình. Đây chưa phải giận, nhưng là lúc nàng dâu/con rể nên cùng làm chứ đừng ngồi nghỉ thật.',
    realWant:
      'Mẹ muốn được tôn trọng kinh nghiệm việc nhà và muốn con nhập cuộc cùng — đứng cạnh học cách nhà làm mới là đáp án được điểm cao nhất.',
    angerLevel: 1,
    replies: [
      {
        label: 'Khéo nhất',
        text: 'Dạ con cảm ơn mẹ. Mẹ chỉ con cách nhà mình hay làm, con làm cùng mẹ cho quen tay ạ.',
      },
      {
        label: 'Chia việc rõ',
        text: 'Vậy mẹ làm phần này, con phụ mẹ phần kia nhé. Hai mẹ con làm chung cho nhanh ạ.',
      },
      {
        label: 'Ấm áp',
        text: 'Mẹ làm mãi rồi, hôm nay để con làm chính, mẹ ngồi chỉ con thôi. Con sai đâu mẹ sửa đấy ạ.',
      },
    ],
  },
  {
    id: 'nha-minh-xua-nay',
    keys: [
      'xua nay van the',
      'nha minh van the',
      'nha minh tu xua',
      'tu truoc den gio nha minh',
      'nha minh van lam the',
    ],
    roles: ['Mẹ chồng', 'Mẹ vợ'],
    meaning:
      '"Nhà mình xưa nay vẫn thế" là mẹ đang giữ nếp nhà: không hẳn cấm thay đổi, mà muốn cách mới phải tôn trọng lệ cũ và người lớn trong nhà. Tranh luận đúng sai lúc này rất dễ thành chuyện thái độ.',
    realWant: 'Mẹ muốn được hỏi ý trước và muốn con công nhận nếp nhà trước khi đề xuất cách khác.',
    angerLevel: 3,
    replies: [
      {
        label: 'Tôn trọng trước',
        text: 'Dạ con hiểu nếp nhà mình rồi ạ. Con giữ cách cũ của nhà, chỉ xin thêm một chút này cho tiện hơn, mẹ xem có được không ạ.',
      },
      {
        label: 'Xin ý kiến',
        text: 'Chuyện này con chưa dám quyết, mẹ thấy làm theo cách nhà mình từ trước là hợp nhất phải không ạ?',
      },
      {
        label: 'Mềm mỏng',
        text: 'Dạ con theo nhà mình ạ. Có gì con chưa biết, mẹ cứ chỉ con, con sửa dần ạ.',
      },
    ],
    warning: 'Đừng nói "thời buổi này ai làm thế nữa" — câu đó chạm đúng vào điều mẹ giữ gìn nhất.',
  },
  {
    id: 'me-chong-cu-nghi-di',
    keys: ['con cu nghi di', 'cu nghi di con', 'nghi di con', 'con nghi di de me'],
    roles: ['Mẹ chồng', 'Mẹ vợ'],
    meaning:
      '"Con cứ nghỉ đi" thường là mẹ thương thật, nhất là khi thấy con mệt. Nhưng nếu đáp bằng cách nằm nghỉ luôn cả buổi thì điểm khéo lại tụt — mẹ vẫn mong con để ý xung quanh một chút.',
    realWant:
      'Mẹ muốn con nghỉ ngơi nhưng vẫn quan tâm và có mặt cùng nhà, chứ không biến mất hẳn.',
    angerLevel: 1,
    replies: [
      {
        label: 'Nghỉ mà vẫn khéo',
        text: 'Dạ con cảm ơn mẹ, con nghỉ một lát rồi con ra phụ mẹ tiếp ạ.',
      },
      {
        label: 'Quan tâm lại',
        text: 'Con nghỉ cũng được, mà mẹ cũng đừng làm một mình. Việc nặng mẹ để phần con nhé ạ.',
      },
      {
        label: 'Thân tình',
        text: 'Dạ, vậy con ngồi đây với mẹ, mẹ làm gì con phụ tay luôn cho vui ạ.',
      },
    ],
  },
  // ---------- Theo vai: Nàng dâu / Con rể (bố mẹ chồng/vợ dịch) ----------
  {
    id: 'dau-da-de-con-lam',
    keys: ['da de con lam', 'de con lam a', 'con lam duoc a', 'de con lam cho'],
    roles: ['Nàng dâu', 'Con rể'],
    meaning:
      '"Dạ để con làm" rất nhanh, rất ngoan — nhưng thường kèm theo mệt hoặc ngại từ chối. Con dâu/con rể sợ bị đánh giá nên nhận việc trước, sức tính sau. Bố mẹ chồng/vợ nghe câu này nên chia việc giúp thay vì giao hết.',
    realWant:
      'Con muốn được công nhận là chu đáo, nhưng cũng rất cần người lớn chia bớt và nói rõ "mệt thì nghỉ" cho con yên tâm nghỉ thật.',
    angerLevel: 2,
    replies: [
      {
        label: 'Chia việc ngay',
        text: 'Ừ con làm phần này giúp mẹ, phần còn lại để mẹ. Làm chung cho nhanh, mệt thì cứ nghỉ.',
      },
      {
        label: 'Thương con',
        text: 'Con làm được mẹ biết rồi. Hôm nay con mệt thì cứ ngồi nghỉ, việc này để nhà lo.',
      },
      {
        label: 'Ghi nhận',
        text: 'Cảm ơn con. Con chu đáo thế này là nhà mình mừng rồi, đừng gắng quá sức nhé.',
      },
    ],
  },
  {
    id: 'dau-sao-cung-duoc',
    keys: [
      'con sao cung duoc',
      'con the nao cung duoc',
      'me quyet di a',
      'bo quyet di a',
      'con theo y nha minh',
    ],
    roles: ['Nàng dâu', 'Con rể'],
    meaning:
      '"Con sao cũng được" ở vai con dâu/con rể hiếm khi là không có ý kiến — là ngại nói ý mình vì sợ trái ý nhà chồng/vợ. Càng ép "nói đi" con càng thu lại.',
    realWant: 'Con cần được người lớn chủ động mời ý kiến và đảm bảo nói ra sẽ không bị để bụng.',
    angerLevel: 2,
    replies: [
      {
        label: 'Mời ý kiến',
        text: 'Mẹ hỏi thật ý con đấy. Con cứ nói cách nào tiện cho con, nhà mình tính theo cả ý con nữa.',
      },
      {
        label: 'Cho quyền quyết một phần',
        text: 'Vậy phần này con quyết giúp nhà nhé. Con chọn sao nhà mình theo vậy.',
      },
      {
        label: 'Ấm áp',
        text: 'Con về nhà này là người nhà rồi, có ý gì cứ nói thẳng, không ai để bụng đâu con.',
      },
    ],
  },
  // ---------- Theo vai: Vợ / Chồng / Người yêu ----------
  {
    id: 'vo-em-khong-sao',
    keys: ['em khong sao', 'em khong sao dau', 'khong sao dau anh'],
    roles: ['Vợ'],
    meaning:
      'Khác với "không sao" của mẹ, "em không sao" của vợ thường là đang dỗi hoặc tủi thân và muốn chồng tự nhận ra. Tin ngay câu này rồi quay đi làm việc khác là điểm trừ lớn nhất.',
    realWant:
      'Muốn chồng dừng lại, hỏi han và ở cạnh một lúc. Cái cần không phải giải pháp ngay, mà là được lắng nghe trước.',
    angerLevel: 4,
    replies: [
      {
        label: 'Xuống nước',
        text: 'Anh không tin là em không sao đâu. Lại đây, em nói anh nghe, anh nghe hết không cãi đâu.',
      },
      {
        label: 'Nhận phần sai',
        text: 'Chắc anh lại vô tâm chuyện gì rồi. Em cứ nói thẳng, anh sửa ngay.',
      },
      {
        label: 'Hành động',
        text: 'Thôi để anh pha cho em ly nước, ngồi xuống nói chuyện với anh một lúc đã.',
      },
    ],
    warning: 'Đừng đáp "ừ không sao thì tốt" rồi đi chỗ khác — mức dỗi sẽ nhân đôi.',
  },
  {
    id: 'vo-anh-tu-hieu',
    keys: ['anh tu hieu di', 'tu ma hieu', 'anh tu biet di', 'tu hieu di anh'],
    roles: ['Vợ', 'Người yêu'],
    meaning:
      '"Anh tự hiểu đi" là bài kiểm tra không có đáp án in sẵn: vợ/người yêu cho rằng chuyện đã quá rõ, nói lại lần nữa thì mất hay. Đây là vùng nguy hiểm — đoán sai ý còn tệ hơn không đoán.',
    realWant:
      'Muốn đối phương tự nhớ lại mình đã quên/hứa/sai điều gì, và chủ động sửa trước khi bị nhắc thẳng.',
    angerLevel: 4,
    replies: [
      {
        label: 'Thừa nhận an toàn',
        text: 'Anh biết anh sai ở đâu rồi. Cho anh xin lỗi trước, rồi em nói thêm cho anh chắc chắn nhé.',
      },
      {
        label: 'Hỏi khéo',
        text: 'Anh đang nghĩ lại đây. Em gợi ý cho anh một ý thôi, anh sửa ngay không để em nhắc lần hai.',
      },
      {
        label: 'Làm hoà',
        text: 'Thôi anh chịu thua, anh không tự hiểu nổi thật. Em nói anh nghe, đổi lại anh mời em bữa ngon.',
      },
    ],
  },
  {
    id: 'vo-tuy-anh',
    keys: ['tuy anh', 'anh quyet di', 'tuy anh day', 'anh muon lam gi thi lam'],
    roles: ['Vợ', 'Người yêu'],
    meaning:
      '"Tùy anh" trong chuyện vợ chồng/người yêu rất ít khi là trao quyền thật — thường là đã góp ý vài lần không được nghe nên buông một câu cho đối phương tự chịu trách nhiệm.',
    realWant:
      'Muốn được hỏi lại ý kiến một cách nghiêm túc, hoặc được chọn cùng chứ không phải quyết hộ rồi báo sau.',
    angerLevel: 3,
    replies: [
      {
        label: 'Hỏi lại nghiêm túc',
        text: 'Anh không quyết một mình đâu. Em thấy cách nào hợp hơn, mình bàn lại một phút rồi chốt.',
      },
      { label: 'Tôn trọng ý em', text: 'Vậy anh theo ý em lần này. Em chọn đi, anh làm theo.' },
      {
        label: 'Nhận tín hiệu',
        text: 'Nghe "tùy anh" là anh biết em chưa ưng rồi. Mình nói lại từ đầu nhé.',
      },
    ],
  },
  {
    id: 'ny-khong-gian',
    keys: ['em khong gian dau', 'khong gian dau ma', 'co gian dau', 'anh khong gian dau'],
    roles: ['Người yêu'],
    meaning:
      '"Em không giận đâu" kèm theo câu sau kiểu "anh bận thì thôi" là giận kiểu rút lui: không làm ầm lên, nhưng đang tự hạ kỳ vọng xuống. Để yên là khoảng cách cứ xa dần.',
    realWant:
      'Muốn được ưu tiên lại một cách cụ thể: một lời hẹn bù, một tin nhắn tử tế — chứ không phải câu "thôi đừng giận nữa".',
    angerLevel: 3,
    replies: [
      {
        label: 'Bù cụ thể',
        text: 'Anh biết em giận chứ. Tối nay anh bù: anh qua đón em đi ăn món em thích, không điện thoại việc nữa.',
      },
      {
        label: 'Xin lỗi đúng chỗ',
        text: 'Anh xin lỗi vì để em phải nói câu này. Lần sau anh báo em trước, không để em chờ.',
      },
      {
        label: 'Giữ kết nối',
        text: 'Giờ anh đang kẹt thật, nhưng 9 giờ anh gọi em nói chuyện đàng hoàng. Em chờ anh nhé.',
      },
    ],
  },
  {
    id: 'ny-ban-thi-thoi',
    keys: ['anh ban thi thoi', 'ban thi thoi', 'em ban thi thoi', 'ban qua thi thoi'],
    roles: ['Người yêu', 'Vợ'],
    meaning:
      '"Bận thì thôi" là câu rút lui kinh điển: ngoài mặt nhường nhịn, trong lòng đang tính điểm trừ cho mỗi lần bị xếp sau công việc. Nghe nhiều lần là thành thất vọng thật.',
    realWant:
      'Muốn một mốc cụ thể được ưu tiên lại, và muốn nghe khẳng định mình quan trọng — không phải câu hứa chung chung.',
    angerLevel: 3,
    replies: [
      {
        label: 'Chốt lại lịch',
        text: 'Không "thôi" được. Anh xong việc lúc 8 giờ, 8 giờ anh gọi em ngay. Chuyện này anh không để trôi nữa.',
      },
      {
        label: 'Khẳng định',
        text: 'Em không phải lựa chọn thứ hai đâu. Anh đang kẹt một lúc thôi, xong là anh dành thời gian cho em.',
      },
      {
        label: 'Xin lỗi + bù',
        text: 'Anh xin lỗi để em phải nói vậy. Cuối tuần này mình đi chơi, anh tắt thông báo công việc.',
      },
    ],
  },
  {
    id: 'chong-u-de-anh',
    keys: ['u de anh', 'de anh lam', 'de anh lo', 'ok de anh', 'u de anh lam'],
    roles: ['Chồng'],
    meaning:
      '"Ừ để anh" của chồng thường là đồng ý cho yên chuyện trước, kế hoạch cụ thể thì chưa có đâu. Không phải lười — nhiều anh quen nhận việc bằng miệng rồi mới tính sau.',
    realWant:
      'Muốn vợ yên tâm và đừng giục thêm lúc này. Nhưng để việc thành thật, cần chốt thêm thời điểm — hỏi nhẹ một câu là ra ngay.',
    angerLevel: 1,
    replies: [
      {
        label: 'Chốt thời điểm',
        text: 'Ừ anh làm giúp em nhé. Anh tính làm lúc nào để em khỏi phải nhắc nữa?',
      },
      {
        label: 'Tin tưởng',
        text: 'Vậy em giao anh phần này nhé. Xong anh nhắn em một tiếng là được.',
      },
      {
        label: 'Hỏi rõ phạm vi',
        text: 'Anh làm phần này thôi đúng không, phần còn lại em lo. Mình chia vậy cho rõ nhé anh.',
      },
    ],
  },
  {
    id: 'chong-em-quyet-di',
    keys: ['em quyet di', 'tuy em', 'em muon sao cung duoc', 'em thay sao thi lam vay'],
    roles: ['Chồng'],
    meaning:
      '"Em quyết đi" đa phần là chồng thật sự không để tâm chuyện lớn nhỏ này, hoặc đang tránh tranh luận. Hiếm khi là bẫy — nhưng quyết xong mà chê là tính trạng khác hẳn.',
    realWant:
      'Muốn vợ chốt nhanh cho xong việc và không khí nhẹ nhàng. Điều cần chốt lại chỉ là: đã giao quyền thì tôn trọng kết quả.',
    angerLevel: 1,
    replies: [
      {
        label: 'Chốt luôn',
        text: 'Vậy em quyết nhé. Anh đã giao em thì em chọn cách này, anh ủng hộ em là được.',
      },
      {
        label: 'Hỏi một ý duy nhất',
        text: 'Em quyết cũng được, anh chỉ cần nói em nghe anh thích phương án nào hơn trong hai cái này thôi.',
      },
      { label: 'Thân tình', text: 'Rồi, vụ này em làm chủ. Anh phụ em phần nặng tay chân nhé.' },
    ],
  },
  // ---------- Theo vai: Sếp / công việc ----------
  {
    id: 'sep-xem-lai-nhe',
    keys: [
      'em xem lai nhe',
      'xem lai nhe em',
      'em xem lai di',
      'coi lai nhe em',
      'xem lai cho anh',
      'xem lai cho chi',
    ],
    roles: ['Sếp'],
    meaning:
      '"Em xem lại nhé" của sếp dịch thẳng là: bản này chưa đạt, sửa đi. Sếp nói nhẹ vì giữ thể diện cho cả hai, nhưng kỳ vọng là sửa thật và có bản mới, không phải xem qua loa.',
    realWant:
      'Muốn nhân viên chủ động rà lại, sửa điểm yếu và báo lại mốc hoàn thành — sếp không muốn phải chỉ tay từng lỗi.',
    angerLevel: 2,
    replies: [
      {
        label: 'Chuyên nghiệp nhất',
        text: 'Dạ em cảm ơn sếp. Em rà lại toàn bộ và gửi bản chỉnh sửa trước cuối ngày ạ. Sếp có điểm nào muốn em ưu tiên không ạ?',
      },
      {
        label: 'Xác nhận phạm vi',
        text: 'Dạ em xem lại ngay ạ. Em tập trung vào phần số liệu và kết luận trước, sếp xem hướng đó ổn chưa ạ?',
      },
      {
        label: 'Báo tiến độ',
        text: 'Dạ em nhận ạ. Em sửa xong em báo lại kèm danh sách điểm đã chỉnh để sếp dễ kiểm tra.',
      },
    ],
  },
  {
    id: 'sep-don-gian-ma',
    keys: ['cai nay don gian ma', 'don gian ma em', 'co gi kho dau', 'viec nay de ma'],
    roles: ['Sếp'],
    meaning:
      '"Cái này đơn giản mà" thường nghĩa là: sếp đánh giá thấp độ khó, hoặc đang muốn giao việc nhanh. Nhận ngay mà không chốt phạm vi là rất dễ ôm việc quá sức và trễ hẹn.',
    realWant:
      'Muốn nhân viên nhận việc với thái độ sẵn sàng, nhưng sếp vẫn cần nhân viên chốt lại đầu việc và thời hạn cho chắc.',
    angerLevel: 2,
    replies: [
      {
        label: 'Nhận + chốt phạm vi',
        text: 'Dạ em nhận ạ. Em xác nhận lại: đầu việc gồm những phần này, hạn là ngày này — đúng ý sếp chưa ạ?',
      },
      {
        label: 'Báo độ khó khéo',
        text: 'Dạ em làm được ạ. Có một phần cần thêm dữ liệu từ phòng khác, em báo trước để sếp nắm tiến độ.',
      },
      {
        label: 'An toàn tiến độ',
        text: 'Dạ em bắt tay ngay ạ. Em gửi trước bản nháp vào mốc này để sếp xem hướng, tránh sửa muộn.',
      },
    ],
    warning:
      'Đừng cãi "không đơn giản đâu sếp" — chốt phạm vi và mốc nháp là cách bảo vệ mình khéo nhất.',
  },
  {
    id: 'sep-khi-nao-xong',
    keys: [
      'khi nao xong vay em',
      'bao gio xong em',
      'khi nao thi xong',
      'sap xong chua em',
      'may gio xong',
    ],
    roles: ['Sếp'],
    meaning:
      '"Khi nào xong vậy em?" không phải hỏi thăm tiến độ — là sếp đang sốt ruột hoặc có việc phụ thuộc vào kết quả này. Trả lời "dạ sắp" là đáp án nguy hiểm nhất.',
    realWant: 'Muốn một mốc giờ/ngày cụ thể và biết ngay nếu có nguy cơ trễ để sếp còn xoay xở.',
    angerLevel: 3,
    replies: [
      {
        label: 'Chốt mốc cụ thể',
        text: 'Dạ em chốt 16 giờ hôm nay em gửi sếp ạ. Hiện em xong khoảng 70%, phần còn lại là rà soát cuối.',
      },
      {
        label: 'Báo rủi ro sớm',
        text: 'Dạ em báo thật: mốc cũ hơi căng vì đang chờ dữ liệu. Em đề xuất gửi trước phần chính hôm nay, phần còn lại sáng mai ạ.',
      },
      {
        label: 'Chủ động cập nhật',
        text: 'Dạ em cập nhật tiến độ mỗi 2 giờ cho sếp tới khi xong ạ, sếp khỏi phải hỏi lại.',
      },
    ],
  },
  // ---------- Chung mọi vai (bố mẹ là chính) ----------
  {
    id: 'muon-lam-gi-thi-lam',
    keys: ['muon lam gi thi lam', 'lam gi thi lam', 'mac ke con', 'ke con di', 'tuy y con'],
    meaning:
      'Đây không còn là "cho con tự quyết" nữa — là bố mẹ đã giận tới mức buông tay rồi. Nói câu này xong mà con làm thật là còn giận dài dài.',
    realWant:
      'Muốn con dừng lại, xuống nước và nói chuyện đàng hoàng ngay lúc này, chứ không phải muốn con tự do thật đâu.',
    angerLevel: 4,
    replies: [
      {
        label: 'Xuống nước ngay',
        text: 'Dạ con xin lỗi {x}. {X} đừng giận nữa, con ngồi nghe {x} nói hết đây ạ.',
      },
      {
        label: 'Nhận sai trước',
        text: 'Con biết con làm {x} buồn rồi. {X} cho con sửa, lần này con nghe {x} hết ạ.',
      },
      {
        label: 'Hài nhưng hối lỗi',
        text: 'Nghe câu này là con biết con "toang" rồi {x} ơi. Cho con cơ hội chuộc lỗi bằng một bữa ngon nhé ạ 😅',
      },
    ],
    warning: 'Tuyệt đối đừng đáp "dạ vậy con làm thật nhé" — câu đó đổ thêm dầu vào lửa.',
  },
  {
    id: 'tuy-con',
    // CQ-14 (fix wave 3): keys + meaning + thang giận căn theo entry tuy-con
    // phía server (lib/server/engine.ts): meaning nguyên văn bản server
    // (điền {x} thay {p}), angerLevel 3 = 62/100 quy về thang 0–5 theo đúng
    // quy tắc chuẩn hoá ở api/http.ts. realWant/replies giữ bản client.
    keys: [
      'tuy con',
      'tuy em',
      'tuy may',
      'the nao cung duoc',
      'sao cung duoc',
      'tuy con quyet dinh',
    ],
    meaning:
      "'Tùy con' nghe như cho tự quyết, nhưng đa phần {x} đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý {x} đang nghĩ không.",
    realWant:
      'Muốn con hỏi thêm một câu cho chắc, hoặc chọn đúng cái ý mà bố mẹ đang nghĩ — chứ quyết luôn một mình là dễ sai ý lắm.',
    angerLevel: 3,
    replies: [
      {
        label: 'An toàn nhất',
        text: 'Dạ con đang phân vân, {x} thấy phương án nào hợp hơn thì chỉ con với ạ, con theo {x}.',
      },
      {
        label: 'Thân tình',
        text: '{X} cứ nói thẳng ý {x} thích nhất, con làm theo {x} cho chắc ạ.',
      },
      {
        label: 'Hài hước',
        text: '"Tùy con" mà con chọn sai là {x} giận, nên {x} chốt giúp con một tiếng đi ạ 😄',
      },
    ],
    warning: 'Đừng trả lời "vậy thôi kệ ạ" — mức giận sẽ tăng vọt ngay lập tức.',
  },
  {
    id: 'khong-sao-dau',
    keys: ['khong sao dau', 'khong sao', 'co gi dau ma', 'khong viec gi dau'],
    meaning:
      'Khả năng cao là có sao đấy, chỉ là bố mẹ không muốn làm phiền con. "Không sao đâu" của bố mẹ thường dịch là "có sao nhưng con hỏi thêm đi".',
    realWant:
      'Muốn được con quan tâm hỏi han thêm một lúc, được kể ra cho nhẹ lòng — chứ không muốn bị bỏ qua ngay sau câu trả lời.',
    angerLevel: 3,
    replies: [
      {
        label: 'Quan tâm thêm',
        text: '{X} nói không sao mà con nghe giọng là biết có chuyện rồi. {X} kể con nghe đi, con đang rảnh đây ạ.',
      },
      {
        label: 'Hành động luôn',
        text: 'Thôi để con qua nhà / gọi video với {x} một lát nhé, nghe giọng {x} con chưa yên tâm.',
      },
      {
        label: 'Nhẹ nhàng',
        text: 'Con biết {x} hay giấu cho con yên tâm. Có gì {x} cứ nói thật với con, con lớn rồi mà ạ.',
      },
    ],
  },
  {
    id: 'khong-buon-dau',
    keys: ['khong buon dau', 'khong buon', 'co buon gi dau', 'chung buon dau'],
    meaning:
      'Có buồn đấy, buồn rõ luôn — chỉ là bố mẹ nói ngược để con khỏi lo. Ai thật sự không buồn thì chẳng cần phải khẳng định là mình không buồn.',
    realWant:
      'Muốn con ở lại nói chuyện thêm, được an ủi một chút và cảm thấy con vẫn để tâm tới cảm xúc của bố mẹ.',
    angerLevel: 3,
    replies: [
      {
        label: 'Ở lại nghe',
        text: 'Con biết {x} buồn mà. Con không đi đâu hết, {x} cứ nói hết với con đi ạ.',
      },
      {
        label: 'Làm hoà',
        text: 'Con xin lỗi vì làm {x} buồn. Cuối tuần con về, con nấu món {x} thích nhất đền nhé ạ.',
      },
      {
        label: 'Hài chữa cháy',
        text: '"Không buồn" mà giọng này là buồn cấp độ cao rồi {x} ơi. Cho con xin lỗi bằng trà sữa được không ạ? 🧋',
      },
    ],
    warning: 'Câu trả lời tệ nhất lúc này là "dạ vậy thôi con đi ngủ đây".',
  },
  {
    id: 'an-com-chua',
    keys: ['an com chua', 'an gi chua', 'com nuoc gi chua', 'an uong gi chua', 'an chua con'],
    meaning:
      'Câu này không hỏi về cơm đâu — đây là cách bố mẹ nói "bố mẹ nhớ con" mà không cần nói thẳng ra. Cơm chỉ là cái cớ mở đầu thôi.',
    realWant:
      'Muốn nghe con kể hôm nay thế nào, được nhắc con ăn uống tử tế, và được nói chuyện với con thêm vài phút nữa.',
    angerLevel: 0,
    replies: [
      {
        label: 'Kể thật chi tiết',
        text: 'Con ăn rồi ạ, nay con ăn món ngon lắm. {X} ăn gì chưa, nhà mình nay ăn món gì thế ạ?',
      },
      {
        label: 'Chủ động gọi',
        text: 'Con vừa ăn xong đây {x}. Để con gọi video, {x} kể con nghe hôm nay nhà mình có gì vui không ạ.',
      },
      {
        label: 'Hài hước',
        text: 'Con ăn rồi ạ, mà cơm con nấu không ngon bằng cơm {x}. Nhớ cơm nhà quá đi mất 😋',
      },
    ],
  },
  {
    id: 'bao-gio-ve',
    // CQ-14 (fix wave 3): keys + meaning + thang giận căn theo entry
    // bao-gio-ve phía server (lib/server/engine.ts): meaning nguyên văn
    // bản server (điền {x} thay {p}), angerLevel 2 = 30/100 quy về 0–5.
    keys: [
      'bao gio thi ve',
      'bao gio ve',
      'khi nao ve',
      'may gio ve',
      'sap ve chua',
      've chua con',
      'bao gio moi ve',
    ],
    meaning:
      "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — {x} muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
    realWant:
      'Muốn một mốc thời gian cụ thể để bố mẹ chuẩn bị và có cái để mong chờ — "để xem đã" là câu bố mẹ buồn nhất khi nghe.',
    angerLevel: 2,
    replies: [
      {
        label: 'Chốt ngày rõ ràng',
        text: 'Con chốt rồi ạ, con về ngày gần nhất có thể và ở nhà hẳn mấy hôm với {x}. {X} muốn ăn gì con mua về nhé ạ.',
      },
      {
        label: 'Nếu chưa chắc',
        text: 'Con đang xin nghỉ đây {x}, có ngày chính xác con báo {x} ngay. Con cũng nhớ nhà lắm rồi ạ.',
      },
      {
        label: 'Hài hước',
        text: '{X} cứ chuẩn bị món con thích nhất đi, con về là con xử lý hết mâm luôn ạ 😄',
      },
    ],
  },
  {
    id: 'con-nha-nguoi-ta',
    keys: ['con nha nguoi ta', 'con nguoi ta', 'nha nguoi ta', 'con nha hang xom'],
    meaning:
      'Chiêu so sánh kinh điển: không hẳn là chê con đâu, mà là bố mẹ vừa nghe hàng xóm khoe con họ xong nên hơi... sốt ruột thay cho con.',
    realWant:
      'Muốn con cố thêm một chút trong việc đang làm, và thật ra là muốn sớm được khoe con mình với hàng xóm như nhà người ta vậy.',
    angerLevel: 2,
    replies: [
      {
        label: 'Nhận và hứa cụ thể',
        text: 'Dạ con nghe rồi ạ. Con đang cố đây {x}, cho con thêm ít thời gian, con làm được việc cho {x} khoe lại hàng xóm ạ.',
      },
      {
        label: 'Đỡ đòn bằng kết quả',
        text: '{X} chờ con một thời gian nữa thôi, con có tin vui là con báo {x} đầu tiên luôn ạ.',
      },
      {
        label: 'Hài hước',
        text: 'Con nhà người ta giỏi thế mà có về ăn cơm với bố mẹ nó không {x}? Con thì về đều đều đây này 😌',
      },
    ],
  },
  {
    id: 'tien-bac-khong-quan-trong',
    keys: [
      'tien bac khong quan trong',
      'tien khong quan trong',
      'tien bac gi',
      'tien nong gi',
      'khong can tien cua con',
    ],
    meaning:
      'Nghe thì nhẹ nhàng nhưng vế sau mới là phần chính: tiền không quan trọng bằng sức khoẻ, bằng gia đình, bằng việc con có mặt ở nhà. Câu nói thường bị ngắt giữa chừng vì bố mẹ ngại nói thẳng.',
    realWant:
      'Muốn con đừng lao vào kiếm tiền mà bỏ bê sức khoẻ và gia đình — và muốn con tự hiểu điều đó thay vì phải nghe giảng.',
    angerLevel: 1,
    replies: [
      {
        label: 'Hiểu ý ngay',
        text: 'Dạ con hiểu ý {x} ạ. Tiền con kiếm được, nhưng thời gian với {x} thì không mua lại được. Con sắp xếp về nhà thường xuyên hơn ạ.',
      },
      {
        label: 'Nếu đang biếu tiền',
        text: '{X} cứ nhận cho con vui ạ, đây là tấm lòng của con. Con hứa vẫn lo sức khoẻ và về nhà đều, {x} yên tâm nhé.',
      },
      {
        label: 'Hài hước',
        text: 'Tiền không quan trọng, quan trọng là con của {x} ngoan — câu này con thuộc lòng rồi ạ 😄',
      },
    ],
  },
  {
    id: 'suc-khoe-lo',
    keys: ['hoi met', 'met lam', 'dau lung', 'dau chan', 'dau dau', 'di kham', 'benh vien'],
    // 'om roi' phải khớp theo ranh giới từ: dạng substring nó nuốt cả
    // "ăn cơm rồi" (c[om roi]) — câu ăn uống bị đọc thành câu sức khỏe.
    wordKeys: ['om roi'],
    meaning:
      'Khi bố mẹ chủ động nói "hơi mệt" thì thường là mệt hơn mức họ nói rất nhiều. Bố mẹ Việt mình hay khai giảm bệnh xuống một nửa để con khỏi lo.',
    realWant:
      'Muốn con hỏi han kỹ hơn và nếu được thì sắp xếp đưa đi khám — chứ câu "mẹ/bố nghỉ ngơi đi ạ" qua loa là chưa đủ đâu.',
    angerLevel: 1,
    replies: [
      {
        label: 'Hỏi kỹ luôn',
        text: '{X} mệt chỗ nào, từ bao giờ rồi ạ? {X} kể kỹ cho con, con đặt lịch khám rồi con đưa {x} đi ạ.',
      },
      {
        label: 'Hành động',
        text: 'Thôi {x} đừng gắng nữa, để con lo phần này. {X} nghỉ đi, có gì con xử lý hết ạ.',
      },
      {
        label: 'Nhẹ nhàng',
        text: 'Con lo cho {x} lắm. {X} hứa với con là mệt nữa là gọi con ngay nhé, đừng giấu con ạ.',
      },
    ],
    warning:
      'Bố mẹ nói mệt lần thứ hai trong tuần là nên đưa đi khám thật, đừng chỉ hỏi thăm qua điện thoại.',
  },
  {
    id: 'nho-con',
    keys: ['lau khong thay goi', 'khong thay goi', 'it goi', 'ban lam a', 'que que som som'],
    meaning:
      'Đây là nỗi nhớ nói vòng vo: bố mẹ không trách con bận đâu, chỉ là lâu không nghe giọng con nên nhà trống trải hẳn.',
    realWant: 'Muốn được con chủ động gọi về thường xuyên hơn, vài phút thôi cũng quý lắm rồi.',
    angerLevel: 2,
    replies: [
      {
        label: 'Hẹn lịch cố định',
        text: 'Dạ con xin lỗi {x}. Từ giờ tối nào con cũng gọi về một lúc, {x} khỏi phải chờ con nữa ạ.',
      },
      {
        label: 'Gọi ngay bây giờ',
        text: 'Con đây rồi ạ! Nay con kể {x} nghe chuyện này hay lắm...',
      },
      {
        label: 'Hài hước',
        text: 'Khách hàng thân thiết gọi ít quá nên {x} nhắc khéo rồi. Con nạp "gói gọi về nhà" ngay đây ạ 📞',
      },
    ],
  },
];

/** Khớp nguyên từ (như hasWord phía server): cụm nằm giữa hai khoảng trắng. */
function hasWord(norm: string, word: string): boolean {
  return ` ${norm} `.includes(` ${word} `);
}

function hasAnyPhrase(norm: string, phrases: string[]): boolean {
  return phrases.some((p) => norm.includes(p));
}

type FallbackDef = Omit<Rule, 'id' | 'keys' | 'roles'>;

const REPLY_LABELS = ['Ngoan nhất', 'Khéo nhất', 'An toàn nhất'] as const;

function catDef(
  meaning: string,
  realWant: string,
  angerLevel: number,
  replies: [string, string, string],
  warning?: string,
): FallbackDef {
  return {
    meaning,
    realWant,
    angerLevel,
    // replies vào luôn có đúng 3 phần tử (kiểu tuple ở tham số) — map giữ nguyên số lượng.
    replies: replies.map((text, i) => ({ label: REPLY_LABELS[i], text })) as [
      TranslationReply,
      TranslationReply,
      TranslationReply,
    ],
    ...(warning ? { warning } : {}),
  };
}

/**
 * Câu cụt nguyên văn (mirror entry `ngan-gon` phía server — exact match).
 * CHỦ ĐÍCH chỉ áp ở tầng fallback của translateParentMessage, KHÔNG đưa
 * vào RULES/matchRule: tầng trung thực (lib/honesty.ts) yêu cầu
 * matchRuleInfo('Ừ') = null để câu cụt đi đường trình bày 'low-direct'
 * (test khoá ở tests/honesty.test.mjs) — bản đọc ở đây chỉ thay phần nội
 * dung fallback chung chung bằng đúng bản đọc ngan-gon của server.
 */
const CURT_EXACT_PATTERNS: readonly string[] = ['u', 'uh', 'um', 'o', 'da', 'vang', 'biet roi'];

function curtDef(): FallbackDef {
  // angerLevel 3 = 58/100 của server quy về thang 0–5 (quy tắc api/http.ts).
  return catDef(
    'Một chữ mà nặng cả buổi tối. Trả lời càng ngắn thì trong đầu {x} càng nhiều chuyện — thường là đang không vui nhưng chưa muốn nói, hoặc đang chờ con tự nhận ra điều gì đó.',
    "Muốn con tinh ý hỏi thêm một câu, chứ đừng thấy 'ừ' là tưởng mọi chuyện đã xong.",
    3,
    [
      'Dạ, {x} sao thế ạ? Có chuyện gì {x} kể con nghe đi.',
      'Nghe giọng {x} hình như đang không vui. Con làm gì sai {x} cứ nói thẳng với con.',
      'Dạ, để con gọi lại cho {x} nói chuyện đàng hoàng nhé.',
    ],
    'Đừng đáp lại bằng một chữ tương tự. Hai bên mỗi người một chữ là cuộc trò chuyện đi vào ngõ cụt.',
  );
}

type FallbackCategory =
  'tien' | 've-que' | 'suc-khoe' | 'tinh-cam' | 'cong-viec' | 'quan-tam' | 'chung';

/**
 * Fallback theo nhóm chủ đề cho vai bố mẹ — mirror FALLBACKS phía server
 * (CQ-14, fix wave 3): meaning/realWant dùng nguyên văn bản server (điền
 * {x}/{X} thay {p}/{P}), angerLevel là điểm server 0–100 quy về 0–5 theo
 * quy tắc làm tròn ở api/http.ts (38→2, 32→2, 24→1, 42→2, 28→1, 12→1, 30→2).
 */
const FALLBACK_CATEGORIES: Record<FallbackCategory, FallbackDef> = {
  tien: catDef(
    'Nhắc tới tiền mà nói vòng vo là {x} đang ngại mở lời. Phụ huynh rất ít khi nói thẳng chuyện tiền, thường chờ con tự hiểu và chủ động trước.',
    'Muốn con chủ động quan tâm chuyện tiền nong trong nhà, để {x} khỏi phải mở miệng — với {x}, mở miệng xin con là điều khó nhất.',
    2,
    [
      'Dạ, chuyện tiền {x} cứ để con lo. Tháng này con gửi về một ít, {x} cầm chi tiêu nhé.',
      'Dạ con cảm ơn {x} lo cho con. Con vẫn ổn, {x} đừng dè sẻn quá với bản thân.',
      'Để con tính lại rồi con báo {x}. Có gì thiếu {x} cứ nói với con, đừng giấu.',
    ],
  ),
  've-que': catDef(
    'Chuyện về quê, về nhà mà được nhắc tới là {x} đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
    'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để {x} có cái mà đợi.',
    2,
    [
      'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho {x} sớm.',
      'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với {x}.',
      'Giờ con chưa về được, nhưng con gọi video với {x} mỗi tối nhé.',
    ],
  ),
  'suc-khoe': catDef(
    'Chuyện sức khỏe mà {x} nói nhẹ đi thì phải nghe ngược lại. Phụ huynh hay giấu bệnh vì sợ con lo và sợ tốn tiền đi khám.',
    'Muốn con hỏi kỹ và quan tâm thật, chứ không phải nghe qua loa rồi yên tâm luôn.',
    1,
    [
      'Dạ, {x} nói thật với con đi, đau ở đâu, lâu chưa? Con đặt lịch khám cho {x} nhé.',
      'Để con gọi về hỏi kỹ. Chuyện này không để "kệ nó tự khỏi" được đâu ạ.',
      'Dạ, cuối tuần con về đưa {x} đi khám. {X} đừng lo chuyện tiền, có con đây.',
    ],
    'Riêng sức khỏe thì đừng dịch vui nữa — gọi hỏi kỹ triệu chứng, hoặc sắp xếp về xem tận mắt cho chắc.',
  ),
  'tinh-cam': catDef(
    'Chuyện người yêu, cưới xin mà {x} nhắc khéo là đang sốt ruột thay con, nhưng sợ nói thẳng thì con áp lực nên cứ bóng gió mãi.',
    'Muốn biết con có tính chuyện lâu dài chưa để {x} yên tâm, và muốn được con chia sẻ như người trong nhà chứ không phải người ngoài.',
    2,
    [
      'Dạ, chuyện này con có tính rồi ạ. Khi nào chắc chắn con thưa chuyện với {x} đầu tiên.',
      'Con biết {x} lo cho con. {X} cứ yên tâm, con không để {x} phải nhắc mãi đâu.',
      'Dạ, để con kể {x} nghe từ từ. {X} nghe xong cho con ý kiến nhé.',
    ],
  ),
  'cong-viec': catDef(
    'Hỏi chuyện công việc là cách {x} đo xem con ở ngoài kia có ổn không. Công việc ổn thì {x} mới ngủ ngon được.',
    'Muốn nghe con kể thật chuyện đi làm — vui buồn gì cũng được, miễn là còn chia sẻ với {x}.',
    1,
    [
      'Dạ công việc con vẫn ổn ạ. Dạo này con đang làm một việc mới, để con kể {x} nghe.',
      'Có hơi bận một chút nhưng con lo được. {X} đừng lo, con vẫn ăn ngủ đàng hoàng.',
      'Dạ, cảm ơn {x} hỏi. Cuối tuần con gọi về kể {x} nghe kỹ hơn nhé.',
    ],
  ),
  'quan-tam': catDef(
    'Câu hỏi kiểu này thường là nhớ con nên tìm cớ bắt chuyện. Chuyện ăn uống chỉ là mở đầu, cái {x} muốn là nghe giọng con lâu hơn một chút.',
    'Muốn trò chuyện với con thêm vài câu và biết chắc con đang tự lo cho mình ổn.',
    1,
    [
      'Dạ con ổn ạ. {X} nay thế nào, ăn uống có ngon miệng không ạ?',
      'Dạ, để con gọi video cho {x} luôn, nói chuyện thế này không đã.',
      'Con cảm ơn {x}. {X} giữ gìn sức khỏe nhé, con gọi về thường xuyên mà.',
    ],
  ),
  chung: catDef(
    'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. {X} hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
    'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với {x}, được con để ý là đã vui rồi.',
    2,
    [
      'Dạ, {x} nói vậy là còn chuyện gì nữa không ạ? {X} kể con nghe đi.',
      'Con cảm ơn {x}. Có gì {x} cứ nói thẳng với con, con nghe hết ạ.',
      'Dạ, để con gọi về nói chuyện với {x} kỹ hơn nhé.',
    ],
  ),
};

/** Nhận diện nhóm chủ đề theo từ khoá — mirror detectCategory phía server (khớp theo từ). */
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

function categoryFromContext(context: ParentContext): FallbackCategory {
  switch (context) {
    case 'Xin tiền':
      return 'tien';
    case 'Về quê':
      return 've-que';
    case 'Sức khoẻ':
      return 'suc-khoe';
    case 'Người yêu':
    case 'Cưới hỏi':
      return 'tinh-cam';
    case 'Công việc':
      return 'cong-viec';
    default:
      return 'chung';
  }
}

const PARENT_ROLES: readonly RelationRole[] = ['Mẹ', 'Bố', 'Cả hai'];

/**
 * Chọn bản đọc fallback khi không rule nào khớp — cùng thứ tự ưu tiên với
 * server: câu cụt nguyên văn (mọi vai) → nhóm chủ đề (vai bố mẹ) → bản đọc
 * theo vai (fallbackFor). Vai ngoài bố mẹ giữ bản đọc riêng của client
 * (server có SPEAKER_FALLBACKS riêng — phần lệch còn lại ghi ở ADR-001).
 */
function fallbackDefFor(
  normalized: string,
  speaker: RelationRole,
  context: ParentContext,
): FallbackDef {
  if (CURT_EXACT_PATTERNS.includes(normalized)) return curtDef();
  if (PARENT_ROLES.includes(speaker)) {
    return FALLBACK_CATEGORIES[detectCategory(normalized) ?? categoryFromContext(context)];
  }
  return fallbackFor(speaker);
}

/** Fallback theo vai người nhắn khi không khớp từ điển. */
function fallbackFor(speaker: RelationRole): Omit<Rule, 'id' | 'keys' | 'roles'> {
  if (speaker === 'Con') {
    return {
      meaning:
        'Con nói ngắn gọn thế này thường là đang mệt hoặc chưa sẵn sàng nói sâu. Bố mẹ đáp dài và nặng lúc này là con càng thu mình lại.',
      realWant:
        'Con cần một câu hỏi mở, nhẹ, cho con quyền trả lời lúc khác mà vẫn thấy nhà luôn ở đó.',
      angerLevel: 1,
      replies: [
        {
          label: 'Nhẹ nhàng',
          text: 'Ừ con cứ từ từ, khi nào muốn nói thì nói với bố mẹ. Nhà mình không giục con đâu.',
        },
        {
          label: 'Quan tâm',
          text: 'Con có mệt không? Mệt thì nghỉ đi, chuyện này để lúc khác mình nói.',
        },
        { label: 'Gắn kết', text: 'Để lúc nào rảnh bố mẹ gọi con, nói vài câu thôi cho đỡ nhớ.' },
      ],
    };
  }
  if (speaker === 'Nàng dâu' || speaker === 'Con rể') {
    return {
      meaning:
        'Con dâu/con rể nói ngắn và ngoan thế này thường là đang giữ kẽ: ngại từ chối, ngại làm trái ý nhà. Người lớn nên chủ động nới lỏng thay vì hỏi dồn.',
      realWant:
        'Con cần được chia việc, được hỏi ý thật và được yên tâm là nói thật sẽ không bị để bụng.',
      angerLevel: 2,
      replies: [
        {
          label: 'Nới lỏng',
          text: 'Con cứ nói thật ý con nhé, nhà mình tính sao cho cả nhà cùng thoải mái.',
        },
        {
          label: 'Chia việc',
          text: 'Việc này mình chia nhau làm cho nhẹ con ạ, con đừng ôm hết một mình.',
        },
        {
          label: 'Ấm áp',
          text: 'Cảm ơn con đã để ý nhà mình. Có gì chưa quen con cứ hỏi, không ai trách đâu.',
        },
      ],
    };
  }
  if (speaker === 'Mẹ chồng' || speaker === 'Mẹ vợ') {
    return {
      meaning:
        'Mẹ chồng/mẹ vợ nói ngắn thường là đang giữ nếp hoặc đang thử xem con có để ý không. Đáp tôn trọng và xin chỉ dẫn trước là an toàn nhất.',
      realWant: 'Mẹ muốn được tôn trọng kinh nghiệm và được con hỏi ý trước khi làm khác đi.',
      angerLevel: 2,
      replies: [
        {
          label: 'Tôn trọng',
          text: 'Dạ chuyện này con nghe mẹ ạ. Mẹ chỉ con cách làm cho đúng ý nhà mình nhé.',
        },
        {
          label: 'Xin ý kiến',
          text: 'Con chưa rõ phần này, mẹ thấy nên làm thế nào thì con làm theo ạ.',
        },
        {
          label: 'Thân tình',
          text: 'Dạ con cảm ơn mẹ đã nhắc. Lần sau con để ý hơn, mẹ cứ nói thẳng với con ạ.',
        },
      ],
    };
  }
  if (speaker === 'Vợ' || speaker === 'Chồng' || speaker === 'Người yêu') {
    return {
      meaning:
        'Trong chuyện tình cảm, câu càng ngắn càng nên nghe kỹ: thường là đang cần được quan tâm chứ không cần tranh luận đúng sai.',
      realWant:
        'Muốn người kia dừng lại lắng nghe, xác nhận cảm xúc của mình trước khi bàn cách giải quyết.',
      angerLevel: 2,
      replies: [
        {
          label: 'Lắng nghe trước',
          text: '{S} nghe {x} nói hết đã. {X} cứ nói thật, {s} không cãi đâu.',
        },
        {
          label: 'Xác nhận cảm xúc',
          text: '{S} biết chuyện này làm {x} khó chịu rồi. Mình ngồi xuống nói cho rõ nhé.',
        },
        {
          label: 'Hỏi nhu cầu',
          text: 'Giờ {x} muốn {s} làm gì nhất? {X} nói thẳng, {s} làm theo.',
        },
      ],
    };
  }
  if (speaker === 'Sếp' || speaker === 'Đồng nghiệp') {
    return {
      meaning:
        'Tin nhắn công việc nói gọn thường ẩn kỳ vọng về tiến độ hoặc chất lượng. Cách đáp an toàn nhất là xác nhận lại đầu việc và mốc thời gian cụ thể.',
      realWant:
        'Muốn người nhận xác nhận đã hiểu việc, chốt mốc hoàn thành và chủ động báo tiến độ.',
      angerLevel: 2,
      replies: [
        {
          label: 'Chuyên nghiệp',
          text: 'Dạ em nhận thông tin ạ. Em xác nhận lại đầu việc và báo mốc hoàn thành cụ thể ngay sau đây.',
        },
        {
          label: 'Báo tiến độ',
          text: 'Dạ phần này em đang xử lý, em cập nhật tiến độ vào cuối buổi để mọi người nắm ạ.',
        },
        {
          label: 'Hỏi rõ khi chưa chắc',
          text: 'Dạ cho em xác nhận lại một điểm này để làm đúng ngay từ đầu, tránh sửa lại ạ.',
        },
      ],
    };
  }
  if (speaker === 'Anh/Chị' || speaker === 'Em' || speaker === 'Bạn thân') {
    return {
      meaning:
        'Anh em/bạn bè nói cụt thường là đang bận hoặc đang có chuyện chưa muốn kể. Hỏi dồn lúc này chỉ làm người ta lảng thêm.',
      realWant: 'Muốn được để yên một lúc nhưng vẫn biết là mình luôn có người hỏi han khi cần.',
      angerLevel: 1,
      replies: [
        {
          label: 'Thân tình',
          text: 'Ừ có gì thì nói mình nghe nhé, lúc nào cũng được, không cần trả lời ngay đâu.',
        },
        {
          label: 'Quan tâm',
          text: 'Nghe là biết đang có chuyện rồi. Cần gì cứ nhắn, mình qua ngay.',
        },
        { label: 'Nhẹ nhàng', text: 'Thôi nghỉ đi một lát, khi nào thoải mái hơn mình nói tiếp.' },
      ],
    };
  }
  return {
    meaning:
      'Câu này chưa có trong từ điển nhà mình, nhưng thường bố mẹ nói ngắn gọn thế này là đang muốn con hỏi thêm — đừng trả lời cụt lủn một chữ "dạ" rồi thôi nhé.',
    realWant:
      'Muốn con dừng lại vài phút, hỏi han tử tế và lắng nghe hết câu chuyện, thay vì trả lời cho qua chuyện.',
    angerLevel: 1,
    replies: [
      {
        label: 'An toàn nhất',
        text: 'Dạ con nghe đây ạ, {x} nói thêm cho con hiểu với, con muốn nghe {x} nói hết.',
      },
      {
        label: 'Quan tâm',
        text: 'Chuyện này {x} để bụng lâu chưa ạ? Con xin lỗi nếu con vô tâm, {x} kể con nghe nhé.',
      },
      {
        label: 'Hài hước',
        text: 'Câu này của {x} là con phải "dịch" một lúc mới hiểu. {X} gợi ý thêm cho con một chút đi ạ 😄',
      },
    ],
  };
}

/** Gợi ý bổ sung theo hoàn cảnh — nối vào phần "muốn nghe" cho đúng tình huống. */
const CONTEXT_HINTS: Partial<Record<ParentContext, string>> = {
  'Xin tiền':
    ' Đang xin tiền thì nhớ cảm ơn trước, trình bày rõ dùng vào việc gì và khi nào con xoay được — bố mẹ nghe thế mới yên tâm.',
  'Về quê':
    ' Chuyện về quê thì đừng hứa suông: chốt ngày cụ thể, bố mẹ nghe ngày tháng rõ ràng là vui cả tuần.',
  'Công việc':
    ' Chuyện công việc bố mẹ lo nhất là con quá sức — nhớ khoe thêm là con vẫn ăn ngủ tử tế nhé.',
  'Người yêu':
    ' Chuyện người yêu thì bố mẹ tò mò lắm: kể thêm vài chi tiết nhỏ là bố mẹ yên tâm hẳn.',
  'Cưới hỏi':
    ' Chuyện cưới hỏi bố mẹ rất coi trọng thể diện hai nhà — trả lời chắc chắn, đừng lấp lửng.',
  'Sức khoẻ':
    ' Chuyện sức khoẻ thì đừng chỉ hỏi thăm: chốt luôn việc đi khám cùng bố mẹ nếu có dấu hiệu mệt kéo dài.',
  'Ở chung':
    ' Sống chung nhà thì việc nhỏ cũng nên nói rõ ngay: chia việc, chốt giờ giấc, đừng để bụng lâu thành chuyện lớn.',
  'Con cái':
    ' Chuyện con cái thì nói chậm và cụ thể: con cần hướng dẫn rõ ràng hơn là bị trách, bố mẹ càng bình tĩnh con càng nghe.',
};

type Address = { lower: string; upper: string; selfLower: string; selfUpper: string };

/**
 * Đại từ theo vai người nhắn.
 * {x} = cách người đáp gọi người nhắn; {s} = cách người đáp tự xưng.
 * Ví dụ người nhắn là Con -> người đáp (bố/mẹ) gọi "con" và tránh tự xưng cứng,
 * nên các rule vai Con viết sẵn câu trung tính thay vì dùng {s}.
 */
const ADDRESSES: Record<RelationRole, Address> = {
  Mẹ: { lower: 'mẹ', upper: 'Mẹ', selfLower: 'con', selfUpper: 'Con' },
  Bố: { lower: 'bố', upper: 'Bố', selfLower: 'con', selfUpper: 'Con' },
  'Cả hai': { lower: 'bố mẹ', upper: 'Bố mẹ', selfLower: 'con', selfUpper: 'Con' },
  Con: { lower: 'con', upper: 'Con', selfLower: 'bố mẹ', selfUpper: 'Bố mẹ' },
  'Mẹ chồng': { lower: 'mẹ', upper: 'Mẹ', selfLower: 'con', selfUpper: 'Con' },
  'Mẹ vợ': { lower: 'mẹ', upper: 'Mẹ', selfLower: 'con', selfUpper: 'Con' },
  'Nàng dâu': { lower: 'con', upper: 'Con', selfLower: 'mẹ', selfUpper: 'Mẹ' },
  'Con rể': { lower: 'con', upper: 'Con', selfLower: 'bố mẹ', selfUpper: 'Bố mẹ' },
  Vợ: { lower: 'em', upper: 'Em', selfLower: 'anh', selfUpper: 'Anh' },
  Chồng: { lower: 'anh', upper: 'Anh', selfLower: 'em', selfUpper: 'Em' },
  'Anh/Chị': { lower: 'anh/chị', upper: 'Anh/Chị', selfLower: 'em', selfUpper: 'Em' },
  Em: { lower: 'em', upper: 'Em', selfLower: 'anh/chị', selfUpper: 'Anh/Chị' },
  'Người yêu': { lower: 'em', upper: 'Em', selfLower: 'anh', selfUpper: 'Anh' },
  Sếp: { lower: 'sếp', upper: 'Sếp', selfLower: 'em', selfUpper: 'Em' },
  'Đồng nghiệp': { lower: 'bạn', upper: 'Bạn', selfLower: 'mình', selfUpper: 'Mình' },
  'Bạn thân': { lower: 'bạn', upper: 'Bạn', selfLower: 'mình', selfUpper: 'Mình' },
};

function matchRule(normalized: string, speaker: RelationRole): Rule | null {
  const padded = ` ${normalized} `;
  const matched = RULES.filter(
    (r) =>
      r.keys.some((k) => normalized.includes(k)) ||
      (r.wordKeys ?? []).some((k) => padded.includes(` ${k} `)),
  );
  // Ưu tiên rule gắn vai đúng người nhắn (vd "không sao" của Vợ) trước rule chung mọi vai.
  return matched.find((r) => r.roles?.includes(speaker)) ?? matched.find((r) => !r.roles) ?? null;
}

/**
 * Metadata phân loại cho tầng trung thực (redesign-v2) — KHÔNG đổi thuật toán dịch.
 * Trả null khi không khớp rule nào (tức translateParentMessage rơi xuống fallbackFor).
 * roleSpecific = rule khớp có khai roles và roles chứa speaker; rule chung (không khai roles) = false.
 */
export function matchRuleInfo(
  message: string,
  speaker: RelationRole,
): { ruleId: string; roleSpecific: boolean } | null {
  const matched = matchRule(normalizeVi(message), speaker);
  if (!matched) return null;
  return { ruleId: matched.id, roleSpecific: matched.roles?.includes(speaker) ?? false };
}

/** Toàn bộ keys của RULES (đã bỏ dấu sẵn) — dùng làm từ vựng cho tầng trung thực. */
export const CLIENT_RULE_KEYS: readonly string[] = RULES.flatMap((r) => [
  ...r.keys,
  ...(r.wordKeys ?? []),
]);

/**
 * M-2 (Panel #02): tin từ mốc này mới coi là "tin dài" để xét độ sâu ở đường
 * mẫu chung. Panel #03 (§10.2) chứng minh dải 30–60 ký tự nuốt chi tiết 100%
 * (ca 43 ký tự cho kết quả giống stub 6/6) → hạ ngưỡng 50 → 30 cho đường
 * RULE CHUNG ĐÃ KHỚP (fix wave 4); đường fallback thuần giữ mốc 80
 * (GENERIC_LIMIT_MIN_MESSAGE) — lý do ở khối độ sâu trong
 * translateParentMessage.
 */
const GENERIC_DEPTH_MIN_MESSAGE = 30;
/** Tin rất dài mà vẫn không tách được chi tiết riêng: khai báo giới hạn ngay trong Ý thật. */
const GENERIC_LIMIT_MIN_MESSAGE = 80;

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
 *   các mẫu ĐÃ KHỚP (khoá của rule đang xét; đường fallback gỡ mọi khoá).
 *   Gỡ theo rule đã khớp là điểm chốt của Panel #03 §10.2: «Tối nay con
 *   bận» từng bị khoá 'con ban' của MỘT RULE KHÁC ăn mất 2/4 từ nên rơi
 *   khỏi ngưỡng và bị nuốt 100% ở ca 43 ký tự.
 * - chi tiết thứ nhất = đoạn đủ riêng dài nhất; chi tiết thứ hai = đoạn đủ
 *   riêng CUỐI CÙNG trong tin (khác đoạn thứ nhất) — vế kết thường là vế
 *   đau nhất («khỏi cần về ăn cơm với mẹ đâu»), bản Panel #02 chỉ trích
 *   một chi tiết nên mất hẳn vế này (bao phủ 1/2).
 * Cùng quy tắc với extractSalientDetails phía server (lib/server/engine.ts).
 */
function extractSalientDetails(
  message: string,
  stripKeys: readonly string[],
): { first: string | null; second: string | null } {
  const segments = message
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
    let residual = normalizeVi(segment).replace(/[^a-z0-9\s]/g, ' ');
    for (const key of stripKeys) residual = residual.split(key).join(' ');
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

export function translateParentMessage(input: TranslateInput): TranslateResult {
  const message = (input?.message ?? '').trim();
  // Validation ở tầng engine (KI-VAL-2, fix wave 3): engine tự chặn message
  // rỗng — trước đây chỉ lớp API local chặn hộ, gọi thẳng engine thì lọt.
  if (!message) throw new Error('Chưa có tin nhắn để dịch.');
  const speaker = input?.speaker ?? 'Mẹ';
  const context = input?.context ?? 'Khác';
  const addr = ADDRESSES[speaker];
  const normalized = normalizeVi(message);

  const matchedRule = matchRule(normalized, speaker);
  const rule: Rule = matchedRule ?? {
    id: 'fallback',
    keys: [],
    ...fallbackDefFor(normalized, speaker, context),
  };

  const fill = (text: string) =>
    text
      .replace(/\{X\}/g, addr.upper)
      .replace(/\{x\}/g, addr.lower)
      .replace(/\{S\}/g, addr.selfUpper)
      .replace(/\{s\}/g, addr.selfLower);
  const hint = CONTEXT_HINTS[context];

  const result: TranslateResult = {
    meaning: fill(rule.meaning),
    realWant: fill(rule.realWant) + (hint ? fill(hint) : ''),
    angerLevel: rule.angerLevel,
    dangerLabel: dangerLabelFor(rule.angerLevel),
    replies: rule.replies.map((r) => ({ label: r.label, text: fill(r.text) })),
    ...(rule.warning ? { warning: fill(rule.warning) } : {}),
  };

  // M-2 (Panel #02, D-3): độ sâu cho tin ở đường MẪU CHUNG phía client —
  // cùng quy tắc server: chỉ rule chung (không gắn vai) hoặc fallback; bổ
  // sung (a) hoàn cảnh đã chọn và (b) tối đa HAI chi tiết riêng trích
  // nguyên văn từ chính tin vào Ý thật / Điều muốn nghe / câu trả lời thứ
  // nhất + thứ hai, kèm câu lý do mức khi có vế thứ hai. Ngưỡng theo loại
  // đường (Panel #03 §10.2): rule chung đã khớp → 30 ký tự; fallback thuần
  // → 80 (corpus vàng khoá nguyên văn các fallback 31–48 ký tự dạng một ý
  // — ở đó "chi tiết riêng" chỉ là cả tin tự trích chính nó). Rule gắn
  // đúng vai và tin ngắn giữ nguyên (corpus vàng ở
  // tests/golden-corpus-parents).
  const isGenericPath = !matchedRule || !matchedRule.roles;
  const depthMin = matchedRule ? GENERIC_DEPTH_MIN_MESSAGE : GENERIC_LIMIT_MIN_MESSAGE;
  if (isGenericPath && message.length >= depthMin) {
    const { first: detail, second: detail2 } = extractSalientDetails(
      message,
      matchedRule ? matchedRule.keys : CLIENT_RULE_KEYS,
    );
    if (detail) {
      result.meaning += ` Chi tiết riêng trong tin này: “${detail}”.`;
      if (context !== 'Khác') {
        result.meaning += ` Tin thuộc hoàn cảnh “${context}” bạn đã chọn, nên phần cần đáp lại là chi tiết riêng đó trong đúng hoàn cảnh này, không chỉ là câu mẫu chung.`;
        result.realWant += ` Khi đáp, nhắc thẳng tới chi tiết “${detail}” và chốt một hướng cụ thể thuộc hoàn cảnh ${context}, thay vì trả lời chung chung.`;
      } else {
        result.realWant += ` Khi đáp, nhắc thẳng tới chi tiết “${detail}” và chốt một hướng cụ thể, thay vì trả lời chung chung.`;
      }
      result.replies[0] = {
        ...result.replies[0],
        text:
          result.replies[0].text +
          fill(` Riêng chuyện “${detail}”, {s} sẽ nói rõ thêm với {x} cho chắc.`),
      };
      if (detail2) {
        result.meaning += ` Tin còn một vế riêng nữa: “${detail2}”. Mức căng thẳng chấm theo vế chính của câu — vế riêng là chi tiết cá nhân, app nhắc lại để bạn đáp cho trúng chứ không tính vào mức.`;
        result.replies[1] = {
          ...result.replies[1],
          text:
            result.replies[1].text +
            fill(` Riêng chuyện “${detail2}”, {s} sẽ nói rõ thêm với {x} cho chắc.`),
        };
      }
    } else if (message.length >= GENERIC_LIMIT_MIN_MESSAGE) {
      result.meaning +=
        context !== 'Khác'
          ? ` Tin này dài nhưng app chưa tách được chi tiết riêng nào ngoài mẫu chung ở hoàn cảnh “${context}” bạn đã chọn, nên phần đọc trên chỉ chắc ở mức mẫu chung cho hoàn cảnh đó.`
          : ' Tin này dài nhưng app chưa tách được chi tiết riêng nào ngoài mẫu chung, nên phần đọc trên chỉ chắc ở mức mẫu chung.';
    }
  }
  return result;
}
