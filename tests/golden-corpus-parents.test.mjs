// Corpus vàng (golden corpus) — khoá byte-identical output vai bố/mẹ SAU fix M-1
// (viết thường đầu câu) và TRƯỚC fix M-2 (độ sâu tin dài, đường mẫu chung).
// Sinh từ chính engine ở trạng thái sau-M-1 (HEAD 1750f71 + 18 sửa {p}->{P} đầu câu).
// Quy tắc: mọi ca ở đây là input NGẮN/điển hình của pattern riêng hoặc fallback của
// vai bố/mẹ — M-2 chỉ được đổi output cho tin DÀI giàu chi tiết ở đường mẫu chung,
// nên toàn bộ corpus này phải giữ nguyên từng byte. Đỏ ở đây = đã phá đường riêng.
//
// Cập nhật fix wave 3 (2026-10-23, CQ-14 hợp nhất hai engine — server là nguồn
// sự thật): SERVER_GOLDEN giữ nguyên từng byte. CLIENT_GOLDEN thay đổi ĐÚNG ở
// các ca mà client được căn theo server: rule tuy-con (meaning + anger 2->3,
// ×3 vai), rule bao-gio-ve (meaning + anger 1->2, ×3 vai), và 6 ca fallback
// (fallback theo nhóm chủ đề mirror FALLBACKS server thay bản đọc chung cũ).
// Mọi ca client còn lại giữ nguyên từng byte; parity suite ở
// tests-evidence/engine-parity.test.mjs là bằng chứng cho các thay đổi này.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateDichbome } from '../lib/server/engine.ts';
import { translateParentMessage } from '../components/dichbome/lib/translate.ts';

const SERVER_GOLDEN = [
  {
    note: 'entry:tuy-con/me',
    input: {
      message: 'Tùy con',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Tùy con' nghe như cho tự quyết, nhưng đa phần mẹ đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý mẹ đang nghĩ không.",
      realWant:
        'Muốn con chọn phương án mẹ thấy yên tâm nhất, hoặc ít nhất ngồi xuống bàn thêm một câu trước khi quyết — chứ không phải quyết xong rồi mới báo lại.',
      angerLevel: 62,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con cũng đang phân vân. Theo mẹ thì cách nào hợp hơn ạ? Mẹ góp ý cho con rồi con quyết.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cảm ơn mẹ. Con đang tính thế này, mẹ nghe thử xem có ổn không, thiếu gì mẹ bảo con.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ chuyện này con chưa quyết vội đâu. Tối con gọi về, cả nhà mình bàn kỹ rồi con mới làm ạ.',
        },
      ],
      warning:
        "Nghe 'tùy' mà quyết luôn trong 5 giây rồi thông báo lại là rất dễ ăn dỗi dài hạn. Hỏi thêm đúng một câu là hạ nhiệt được kha khá.",
    },
  },
  {
    note: 'entry:tuy-con/bo',
    input: {
      message: 'Tùy con',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Tùy con' nghe như cho tự quyết, nhưng đa phần bố đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý bố đang nghĩ không.",
      realWant:
        'Muốn con chọn phương án bố thấy yên tâm nhất, hoặc ít nhất ngồi xuống bàn thêm một câu trước khi quyết — chứ không phải quyết xong rồi mới báo lại.',
      angerLevel: 62,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con cũng đang phân vân. Theo bố thì cách nào hợp hơn ạ? Bố góp ý cho con rồi con quyết.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cảm ơn bố. Con đang tính thế này, bố nghe thử xem có ổn không, thiếu gì bố bảo con.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ chuyện này con chưa quyết vội đâu. Tối con gọi về, cả nhà mình bàn kỹ rồi con mới làm ạ.',
        },
      ],
      warning:
        "Nghe 'tùy' mà quyết luôn trong 5 giây rồi thông báo lại là rất dễ ăn dỗi dài hạn. Hỏi thêm đúng một câu là hạ nhiệt được kha khá.",
    },
  },
  {
    note: 'entry:tuy-con/both',
    input: {
      message: 'Tùy con',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Tùy con' nghe như cho tự quyết, nhưng đa phần bố mẹ đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý bố mẹ đang nghĩ không.",
      realWant:
        'Muốn con chọn phương án bố mẹ thấy yên tâm nhất, hoặc ít nhất ngồi xuống bàn thêm một câu trước khi quyết — chứ không phải quyết xong rồi mới báo lại.',
      angerLevel: 62,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con cũng đang phân vân. Theo bố mẹ thì cách nào hợp hơn ạ? Bố mẹ góp ý cho con rồi con quyết.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cảm ơn bố mẹ. Con đang tính thế này, bố mẹ nghe thử xem có ổn không, thiếu gì bố mẹ bảo con.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ chuyện này con chưa quyết vội đâu. Tối con gọi về, cả nhà mình bàn kỹ rồi con mới làm ạ.',
        },
      ],
      warning:
        "Nghe 'tùy' mà quyết luôn trong 5 giây rồi thông báo lại là rất dễ ăn dỗi dài hạn. Hỏi thêm đúng một câu là hạ nhiệt được kha khá.",
    },
  },
  {
    note: 'entry:khong-buon/me',
    input: {
      message: 'Không buồn đâu',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "Càng khẳng định 'không buồn' thì càng là đang buồn. Mẹ nói vậy để con khỏi khó xử thôi, chứ trong lòng tủi thân rõ ràng — câu nói ngược kinh điển của phụ huynh Việt.",
      realWant:
        "Muốn con ở lại thêm một lúc, hoặc hứa một dịp cụ thể sẽ về bù. Điều mẹ sợ nhất là câu 'hôm nào con về' mà không có ngày tháng.",
      angerLevel: 78,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Thôi, con ở lại với mẹ thêm chút nữa. Con đi muộn một tí cũng không sao đâu ạ.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết mẹ nói vậy cho con yên tâm thôi. Cuối tháng này con sắp xếp về hẳn một ngày với mẹ nhé.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ lần này con phải đi thật, nhưng con hứa cuối tuần con gọi video với mẹ. Con nhớ mẹ nhiều.',
        },
      ],
      warning:
        "Tin là 'không buồn thật' rồi đi luôn thì chuyện này sẽ được nhắc lại vào một dịp không ngờ tới. Ở lại thêm 30 phút thôi cũng khác hẳn.",
    },
  },
  {
    note: 'entry:khong-buon/bo',
    input: {
      message: 'Không buồn đâu',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "Càng khẳng định 'không buồn' thì càng là đang buồn. Bố nói vậy để con khỏi khó xử thôi, chứ trong lòng tủi thân rõ ràng — câu nói ngược kinh điển của phụ huynh Việt.",
      realWant:
        "Muốn con ở lại thêm một lúc, hoặc hứa một dịp cụ thể sẽ về bù. Điều bố sợ nhất là câu 'hôm nào con về' mà không có ngày tháng.",
      angerLevel: 78,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Thôi, con ở lại với bố thêm chút nữa. Con đi muộn một tí cũng không sao đâu ạ.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết bố nói vậy cho con yên tâm thôi. Cuối tháng này con sắp xếp về hẳn một ngày với bố nhé.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ lần này con phải đi thật, nhưng con hứa cuối tuần con gọi video với bố. Con nhớ bố nhiều.',
        },
      ],
      warning:
        "Tin là 'không buồn thật' rồi đi luôn thì chuyện này sẽ được nhắc lại vào một dịp không ngờ tới. Ở lại thêm 30 phút thôi cũng khác hẳn.",
    },
  },
  {
    note: 'entry:khong-buon/both',
    input: {
      message: 'Không buồn đâu',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "Càng khẳng định 'không buồn' thì càng là đang buồn. Bố mẹ nói vậy để con khỏi khó xử thôi, chứ trong lòng tủi thân rõ ràng — câu nói ngược kinh điển của phụ huynh Việt.",
      realWant:
        "Muốn con ở lại thêm một lúc, hoặc hứa một dịp cụ thể sẽ về bù. Điều bố mẹ sợ nhất là câu 'hôm nào con về' mà không có ngày tháng.",
      angerLevel: 78,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Thôi, con ở lại với bố mẹ thêm chút nữa. Con đi muộn một tí cũng không sao đâu ạ.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết bố mẹ nói vậy cho con yên tâm thôi. Cuối tháng này con sắp xếp về hẳn một ngày với bố mẹ nhé.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ lần này con phải đi thật, nhưng con hứa cuối tuần con gọi video với bố mẹ. Con nhớ bố mẹ nhiều.',
        },
      ],
      warning:
        "Tin là 'không buồn thật' rồi đi luôn thì chuyện này sẽ được nhắc lại vào một dịp không ngờ tới. Ở lại thêm 30 phút thôi cũng khác hẳn.",
    },
  },
  {
    note: 'entry:gia-roi/me',
    input: {
      message: 'Già rồi biết gì đâu',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu này nghe như buông xuôi nhưng thực ra là tự ái. Mẹ thấy ý kiến của mình không được coi trọng nên rút lui bằng một câu rất nhẹ mà rất đau.',
      realWant:
        'Muốn con lắng nghe và coi trọng kinh nghiệm của mẹ một chút. Không cần làm theo hết, chỉ cần đừng gạt đi ngay.',
      angerLevel: 72,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Ơ, mẹ nói thế con buồn đấy. Chuyện này mẹ có kinh nghiệm hơn con nhiều, mẹ chỉ cho con với.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con xin lỗi, nãy con nói nhanh quá. Ý mẹ là nên làm thế nào ạ, con nghe đây.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, vậy để con kể lại đầu đuôi cho mẹ nghe, rồi mẹ thấy sao thì bảo con.',
        },
      ],
      warning:
        'Đây là lúc không nên tranh luận đúng sai nữa. Ngồi xuống nghe cho hết đã, chuyện tính sau.',
    },
  },
  {
    note: 'entry:gia-roi/bo',
    input: {
      message: 'Già rồi biết gì đâu',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu này nghe như buông xuôi nhưng thực ra là tự ái. Bố thấy ý kiến của mình không được coi trọng nên rút lui bằng một câu rất nhẹ mà rất đau.',
      realWant:
        'Muốn con lắng nghe và coi trọng kinh nghiệm của bố một chút. Không cần làm theo hết, chỉ cần đừng gạt đi ngay.',
      angerLevel: 72,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Ơ, bố nói thế con buồn đấy. Chuyện này bố có kinh nghiệm hơn con nhiều, bố chỉ cho con với.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con xin lỗi, nãy con nói nhanh quá. Ý bố là nên làm thế nào ạ, con nghe đây.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, vậy để con kể lại đầu đuôi cho bố nghe, rồi bố thấy sao thì bảo con.',
        },
      ],
      warning:
        'Đây là lúc không nên tranh luận đúng sai nữa. Ngồi xuống nghe cho hết đã, chuyện tính sau.',
    },
  },
  {
    note: 'entry:gia-roi/both',
    input: {
      message: 'Già rồi biết gì đâu',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu này nghe như buông xuôi nhưng thực ra là tự ái. Bố mẹ thấy ý kiến của mình không được coi trọng nên rút lui bằng một câu rất nhẹ mà rất đau.',
      realWant:
        'Muốn con lắng nghe và coi trọng kinh nghiệm của bố mẹ một chút. Không cần làm theo hết, chỉ cần đừng gạt đi ngay.',
      angerLevel: 72,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Ơ, bố mẹ nói thế con buồn đấy. Chuyện này bố mẹ có kinh nghiệm hơn con nhiều, bố mẹ chỉ cho con với.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con xin lỗi, nãy con nói nhanh quá. Ý bố mẹ là nên làm thế nào ạ, con nghe đây.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, vậy để con kể lại đầu đuôi cho bố mẹ nghe, rồi bố mẹ thấy sao thì bảo con.',
        },
      ],
      warning:
        'Đây là lúc không nên tranh luận đúng sai nữa. Ngồi xuống nghe cho hết đã, chuyện tính sau.',
    },
  },
  {
    note: 'entry:khong-sao/me',
    input: {
      message: 'Không sao đâu',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Không sao đâu' là câu cửa miệng khi có sao mà không muốn nói. Mẹ sợ con lo, sợ con tốn công nên gói hết vào hai chữ 'không sao' — nghe càng thản nhiên càng nên hỏi lại.",
      realWant:
        "Muốn con hỏi thêm một câu nữa và để ý một chút, chứ đừng tin ngay rồi thôi. Nhiều khi chỉ cần con quan tâm là 'sao' tự hết một nửa.",
      angerLevel: 70,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Thật không ạ? Mẹ kể con nghe đi, có gì con lo cùng mẹ.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, mẹ cứ nói thật với con. Con lớn rồi, chuyện gì con cũng nghe được ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Vậy để con gọi về nói chuyện với mẹ một lúc nhé, nghe giọng mẹ con mới yên tâm.',
        },
      ],
      warning:
        "Câu này trả lời 'dạ vâng' rồi bỏ qua là dễ bỏ lỡ tín hiệu nhất. Hỏi lại đúng một câu 'thật không ạ?' là biết ngay.",
    },
  },
  {
    note: 'entry:khong-sao/bo',
    input: {
      message: 'Không sao đâu',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Không sao đâu' là câu cửa miệng khi có sao mà không muốn nói. Bố sợ con lo, sợ con tốn công nên gói hết vào hai chữ 'không sao' — nghe càng thản nhiên càng nên hỏi lại.",
      realWant:
        "Muốn con hỏi thêm một câu nữa và để ý một chút, chứ đừng tin ngay rồi thôi. Nhiều khi chỉ cần con quan tâm là 'sao' tự hết một nửa.",
      angerLevel: 70,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Thật không ạ? Bố kể con nghe đi, có gì con lo cùng bố.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, bố cứ nói thật với con. Con lớn rồi, chuyện gì con cũng nghe được ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Vậy để con gọi về nói chuyện với bố một lúc nhé, nghe giọng bố con mới yên tâm.',
        },
      ],
      warning:
        "Câu này trả lời 'dạ vâng' rồi bỏ qua là dễ bỏ lỡ tín hiệu nhất. Hỏi lại đúng một câu 'thật không ạ?' là biết ngay.",
    },
  },
  {
    note: 'entry:khong-sao/both',
    input: {
      message: 'Không sao đâu',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Không sao đâu' là câu cửa miệng khi có sao mà không muốn nói. Bố mẹ sợ con lo, sợ con tốn công nên gói hết vào hai chữ 'không sao' — nghe càng thản nhiên càng nên hỏi lại.",
      realWant:
        "Muốn con hỏi thêm một câu nữa và để ý một chút, chứ đừng tin ngay rồi thôi. Nhiều khi chỉ cần con quan tâm là 'sao' tự hết một nửa.",
      angerLevel: 70,
      dangerLabel: 'Giận ngầm — cần hạ nhiệt sớm',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Thật không ạ? Bố mẹ kể con nghe đi, có gì con lo cùng bố mẹ.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, bố mẹ cứ nói thật với con. Con lớn rồi, chuyện gì con cũng nghe được ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Vậy để con gọi về nói chuyện với bố mẹ một lúc nhé, nghe giọng bố mẹ con mới yên tâm.',
        },
      ],
      warning:
        "Câu này trả lời 'dạ vâng' rồi bỏ qua là dễ bỏ lỡ tín hiệu nhất. Hỏi lại đúng một câu 'thật không ạ?' là biết ngay.",
    },
  },
  {
    note: 'entry:khong-can-tien/me',
    input: {
      message: 'Không cần gửi tiền đâu',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Nói không cần tiền thường là sợ con tốn kém, chứ ít khi là không cần thật. Mẹ hay tính phần thiệt về mình: con còn phải lo nhà cửa, ăn uống, đủ thứ trên vai.',
      realWant:
        'Muốn con giữ tiền lo cho bản thân, nhưng trong lòng vẫn rất vui nếu con nhớ tới. Quan trọng là tấm lòng, số tiền xếp sau.',
      angerLevel: 25,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con gửi ít thôi, mẹ cầm mua gì ngon ngon ăn nhé. Con lo được, mẹ đừng lo cho con.',
        },
        {
          label: 'Khéo nhất',
          text: 'Tiền này là con biếu mẹ, không phải tiền để dành đâu ạ. Mẹ nhận cho con vui.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ vậy tháng này con không gửi tiền, con gửi đồ về cho mẹ nhé. Mẹ thích ăn gì con mua.',
        },
      ],
    },
  },
  {
    note: 'entry:khong-can-tien/bo',
    input: {
      message: 'Không cần gửi tiền đâu',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Nói không cần tiền thường là sợ con tốn kém, chứ ít khi là không cần thật. Bố hay tính phần thiệt về mình: con còn phải lo nhà cửa, ăn uống, đủ thứ trên vai.',
      realWant:
        'Muốn con giữ tiền lo cho bản thân, nhưng trong lòng vẫn rất vui nếu con nhớ tới. Quan trọng là tấm lòng, số tiền xếp sau.',
      angerLevel: 25,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con gửi ít thôi, bố cầm mua gì ngon ngon ăn nhé. Con lo được, bố đừng lo cho con.',
        },
        {
          label: 'Khéo nhất',
          text: 'Tiền này là con biếu bố, không phải tiền để dành đâu ạ. Bố nhận cho con vui.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ vậy tháng này con không gửi tiền, con gửi đồ về cho bố nhé. Bố thích ăn gì con mua.',
        },
      ],
    },
  },
  {
    note: 'entry:khong-can-tien/both',
    input: {
      message: 'Không cần gửi tiền đâu',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Nói không cần tiền thường là sợ con tốn kém, chứ ít khi là không cần thật. Bố mẹ hay tính phần thiệt về mình: con còn phải lo nhà cửa, ăn uống, đủ thứ trên vai.',
      realWant:
        'Muốn con giữ tiền lo cho bản thân, nhưng trong lòng vẫn rất vui nếu con nhớ tới. Quan trọng là tấm lòng, số tiền xếp sau.',
      angerLevel: 25,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con gửi ít thôi, bố mẹ cầm mua gì ngon ngon ăn nhé. Con lo được, bố mẹ đừng lo cho con.',
        },
        {
          label: 'Khéo nhất',
          text: 'Tiền này là con biếu bố mẹ, không phải tiền để dành đâu ạ. Bố mẹ nhận cho con vui.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ vậy tháng này con không gửi tiền, con gửi đồ về cho bố mẹ nhé. Bố mẹ thích ăn gì con mua.',
        },
      ],
    },
  },
  {
    note: 'entry:tien-khong-quan-trong/me',
    input: {
      message: 'Tiền bạc không quan trọng',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Tiền bạc không quan trọng' mới là câu mở đầu — câu quan trọng nằm ngay sau đó, thường là chuyện tình cảm, thời gian hoặc sự có mặt của con. Nghe hết câu mới hiểu được ý mẹ.",
      realWant:
        'Muốn con hiểu là mẹ cần con về mặt tình cảm hơn vật chất: một cuộc gọi, một bữa cơm, một lần về nhà đúng hẹn.',
      angerLevel: 35,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con hiểu ạ. Tiền thì con lo được, quan trọng là con phải dành thời gian cho mẹ nhiều hơn.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, vậy cuối tuần này con về ăn cơm với mẹ nhé, lâu rồi nhà mình chưa ngồi với nhau.',
        },
        {
          label: 'An toàn nhất',
          text: 'Con cảm ơn mẹ. Có gì mẹ cứ nói thẳng với con, con sửa được ạ.',
        },
      ],
    },
  },
  {
    note: 'entry:tien-khong-quan-trong/bo',
    input: {
      message: 'Tiền bạc không quan trọng',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Tiền bạc không quan trọng' mới là câu mở đầu — câu quan trọng nằm ngay sau đó, thường là chuyện tình cảm, thời gian hoặc sự có mặt của con. Nghe hết câu mới hiểu được ý bố.",
      realWant:
        'Muốn con hiểu là bố cần con về mặt tình cảm hơn vật chất: một cuộc gọi, một bữa cơm, một lần về nhà đúng hẹn.',
      angerLevel: 35,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con hiểu ạ. Tiền thì con lo được, quan trọng là con phải dành thời gian cho bố nhiều hơn.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, vậy cuối tuần này con về ăn cơm với bố nhé, lâu rồi nhà mình chưa ngồi với nhau.',
        },
        {
          label: 'An toàn nhất',
          text: 'Con cảm ơn bố. Có gì bố cứ nói thẳng với con, con sửa được ạ.',
        },
      ],
    },
  },
  {
    note: 'entry:tien-khong-quan-trong/both',
    input: {
      message: 'Tiền bạc không quan trọng',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Tiền bạc không quan trọng' mới là câu mở đầu — câu quan trọng nằm ngay sau đó, thường là chuyện tình cảm, thời gian hoặc sự có mặt của con. Nghe hết câu mới hiểu được ý bố mẹ.",
      realWant:
        'Muốn con hiểu là bố mẹ cần con về mặt tình cảm hơn vật chất: một cuộc gọi, một bữa cơm, một lần về nhà đúng hẹn.',
      angerLevel: 35,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con hiểu ạ. Tiền thì con lo được, quan trọng là con phải dành thời gian cho bố mẹ nhiều hơn.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, vậy cuối tuần này con về ăn cơm với bố mẹ nhé, lâu rồi nhà mình chưa ngồi với nhau.',
        },
        {
          label: 'An toàn nhất',
          text: 'Con cảm ơn bố mẹ. Có gì bố mẹ cứ nói thẳng với con, con sửa được ạ.',
        },
      ],
    },
  },
  {
    note: 'entry:con-nha-nguoi-ta/me',
    input: {
      message: 'Con nhà người ta giỏi lắm',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Con nhà người ta' là nhân vật quốc dân không bao giờ lộ diện nhưng thành tích thì vô địch. Đây là cách mẹ so sánh để thúc con cố gắng, dù biết nói ra con sẽ khó chịu.",
      realWant:
        'Muốn con có động lực phấn đấu và cho mẹ một tin vui để yên tâm — không nhất thiết phải bằng người ta, chỉ cần thấy con đang tiến lên.',
      angerLevel: 55,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con cũng đang cố đây ạ. Tháng này con mới được giao thêm việc, để con làm tốt rồi con khoe mẹ.',
        },
        {
          label: 'Khéo nhất',
          text: "Hì, 'con nhà người ta' giỏi thật, mà con của mẹ cũng đang cố từng ngày đây ạ.",
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ con biết mẹ lo cho con. Con có kế hoạch rồi, để con làm dần cho mẹ yên tâm.',
        },
      ],
      warning:
        "Đừng bật lại bằng cách kể khuyết điểm của 'con nhà người ta'. Khoe một tiến bộ nhỏ của mình là dập được bài này ngay.",
    },
  },
  {
    note: 'entry:con-nha-nguoi-ta/bo',
    input: {
      message: 'Con nhà người ta giỏi lắm',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Con nhà người ta' là nhân vật quốc dân không bao giờ lộ diện nhưng thành tích thì vô địch. Đây là cách bố so sánh để thúc con cố gắng, dù biết nói ra con sẽ khó chịu.",
      realWant:
        'Muốn con có động lực phấn đấu và cho bố một tin vui để yên tâm — không nhất thiết phải bằng người ta, chỉ cần thấy con đang tiến lên.',
      angerLevel: 55,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con cũng đang cố đây ạ. Tháng này con mới được giao thêm việc, để con làm tốt rồi con khoe bố.',
        },
        {
          label: 'Khéo nhất',
          text: "Hì, 'con nhà người ta' giỏi thật, mà con của bố cũng đang cố từng ngày đây ạ.",
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ con biết bố lo cho con. Con có kế hoạch rồi, để con làm dần cho bố yên tâm.',
        },
      ],
      warning:
        "Đừng bật lại bằng cách kể khuyết điểm của 'con nhà người ta'. Khoe một tiến bộ nhỏ của mình là dập được bài này ngay.",
    },
  },
  {
    note: 'entry:con-nha-nguoi-ta/both',
    input: {
      message: 'Con nhà người ta giỏi lắm',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Con nhà người ta' là nhân vật quốc dân không bao giờ lộ diện nhưng thành tích thì vô địch. Đây là cách bố mẹ so sánh để thúc con cố gắng, dù biết nói ra con sẽ khó chịu.",
      realWant:
        'Muốn con có động lực phấn đấu và cho bố mẹ một tin vui để yên tâm — không nhất thiết phải bằng người ta, chỉ cần thấy con đang tiến lên.',
      angerLevel: 55,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, con cũng đang cố đây ạ. Tháng này con mới được giao thêm việc, để con làm tốt rồi con khoe bố mẹ.',
        },
        {
          label: 'Khéo nhất',
          text: "Hì, 'con nhà người ta' giỏi thật, mà con của bố mẹ cũng đang cố từng ngày đây ạ.",
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ con biết bố mẹ lo cho con. Con có kế hoạch rồi, để con làm dần cho bố mẹ yên tâm.',
        },
      ],
      warning:
        "Đừng bật lại bằng cách kể khuyết điểm của 'con nhà người ta'. Khoe một tiến bộ nhỏ của mình là dập được bài này ngay.",
    },
  },
  {
    note: 'entry:bao-gio-ve/me',
    input: {
      message: 'Bao giờ thì về?',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — mẹ muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
      realWant:
        "Muốn một mốc thời gian cụ thể để chuẩn bị cơm nước, dọn phòng, và kể với hàng xóm là 'con tôi sắp về'.",
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, cuối tháng này con về ạ. Con đặt vé xong con báo mẹ ngay.',
        },
        {
          label: 'Khéo nhất',
          text: 'Chắc khoảng 2 tuần nữa con về được. Về con ở nhà mấy hôm với mẹ luôn.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ để con xin nghỉ phép rồi con báo ngày chắc chắn cho mẹ. Con cũng nhớ nhà lắm.',
        },
      ],
    },
  },
  {
    note: 'entry:bao-gio-ve/bo',
    input: {
      message: 'Bao giờ thì về?',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — bố muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
      realWant:
        "Muốn một mốc thời gian cụ thể để chuẩn bị cơm nước, dọn phòng, và kể với hàng xóm là 'con tôi sắp về'.",
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, cuối tháng này con về ạ. Con đặt vé xong con báo bố ngay.',
        },
        {
          label: 'Khéo nhất',
          text: 'Chắc khoảng 2 tuần nữa con về được. Về con ở nhà mấy hôm với bố luôn.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ để con xin nghỉ phép rồi con báo ngày chắc chắn cho bố. Con cũng nhớ nhà lắm.',
        },
      ],
    },
  },
  {
    note: 'entry:bao-gio-ve/both',
    input: {
      message: 'Bao giờ thì về?',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — bố mẹ muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
      realWant:
        "Muốn một mốc thời gian cụ thể để chuẩn bị cơm nước, dọn phòng, và kể với hàng xóm là 'con tôi sắp về'.",
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, cuối tháng này con về ạ. Con đặt vé xong con báo bố mẹ ngay.',
        },
        {
          label: 'Khéo nhất',
          text: 'Chắc khoảng 2 tuần nữa con về được. Về con ở nhà mấy hôm với bố mẹ luôn.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ để con xin nghỉ phép rồi con báo ngày chắc chắn cho bố mẹ. Con cũng nhớ nhà lắm.',
        },
      ],
    },
  },
  {
    note: 'entry:an-com-chua/me',
    input: {
      message: 'Ăn cơm chưa?',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Ăn cơm chưa?' rất ít khi chỉ là chuyện cơm. Đó là cách mẹ kiểm tra hôm nay con có ổn không, có tự lo cho bản thân không — quan tâm nhưng gói trong chuyện ăn uống.",
      realWant:
        'Muốn biết con ăn uống đàng hoàng và tiện thể nghe giọng con một lúc. Trả lời qua loa một chữ là mẹ lại lo thêm.',
      angerLevel: 8,
      dangerLabel: 'An toàn — thương là chính',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con ăn rồi ạ, hôm nay con ăn cơm với cá kho. Mẹ ăn chưa, nay nhà mình ăn gì ạ?',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con vừa ăn xong. Để con gọi video, con khoe bữa cơm của con cho mẹ xem.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ con chưa ăn, giờ con đi ăn đây. Mẹ nhắc là con thấy đói luôn.',
        },
      ],
    },
  },
  {
    note: 'entry:an-com-chua/bo',
    input: {
      message: 'Ăn cơm chưa?',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Ăn cơm chưa?' rất ít khi chỉ là chuyện cơm. Đó là cách bố kiểm tra hôm nay con có ổn không, có tự lo cho bản thân không — quan tâm nhưng gói trong chuyện ăn uống.",
      realWant:
        'Muốn biết con ăn uống đàng hoàng và tiện thể nghe giọng con một lúc. Trả lời qua loa một chữ là bố lại lo thêm.',
      angerLevel: 8,
      dangerLabel: 'An toàn — thương là chính',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con ăn rồi ạ, hôm nay con ăn cơm với cá kho. Bố ăn chưa, nay nhà mình ăn gì ạ?',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con vừa ăn xong. Để con gọi video, con khoe bữa cơm của con cho bố xem.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ con chưa ăn, giờ con đi ăn đây. Bố nhắc là con thấy đói luôn.',
        },
      ],
    },
  },
  {
    note: 'entry:an-com-chua/both',
    input: {
      message: 'Ăn cơm chưa?',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        "'Ăn cơm chưa?' rất ít khi chỉ là chuyện cơm. Đó là cách bố mẹ kiểm tra hôm nay con có ổn không, có tự lo cho bản thân không — quan tâm nhưng gói trong chuyện ăn uống.",
      realWant:
        'Muốn biết con ăn uống đàng hoàng và tiện thể nghe giọng con một lúc. Trả lời qua loa một chữ là bố mẹ lại lo thêm.',
      angerLevel: 8,
      dangerLabel: 'An toàn — thương là chính',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con ăn rồi ạ, hôm nay con ăn cơm với cá kho. Bố mẹ ăn chưa, nay nhà mình ăn gì ạ?',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con vừa ăn xong. Để con gọi video, con khoe bữa cơm của con cho bố mẹ xem.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ con chưa ăn, giờ con đi ăn đây. Bố mẹ nhắc là con thấy đói luôn.',
        },
      ],
    },
  },
  {
    note: 'entry:ngan-gon/me',
    input: {
      message: 'Ừ',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Một chữ mà nặng cả buổi tối. Trả lời càng ngắn thì trong đầu mẹ càng nhiều chuyện — thường là đang không vui nhưng chưa muốn nói, hoặc đang chờ con tự nhận ra điều gì đó.',
      realWant: "Muốn con tinh ý hỏi thêm một câu, chứ đừng thấy 'ừ' là tưởng mọi chuyện đã xong.",
      angerLevel: 58,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ sao thế ạ? Có chuyện gì mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Nghe giọng mẹ hình như đang không vui. Con làm gì sai mẹ cứ nói thẳng với con.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi lại cho mẹ nói chuyện đàng hoàng nhé.',
        },
      ],
      warning:
        'Đừng đáp lại bằng một chữ tương tự. Hai bên mỗi người một chữ là cuộc trò chuyện đi vào ngõ cụt.',
    },
  },
  {
    note: 'entry:ngan-gon/bo',
    input: {
      message: 'Ừ',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Một chữ mà nặng cả buổi tối. Trả lời càng ngắn thì trong đầu bố càng nhiều chuyện — thường là đang không vui nhưng chưa muốn nói, hoặc đang chờ con tự nhận ra điều gì đó.',
      realWant: "Muốn con tinh ý hỏi thêm một câu, chứ đừng thấy 'ừ' là tưởng mọi chuyện đã xong.",
      angerLevel: 58,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố sao thế ạ? Có chuyện gì bố kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Nghe giọng bố hình như đang không vui. Con làm gì sai bố cứ nói thẳng với con.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi lại cho bố nói chuyện đàng hoàng nhé.',
        },
      ],
      warning:
        'Đừng đáp lại bằng một chữ tương tự. Hai bên mỗi người một chữ là cuộc trò chuyện đi vào ngõ cụt.',
    },
  },
  {
    note: 'entry:ngan-gon/both',
    input: {
      message: 'Ừ',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Một chữ mà nặng cả buổi tối. Trả lời càng ngắn thì trong đầu bố mẹ càng nhiều chuyện — thường là đang không vui nhưng chưa muốn nói, hoặc đang chờ con tự nhận ra điều gì đó.',
      realWant: "Muốn con tinh ý hỏi thêm một câu, chứ đừng thấy 'ừ' là tưởng mọi chuyện đã xong.",
      angerLevel: 58,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố mẹ sao thế ạ? Có chuyện gì bố mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Nghe giọng bố mẹ hình như đang không vui. Con làm gì sai bố mẹ cứ nói thẳng với con.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi lại cho bố mẹ nói chuyện đàng hoàng nhé.',
        },
      ],
      warning:
        'Đừng đáp lại bằng một chữ tương tự. Hai bên mỗi người một chữ là cuộc trò chuyện đi vào ngõ cụt.',
    },
  },
  {
    note: 'fallback-cat:tien/me',
    input: {
      message: 'Tháng này tiền nhà tăng nhiều rồi con ạ',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Nhắc tới tiền mà nói vòng vo là mẹ đang ngại mở lời. Phụ huynh rất ít khi nói thẳng chuyện tiền, thường chờ con tự hiểu và chủ động trước.',
      realWant:
        'Muốn con chủ động quan tâm chuyện tiền nong trong nhà, để mẹ khỏi phải mở miệng — với mẹ, mở miệng xin con là điều khó nhất.',
      angerLevel: 38,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện tiền mẹ cứ để con lo. Tháng này con gửi về một ít, mẹ cầm chi tiêu nhé.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cảm ơn mẹ lo cho con. Con vẫn ổn, mẹ đừng dè sẻn quá với bản thân.',
        },
        {
          label: 'An toàn nhất',
          text: 'Để con tính lại rồi con báo mẹ. Có gì thiếu mẹ cứ nói với con, đừng giấu.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:tien/bo',
    input: {
      message: 'Tháng này tiền nhà tăng nhiều rồi con ạ',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Nhắc tới tiền mà nói vòng vo là bố đang ngại mở lời. Phụ huynh rất ít khi nói thẳng chuyện tiền, thường chờ con tự hiểu và chủ động trước.',
      realWant:
        'Muốn con chủ động quan tâm chuyện tiền nong trong nhà, để bố khỏi phải mở miệng — với bố, mở miệng xin con là điều khó nhất.',
      angerLevel: 38,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện tiền bố cứ để con lo. Tháng này con gửi về một ít, bố cầm chi tiêu nhé.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cảm ơn bố lo cho con. Con vẫn ổn, bố đừng dè sẻn quá với bản thân.',
        },
        {
          label: 'An toàn nhất',
          text: 'Để con tính lại rồi con báo bố. Có gì thiếu bố cứ nói với con, đừng giấu.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:ve-que/me',
    input: {
      message: 'Năm nay về quê ăn Tết sớm không con',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Chuyện về quê, về nhà mà được nhắc tới là mẹ đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
      realWant:
        'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để mẹ có cái mà đợi.',
      angerLevel: 32,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho mẹ sớm.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với mẹ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Giờ con chưa về được, nhưng con gọi video với mẹ mỗi tối nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:ve-que/both',
    input: {
      message: 'Năm nay về quê ăn Tết sớm không con',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Chuyện về quê, về nhà mà được nhắc tới là bố mẹ đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
      realWant:
        'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để bố mẹ có cái mà đợi.',
      angerLevel: 32,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho bố mẹ sớm.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với bố mẹ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Giờ con chưa về được, nhưng con gọi video với bố mẹ mỗi tối nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:suc-khoe/me',
    input: {
      message: 'Dạo này hay mệt, đau lưng suốt con ạ',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Chuyện sức khỏe mà mẹ nói nhẹ đi thì phải nghe ngược lại. Phụ huynh hay giấu bệnh vì sợ con lo và sợ tốn tiền đi khám.',
      realWant: 'Muốn con hỏi kỹ và quan tâm thật, chứ không phải nghe qua loa rồi yên tâm luôn.',
      angerLevel: 24,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ nói thật với con đi, đau ở đâu, lâu chưa? Con đặt lịch khám cho mẹ nhé.',
        },
        {
          label: 'Khéo nhất',
          text: 'Để con gọi về hỏi kỹ. Chuyện này không để "kệ nó tự khỏi" được đâu ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, cuối tuần con về đưa mẹ đi khám. Mẹ đừng lo chuyện tiền, có con đây.',
        },
      ],
      warning:
        'Riêng sức khỏe thì đừng dịch vui nữa — gọi hỏi kỹ triệu chứng, hoặc sắp xếp về xem tận mắt cho chắc.',
    },
  },
  {
    note: 'fallback-cat:suc-khoe/bo',
    input: {
      message: 'Dạo này hay mệt, đau lưng suốt con ạ',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Chuyện sức khỏe mà bố nói nhẹ đi thì phải nghe ngược lại. Phụ huynh hay giấu bệnh vì sợ con lo và sợ tốn tiền đi khám.',
      realWant: 'Muốn con hỏi kỹ và quan tâm thật, chứ không phải nghe qua loa rồi yên tâm luôn.',
      angerLevel: 24,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố nói thật với con đi, đau ở đâu, lâu chưa? Con đặt lịch khám cho bố nhé.',
        },
        {
          label: 'Khéo nhất',
          text: 'Để con gọi về hỏi kỹ. Chuyện này không để "kệ nó tự khỏi" được đâu ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, cuối tuần con về đưa bố đi khám. Bố đừng lo chuyện tiền, có con đây.',
        },
      ],
      warning:
        'Riêng sức khỏe thì đừng dịch vui nữa — gọi hỏi kỹ triệu chứng, hoặc sắp xếp về xem tận mắt cho chắc.',
    },
  },
  {
    note: 'fallback-cat:tinh-cam/me',
    input: {
      message: 'Chuyện cưới xin tính đến đâu rồi con',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Chuyện người yêu, cưới xin mà mẹ nhắc khéo là đang sốt ruột thay con, nhưng sợ nói thẳng thì con áp lực nên cứ bóng gió mãi.',
      realWant:
        'Muốn biết con có tính chuyện lâu dài chưa để mẹ yên tâm, và muốn được con chia sẻ như người trong nhà chứ không phải người ngoài.',
      angerLevel: 42,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện này con có tính rồi ạ. Khi nào chắc chắn con thưa chuyện với mẹ đầu tiên.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết mẹ lo cho con. Mẹ cứ yên tâm, con không để mẹ phải nhắc mãi đâu.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con kể mẹ nghe từ từ. Mẹ nghe xong cho con ý kiến nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:tinh-cam/both',
    input: {
      message: 'Chuyện cưới xin tính đến đâu rồi con',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Chuyện người yêu, cưới xin mà bố mẹ nhắc khéo là đang sốt ruột thay con, nhưng sợ nói thẳng thì con áp lực nên cứ bóng gió mãi.',
      realWant:
        'Muốn biết con có tính chuyện lâu dài chưa để bố mẹ yên tâm, và muốn được con chia sẻ như người trong nhà chứ không phải người ngoài.',
      angerLevel: 42,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện này con có tính rồi ạ. Khi nào chắc chắn con thưa chuyện với bố mẹ đầu tiên.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết bố mẹ lo cho con. Bố mẹ cứ yên tâm, con không để bố mẹ phải nhắc mãi đâu.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con kể bố mẹ nghe từ từ. Bố mẹ nghe xong cho con ý kiến nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:cong-viec/me',
    input: {
      message: 'Công việc làm thêm dạo này sao rồi con',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Hỏi chuyện công việc là cách mẹ đo xem con ở ngoài kia có ổn không. Công việc ổn thì mẹ mới ngủ ngon được.',
      realWant:
        'Muốn nghe con kể thật chuyện đi làm — vui buồn gì cũng được, miễn là còn chia sẻ với mẹ.',
      angerLevel: 28,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ công việc con vẫn ổn ạ. Dạo này con đang làm một việc mới, để con kể mẹ nghe.',
        },
        {
          label: 'Khéo nhất',
          text: 'Có hơi bận một chút nhưng con lo được. Mẹ đừng lo, con vẫn ăn ngủ đàng hoàng.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, cảm ơn mẹ hỏi. Cuối tuần con gọi về kể mẹ nghe kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:cong-viec/bo',
    input: {
      message: 'Công việc làm thêm dạo này sao rồi con',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Hỏi chuyện công việc là cách bố đo xem con ở ngoài kia có ổn không. Công việc ổn thì bố mới ngủ ngon được.',
      realWant:
        'Muốn nghe con kể thật chuyện đi làm — vui buồn gì cũng được, miễn là còn chia sẻ với bố.',
      angerLevel: 28,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ công việc con vẫn ổn ạ. Dạo này con đang làm một việc mới, để con kể bố nghe.',
        },
        {
          label: 'Khéo nhất',
          text: 'Có hơi bận một chút nhưng con lo được. Bố đừng lo, con vẫn ăn ngủ đàng hoàng.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, cảm ơn bố hỏi. Cuối tuần con gọi về kể bố nghe kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:quan-tam/me',
    input: {
      message: 'Con ăn uống thế nào, có đói không',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu hỏi kiểu này thường là nhớ con nên tìm cớ bắt chuyện. Chuyện ăn uống chỉ là mở đầu, cái mẹ muốn là nghe giọng con lâu hơn một chút.',
      realWant: 'Muốn trò chuyện với con thêm vài câu và biết chắc con đang tự lo cho mình ổn.',
      angerLevel: 12,
      dangerLabel: 'An toàn — thương là chính',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con ổn ạ. Mẹ nay thế nào, ăn uống có ngon miệng không ạ?',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, để con gọi video cho mẹ luôn, nói chuyện thế này không đã.',
        },
        {
          label: 'An toàn nhất',
          text: 'Con cảm ơn mẹ. Mẹ giữ gìn sức khỏe nhé, con gọi về thường xuyên mà.',
        },
      ],
    },
  },
  {
    note: 'fallback-cat:quan-tam/both',
    input: {
      message: 'Con ăn uống thế nào, có đói không',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu hỏi kiểu này thường là nhớ con nên tìm cớ bắt chuyện. Chuyện ăn uống chỉ là mở đầu, cái bố mẹ muốn là nghe giọng con lâu hơn một chút.',
      realWant: 'Muốn trò chuyện với con thêm vài câu và biết chắc con đang tự lo cho mình ổn.',
      angerLevel: 12,
      dangerLabel: 'An toàn — thương là chính',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ con ổn ạ. Bố mẹ nay thế nào, ăn uống có ngon miệng không ạ?',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ, để con gọi video cho bố mẹ luôn, nói chuyện thế này không đã.',
        },
        {
          label: 'An toàn nhất',
          text: 'Con cảm ơn bố mẹ. Bố mẹ giữ gìn sức khỏe nhé, con gọi về thường xuyên mà.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:chung/me',
    input: {
      message: 'Hôm nay nhà mình có chuyện này muốn nói con nghe',
      speaker: 'me',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Mẹ hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với mẹ, được con để ý là đã vui rồi.',
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ nói vậy là còn chuyện gì nữa không ạ? Mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn mẹ. Có gì mẹ cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với mẹ kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:chung/bo',
    input: {
      message: 'Hôm nay nhà mình có chuyện này muốn nói con nghe',
      speaker: 'bo',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Bố hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với bố, được con để ý là đã vui rồi.',
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố nói vậy là còn chuyện gì nữa không ạ? Bố kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn bố. Có gì bố cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với bố kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:chung/both',
    input: {
      message: 'Hôm nay nhà mình có chuyện này muốn nói con nghe',
      speaker: 'both',
      context: 'khac',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Bố mẹ hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với bố mẹ, được con để ý là đã vui rồi.',
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố mẹ nói vậy là còn chuyện gì nữa không ạ? Bố mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn bố mẹ. Có gì bố mẹ cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với bố mẹ kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:tien/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'tien',
    },
    expected: {
      meaning:
        'Nhắc tới tiền mà nói vòng vo là mẹ đang ngại mở lời. Phụ huynh rất ít khi nói thẳng chuyện tiền, thường chờ con tự hiểu và chủ động trước.',
      realWant:
        'Muốn con chủ động quan tâm chuyện tiền nong trong nhà, để mẹ khỏi phải mở miệng — với mẹ, mở miệng xin con là điều khó nhất.',
      angerLevel: 38,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện tiền mẹ cứ để con lo. Tháng này con gửi về một ít, mẹ cầm chi tiêu nhé.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cảm ơn mẹ lo cho con. Con vẫn ổn, mẹ đừng dè sẻn quá với bản thân.',
        },
        {
          label: 'An toàn nhất',
          text: 'Để con tính lại rồi con báo mẹ. Có gì thiếu mẹ cứ nói với con, đừng giấu.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:ve-que/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 've-que',
    },
    expected: {
      meaning:
        'Chuyện về quê, về nhà mà được nhắc tới là mẹ đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
      realWant:
        'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để mẹ có cái mà đợi.',
      angerLevel: 32,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho mẹ sớm.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với mẹ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Giờ con chưa về được, nhưng con gọi video với mẹ mỗi tối nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:suc-khoe/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'suc-khoe',
    },
    expected: {
      meaning:
        'Chuyện sức khỏe mà mẹ nói nhẹ đi thì phải nghe ngược lại. Phụ huynh hay giấu bệnh vì sợ con lo và sợ tốn tiền đi khám.',
      realWant: 'Muốn con hỏi kỹ và quan tâm thật, chứ không phải nghe qua loa rồi yên tâm luôn.',
      angerLevel: 24,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ nói thật với con đi, đau ở đâu, lâu chưa? Con đặt lịch khám cho mẹ nhé.',
        },
        {
          label: 'Khéo nhất',
          text: 'Để con gọi về hỏi kỹ. Chuyện này không để "kệ nó tự khỏi" được đâu ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, cuối tuần con về đưa mẹ đi khám. Mẹ đừng lo chuyện tiền, có con đây.',
        },
      ],
      warning:
        'Riêng sức khỏe thì đừng dịch vui nữa — gọi hỏi kỹ triệu chứng, hoặc sắp xếp về xem tận mắt cho chắc.',
    },
  },
  {
    note: 'fallback-ctx:nguoi-yeu/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'nguoi-yeu',
    },
    expected: {
      meaning:
        'Chuyện người yêu, cưới xin mà mẹ nhắc khéo là đang sốt ruột thay con, nhưng sợ nói thẳng thì con áp lực nên cứ bóng gió mãi.',
      realWant:
        'Muốn biết con có tính chuyện lâu dài chưa để mẹ yên tâm, và muốn được con chia sẻ như người trong nhà chứ không phải người ngoài.',
      angerLevel: 42,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện này con có tính rồi ạ. Khi nào chắc chắn con thưa chuyện với mẹ đầu tiên.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết mẹ lo cho con. Mẹ cứ yên tâm, con không để mẹ phải nhắc mãi đâu.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con kể mẹ nghe từ từ. Mẹ nghe xong cho con ý kiến nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:cuoi/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'cuoi',
    },
    expected: {
      meaning:
        'Chuyện người yêu, cưới xin mà mẹ nhắc khéo là đang sốt ruột thay con, nhưng sợ nói thẳng thì con áp lực nên cứ bóng gió mãi.',
      realWant:
        'Muốn biết con có tính chuyện lâu dài chưa để mẹ yên tâm, và muốn được con chia sẻ như người trong nhà chứ không phải người ngoài.',
      angerLevel: 42,
      dangerLabel: 'Hơi cấn — đáp khéo là qua',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, chuyện này con có tính rồi ạ. Khi nào chắc chắn con thưa chuyện với mẹ đầu tiên.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con biết mẹ lo cho con. Mẹ cứ yên tâm, con không để mẹ phải nhắc mãi đâu.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con kể mẹ nghe từ từ. Mẹ nghe xong cho con ý kiến nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:cong-viec/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'cong-viec',
    },
    expected: {
      meaning:
        'Hỏi chuyện công việc là cách mẹ đo xem con ở ngoài kia có ổn không. Công việc ổn thì mẹ mới ngủ ngon được.',
      realWant:
        'Muốn nghe con kể thật chuyện đi làm — vui buồn gì cũng được, miễn là còn chia sẻ với mẹ.',
      angerLevel: 28,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ công việc con vẫn ổn ạ. Dạo này con đang làm một việc mới, để con kể mẹ nghe.',
        },
        {
          label: 'Khéo nhất',
          text: 'Có hơi bận một chút nhưng con lo được. Mẹ đừng lo, con vẫn ăn ngủ đàng hoàng.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, cảm ơn mẹ hỏi. Cuối tuần con gọi về kể mẹ nghe kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:o-chung/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'o-chung',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Mẹ hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với mẹ, được con để ý là đã vui rồi.',
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ nói vậy là còn chuyện gì nữa không ạ? Mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn mẹ. Có gì mẹ cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với mẹ kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback-ctx:con-cai/me',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'me',
      context: 'con-cai',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Mẹ hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với mẹ, được con để ý là đã vui rồi.',
      angerLevel: 30,
      dangerLabel: 'Chủ yếu là quan tâm, giận chỉ một ít',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ nói vậy là còn chuyện gì nữa không ạ? Mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn mẹ. Có gì mẹ cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với mẹ kỹ hơn nhé.',
        },
      ],
    },
  },
];

const CLIENT_GOLDEN = [
  {
    note: 'rule:muon-lam-gi-thi-lam/Mẹ',
    input: {
      message: 'Muốn làm gì thì làm',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Đây không còn là "cho con tự quyết" nữa — là bố mẹ đã giận tới mức buông tay rồi. Nói câu này xong mà con làm thật là còn giận dài dài.',
      realWant:
        'Muốn con dừng lại, xuống nước và nói chuyện đàng hoàng ngay lúc này, chứ không phải muốn con tự do thật đâu.',
      angerLevel: 4,
      dangerLabel: 'Giận thật rồi đấy',
      replies: [
        {
          label: 'Xuống nước ngay',
          text: 'Dạ con xin lỗi mẹ. Mẹ đừng giận nữa, con ngồi nghe mẹ nói hết đây ạ.',
        },
        {
          label: 'Nhận sai trước',
          text: 'Con biết con làm mẹ buồn rồi. Mẹ cho con sửa, lần này con nghe mẹ hết ạ.',
        },
        {
          label: 'Hài nhưng hối lỗi',
          text: 'Nghe câu này là con biết con "toang" rồi mẹ ơi. Cho con cơ hội chuộc lỗi bằng một bữa ngon nhé ạ 😅',
        },
      ],
      warning: 'Tuyệt đối đừng đáp "dạ vậy con làm thật nhé" — câu đó đổ thêm dầu vào lửa.',
    },
  },
  {
    note: 'rule:muon-lam-gi-thi-lam/Bố',
    input: {
      message: 'Muốn làm gì thì làm',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Đây không còn là "cho con tự quyết" nữa — là bố mẹ đã giận tới mức buông tay rồi. Nói câu này xong mà con làm thật là còn giận dài dài.',
      realWant:
        'Muốn con dừng lại, xuống nước và nói chuyện đàng hoàng ngay lúc này, chứ không phải muốn con tự do thật đâu.',
      angerLevel: 4,
      dangerLabel: 'Giận thật rồi đấy',
      replies: [
        {
          label: 'Xuống nước ngay',
          text: 'Dạ con xin lỗi bố. Bố đừng giận nữa, con ngồi nghe bố nói hết đây ạ.',
        },
        {
          label: 'Nhận sai trước',
          text: 'Con biết con làm bố buồn rồi. Bố cho con sửa, lần này con nghe bố hết ạ.',
        },
        {
          label: 'Hài nhưng hối lỗi',
          text: 'Nghe câu này là con biết con "toang" rồi bố ơi. Cho con cơ hội chuộc lỗi bằng một bữa ngon nhé ạ 😅',
        },
      ],
      warning: 'Tuyệt đối đừng đáp "dạ vậy con làm thật nhé" — câu đó đổ thêm dầu vào lửa.',
    },
  },
  {
    note: 'rule:muon-lam-gi-thi-lam/Cả hai',
    input: {
      message: 'Muốn làm gì thì làm',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Đây không còn là "cho con tự quyết" nữa — là bố mẹ đã giận tới mức buông tay rồi. Nói câu này xong mà con làm thật là còn giận dài dài.',
      realWant:
        'Muốn con dừng lại, xuống nước và nói chuyện đàng hoàng ngay lúc này, chứ không phải muốn con tự do thật đâu.',
      angerLevel: 4,
      dangerLabel: 'Giận thật rồi đấy',
      replies: [
        {
          label: 'Xuống nước ngay',
          text: 'Dạ con xin lỗi bố mẹ. Bố mẹ đừng giận nữa, con ngồi nghe bố mẹ nói hết đây ạ.',
        },
        {
          label: 'Nhận sai trước',
          text: 'Con biết con làm bố mẹ buồn rồi. Bố mẹ cho con sửa, lần này con nghe bố mẹ hết ạ.',
        },
        {
          label: 'Hài nhưng hối lỗi',
          text: 'Nghe câu này là con biết con "toang" rồi bố mẹ ơi. Cho con cơ hội chuộc lỗi bằng một bữa ngon nhé ạ 😅',
        },
      ],
      warning: 'Tuyệt đối đừng đáp "dạ vậy con làm thật nhé" — câu đó đổ thêm dầu vào lửa.',
    },
  },
  {
    note: 'rule:tuy-con/Mẹ',
    input: {
      message: 'Tùy con',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        "'Tùy con' nghe như cho tự quyết, nhưng đa phần mẹ đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý mẹ đang nghĩ không.",
      realWant:
        'Muốn con hỏi thêm một câu cho chắc, hoặc chọn đúng cái ý mà bố mẹ đang nghĩ — chứ quyết luôn một mình là dễ sai ý lắm.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'An toàn nhất',
          text: 'Dạ con đang phân vân, mẹ thấy phương án nào hợp hơn thì chỉ con với ạ, con theo mẹ.',
        },
        {
          label: 'Thân tình',
          text: 'Mẹ cứ nói thẳng ý mẹ thích nhất, con làm theo mẹ cho chắc ạ.',
        },
        {
          label: 'Hài hước',
          text: '"Tùy con" mà con chọn sai là mẹ giận, nên mẹ chốt giúp con một tiếng đi ạ 😄',
        },
      ],
      warning: 'Đừng trả lời "vậy thôi kệ ạ" — mức giận sẽ tăng vọt ngay lập tức.',
    },
  },
  {
    note: 'rule:tuy-con/Bố',
    input: {
      message: 'Tùy con',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        "'Tùy con' nghe như cho tự quyết, nhưng đa phần bố đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý bố đang nghĩ không.",
      realWant:
        'Muốn con hỏi thêm một câu cho chắc, hoặc chọn đúng cái ý mà bố mẹ đang nghĩ — chứ quyết luôn một mình là dễ sai ý lắm.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'An toàn nhất',
          text: 'Dạ con đang phân vân, bố thấy phương án nào hợp hơn thì chỉ con với ạ, con theo bố.',
        },
        {
          label: 'Thân tình',
          text: 'Bố cứ nói thẳng ý bố thích nhất, con làm theo bố cho chắc ạ.',
        },
        {
          label: 'Hài hước',
          text: '"Tùy con" mà con chọn sai là bố giận, nên bố chốt giúp con một tiếng đi ạ 😄',
        },
      ],
      warning: 'Đừng trả lời "vậy thôi kệ ạ" — mức giận sẽ tăng vọt ngay lập tức.',
    },
  },
  {
    note: 'rule:tuy-con/Cả hai',
    input: {
      message: 'Tùy con',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        "'Tùy con' nghe như cho tự quyết, nhưng đa phần bố mẹ đã có sẵn một đáp án trong đầu rồi. Đây là phép thử nhẹ: xem con có tự nghĩ ra đúng ý bố mẹ đang nghĩ không.",
      realWant:
        'Muốn con hỏi thêm một câu cho chắc, hoặc chọn đúng cái ý mà bố mẹ đang nghĩ — chứ quyết luôn một mình là dễ sai ý lắm.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'An toàn nhất',
          text: 'Dạ con đang phân vân, bố mẹ thấy phương án nào hợp hơn thì chỉ con với ạ, con theo bố mẹ.',
        },
        {
          label: 'Thân tình',
          text: 'Bố mẹ cứ nói thẳng ý bố mẹ thích nhất, con làm theo bố mẹ cho chắc ạ.',
        },
        {
          label: 'Hài hước',
          text: '"Tùy con" mà con chọn sai là bố mẹ giận, nên bố mẹ chốt giúp con một tiếng đi ạ 😄',
        },
      ],
      warning: 'Đừng trả lời "vậy thôi kệ ạ" — mức giận sẽ tăng vọt ngay lập tức.',
    },
  },
  {
    note: 'rule:khong-sao-dau/Mẹ',
    input: {
      message: 'Không sao đâu',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Khả năng cao là có sao đấy, chỉ là bố mẹ không muốn làm phiền con. "Không sao đâu" của bố mẹ thường dịch là "có sao nhưng con hỏi thêm đi".',
      realWant:
        'Muốn được con quan tâm hỏi han thêm một lúc, được kể ra cho nhẹ lòng — chứ không muốn bị bỏ qua ngay sau câu trả lời.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'Quan tâm thêm',
          text: 'Mẹ nói không sao mà con nghe giọng là biết có chuyện rồi. Mẹ kể con nghe đi, con đang rảnh đây ạ.',
        },
        {
          label: 'Hành động luôn',
          text: 'Thôi để con qua nhà / gọi video với mẹ một lát nhé, nghe giọng mẹ con chưa yên tâm.',
        },
        {
          label: 'Nhẹ nhàng',
          text: 'Con biết mẹ hay giấu cho con yên tâm. Có gì mẹ cứ nói thật với con, con lớn rồi mà ạ.',
        },
      ],
    },
  },
  {
    note: 'rule:khong-sao-dau/Bố',
    input: {
      message: 'Không sao đâu',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Khả năng cao là có sao đấy, chỉ là bố mẹ không muốn làm phiền con. "Không sao đâu" của bố mẹ thường dịch là "có sao nhưng con hỏi thêm đi".',
      realWant:
        'Muốn được con quan tâm hỏi han thêm một lúc, được kể ra cho nhẹ lòng — chứ không muốn bị bỏ qua ngay sau câu trả lời.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'Quan tâm thêm',
          text: 'Bố nói không sao mà con nghe giọng là biết có chuyện rồi. Bố kể con nghe đi, con đang rảnh đây ạ.',
        },
        {
          label: 'Hành động luôn',
          text: 'Thôi để con qua nhà / gọi video với bố một lát nhé, nghe giọng bố con chưa yên tâm.',
        },
        {
          label: 'Nhẹ nhàng',
          text: 'Con biết bố hay giấu cho con yên tâm. Có gì bố cứ nói thật với con, con lớn rồi mà ạ.',
        },
      ],
    },
  },
  {
    note: 'rule:khong-sao-dau/Cả hai',
    input: {
      message: 'Không sao đâu',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Khả năng cao là có sao đấy, chỉ là bố mẹ không muốn làm phiền con. "Không sao đâu" của bố mẹ thường dịch là "có sao nhưng con hỏi thêm đi".',
      realWant:
        'Muốn được con quan tâm hỏi han thêm một lúc, được kể ra cho nhẹ lòng — chứ không muốn bị bỏ qua ngay sau câu trả lời.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'Quan tâm thêm',
          text: 'Bố mẹ nói không sao mà con nghe giọng là biết có chuyện rồi. Bố mẹ kể con nghe đi, con đang rảnh đây ạ.',
        },
        {
          label: 'Hành động luôn',
          text: 'Thôi để con qua nhà / gọi video với bố mẹ một lát nhé, nghe giọng bố mẹ con chưa yên tâm.',
        },
        {
          label: 'Nhẹ nhàng',
          text: 'Con biết bố mẹ hay giấu cho con yên tâm. Có gì bố mẹ cứ nói thật với con, con lớn rồi mà ạ.',
        },
      ],
    },
  },
  {
    note: 'rule:khong-buon-dau/Mẹ',
    input: {
      message: 'Không buồn đâu',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Có buồn đấy, buồn rõ luôn — chỉ là bố mẹ nói ngược để con khỏi lo. Ai thật sự không buồn thì chẳng cần phải khẳng định là mình không buồn.',
      realWant:
        'Muốn con ở lại nói chuyện thêm, được an ủi một chút và cảm thấy con vẫn để tâm tới cảm xúc của bố mẹ.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'Ở lại nghe',
          text: 'Con biết mẹ buồn mà. Con không đi đâu hết, mẹ cứ nói hết với con đi ạ.',
        },
        {
          label: 'Làm hoà',
          text: 'Con xin lỗi vì làm mẹ buồn. Cuối tuần con về, con nấu món mẹ thích nhất đền nhé ạ.',
        },
        {
          label: 'Hài chữa cháy',
          text: '"Không buồn" mà giọng này là buồn cấp độ cao rồi mẹ ơi. Cho con xin lỗi bằng trà sữa được không ạ? 🧋',
        },
      ],
      warning: 'Câu trả lời tệ nhất lúc này là "dạ vậy thôi con đi ngủ đây".',
    },
  },
  {
    note: 'rule:khong-buon-dau/Bố',
    input: {
      message: 'Không buồn đâu',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Có buồn đấy, buồn rõ luôn — chỉ là bố mẹ nói ngược để con khỏi lo. Ai thật sự không buồn thì chẳng cần phải khẳng định là mình không buồn.',
      realWant:
        'Muốn con ở lại nói chuyện thêm, được an ủi một chút và cảm thấy con vẫn để tâm tới cảm xúc của bố mẹ.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'Ở lại nghe',
          text: 'Con biết bố buồn mà. Con không đi đâu hết, bố cứ nói hết với con đi ạ.',
        },
        {
          label: 'Làm hoà',
          text: 'Con xin lỗi vì làm bố buồn. Cuối tuần con về, con nấu món bố thích nhất đền nhé ạ.',
        },
        {
          label: 'Hài chữa cháy',
          text: '"Không buồn" mà giọng này là buồn cấp độ cao rồi bố ơi. Cho con xin lỗi bằng trà sữa được không ạ? 🧋',
        },
      ],
      warning: 'Câu trả lời tệ nhất lúc này là "dạ vậy thôi con đi ngủ đây".',
    },
  },
  {
    note: 'rule:khong-buon-dau/Cả hai',
    input: {
      message: 'Không buồn đâu',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Có buồn đấy, buồn rõ luôn — chỉ là bố mẹ nói ngược để con khỏi lo. Ai thật sự không buồn thì chẳng cần phải khẳng định là mình không buồn.',
      realWant:
        'Muốn con ở lại nói chuyện thêm, được an ủi một chút và cảm thấy con vẫn để tâm tới cảm xúc của bố mẹ.',
      angerLevel: 3,
      dangerLabel: 'Đang nguội giận, đừng châm thêm',
      replies: [
        {
          label: 'Ở lại nghe',
          text: 'Con biết bố mẹ buồn mà. Con không đi đâu hết, bố mẹ cứ nói hết với con đi ạ.',
        },
        {
          label: 'Làm hoà',
          text: 'Con xin lỗi vì làm bố mẹ buồn. Cuối tuần con về, con nấu món bố mẹ thích nhất đền nhé ạ.',
        },
        {
          label: 'Hài chữa cháy',
          text: '"Không buồn" mà giọng này là buồn cấp độ cao rồi bố mẹ ơi. Cho con xin lỗi bằng trà sữa được không ạ? 🧋',
        },
      ],
      warning: 'Câu trả lời tệ nhất lúc này là "dạ vậy thôi con đi ngủ đây".',
    },
  },
  {
    note: 'rule:an-com-chua/Mẹ',
    input: {
      message: 'Ăn cơm chưa?',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Câu này không hỏi về cơm đâu — đây là cách bố mẹ nói "bố mẹ nhớ con" mà không cần nói thẳng ra. Cơm chỉ là cái cớ mở đầu thôi.',
      realWant:
        'Muốn nghe con kể hôm nay thế nào, được nhắc con ăn uống tử tế, và được nói chuyện với con thêm vài phút nữa.',
      angerLevel: 0,
      dangerLabel: 'An toàn tuyệt đối',
      replies: [
        {
          label: 'Kể thật chi tiết',
          text: 'Con ăn rồi ạ, nay con ăn món ngon lắm. Mẹ ăn gì chưa, nhà mình nay ăn món gì thế ạ?',
        },
        {
          label: 'Chủ động gọi',
          text: 'Con vừa ăn xong đây mẹ. Để con gọi video, mẹ kể con nghe hôm nay nhà mình có gì vui không ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Con ăn rồi ạ, mà cơm con nấu không ngon bằng cơm mẹ. Nhớ cơm nhà quá đi mất 😋',
        },
      ],
    },
  },
  {
    note: 'rule:an-com-chua/Bố',
    input: {
      message: 'Ăn cơm chưa?',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Câu này không hỏi về cơm đâu — đây là cách bố mẹ nói "bố mẹ nhớ con" mà không cần nói thẳng ra. Cơm chỉ là cái cớ mở đầu thôi.',
      realWant:
        'Muốn nghe con kể hôm nay thế nào, được nhắc con ăn uống tử tế, và được nói chuyện với con thêm vài phút nữa.',
      angerLevel: 0,
      dangerLabel: 'An toàn tuyệt đối',
      replies: [
        {
          label: 'Kể thật chi tiết',
          text: 'Con ăn rồi ạ, nay con ăn món ngon lắm. Bố ăn gì chưa, nhà mình nay ăn món gì thế ạ?',
        },
        {
          label: 'Chủ động gọi',
          text: 'Con vừa ăn xong đây bố. Để con gọi video, bố kể con nghe hôm nay nhà mình có gì vui không ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Con ăn rồi ạ, mà cơm con nấu không ngon bằng cơm bố. Nhớ cơm nhà quá đi mất 😋',
        },
      ],
    },
  },
  {
    note: 'rule:an-com-chua/Cả hai',
    input: {
      message: 'Ăn cơm chưa?',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Câu này không hỏi về cơm đâu — đây là cách bố mẹ nói "bố mẹ nhớ con" mà không cần nói thẳng ra. Cơm chỉ là cái cớ mở đầu thôi.',
      realWant:
        'Muốn nghe con kể hôm nay thế nào, được nhắc con ăn uống tử tế, và được nói chuyện với con thêm vài phút nữa.',
      angerLevel: 0,
      dangerLabel: 'An toàn tuyệt đối',
      replies: [
        {
          label: 'Kể thật chi tiết',
          text: 'Con ăn rồi ạ, nay con ăn món ngon lắm. Bố mẹ ăn gì chưa, nhà mình nay ăn món gì thế ạ?',
        },
        {
          label: 'Chủ động gọi',
          text: 'Con vừa ăn xong đây bố mẹ. Để con gọi video, bố mẹ kể con nghe hôm nay nhà mình có gì vui không ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Con ăn rồi ạ, mà cơm con nấu không ngon bằng cơm bố mẹ. Nhớ cơm nhà quá đi mất 😋',
        },
      ],
    },
  },
  {
    note: 'rule:bao-gio-ve/Mẹ',
    input: {
      message: 'Bao giờ về?',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — mẹ muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
      realWant:
        'Muốn một mốc thời gian cụ thể để bố mẹ chuẩn bị và có cái để mong chờ — "để xem đã" là câu bố mẹ buồn nhất khi nghe.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Chốt ngày rõ ràng',
          text: 'Con chốt rồi ạ, con về ngày gần nhất có thể và ở nhà hẳn mấy hôm với mẹ. Mẹ muốn ăn gì con mua về nhé ạ.',
        },
        {
          label: 'Nếu chưa chắc',
          text: 'Con đang xin nghỉ đây mẹ, có ngày chính xác con báo mẹ ngay. Con cũng nhớ nhà lắm rồi ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Mẹ cứ chuẩn bị món con thích nhất đi, con về là con xử lý hết mâm luôn ạ 😄',
        },
      ],
    },
  },
  {
    note: 'rule:bao-gio-ve/Bố',
    input: {
      message: 'Bao giờ về?',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — bố muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
      realWant:
        'Muốn một mốc thời gian cụ thể để bố mẹ chuẩn bị và có cái để mong chờ — "để xem đã" là câu bố mẹ buồn nhất khi nghe.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Chốt ngày rõ ràng',
          text: 'Con chốt rồi ạ, con về ngày gần nhất có thể và ở nhà hẳn mấy hôm với bố. Bố muốn ăn gì con mua về nhé ạ.',
        },
        {
          label: 'Nếu chưa chắc',
          text: 'Con đang xin nghỉ đây bố, có ngày chính xác con báo bố ngay. Con cũng nhớ nhà lắm rồi ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Bố cứ chuẩn bị món con thích nhất đi, con về là con xử lý hết mâm luôn ạ 😄',
        },
      ],
    },
  },
  {
    note: 'rule:bao-gio-ve/Cả hai',
    input: {
      message: 'Bao giờ về?',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        "'Bao giờ thì về?' không phải hỏi lịch trình. Đó là câu hỏi của người đang đếm ngày — bố mẹ muốn biết chính xác để chuẩn bị, và để có cái mà mong.",
      realWant:
        'Muốn một mốc thời gian cụ thể để bố mẹ chuẩn bị và có cái để mong chờ — "để xem đã" là câu bố mẹ buồn nhất khi nghe.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Chốt ngày rõ ràng',
          text: 'Con chốt rồi ạ, con về ngày gần nhất có thể và ở nhà hẳn mấy hôm với bố mẹ. Bố mẹ muốn ăn gì con mua về nhé ạ.',
        },
        {
          label: 'Nếu chưa chắc',
          text: 'Con đang xin nghỉ đây bố mẹ, có ngày chính xác con báo bố mẹ ngay. Con cũng nhớ nhà lắm rồi ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Bố mẹ cứ chuẩn bị món con thích nhất đi, con về là con xử lý hết mâm luôn ạ 😄',
        },
      ],
    },
  },
  {
    note: 'rule:con-nha-nguoi-ta/Mẹ',
    input: {
      message: 'Con nhà người ta giỏi lắm',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Chiêu so sánh kinh điển: không hẳn là chê con đâu, mà là bố mẹ vừa nghe hàng xóm khoe con họ xong nên hơi... sốt ruột thay cho con.',
      realWant:
        'Muốn con cố thêm một chút trong việc đang làm, và thật ra là muốn sớm được khoe con mình với hàng xóm như nhà người ta vậy.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Nhận và hứa cụ thể',
          text: 'Dạ con nghe rồi ạ. Con đang cố đây mẹ, cho con thêm ít thời gian, con làm được việc cho mẹ khoe lại hàng xóm ạ.',
        },
        {
          label: 'Đỡ đòn bằng kết quả',
          text: 'Mẹ chờ con một thời gian nữa thôi, con có tin vui là con báo mẹ đầu tiên luôn ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Con nhà người ta giỏi thế mà có về ăn cơm với bố mẹ nó không mẹ? Con thì về đều đều đây này 😌',
        },
      ],
    },
  },
  {
    note: 'rule:con-nha-nguoi-ta/Bố',
    input: {
      message: 'Con nhà người ta giỏi lắm',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Chiêu so sánh kinh điển: không hẳn là chê con đâu, mà là bố mẹ vừa nghe hàng xóm khoe con họ xong nên hơi... sốt ruột thay cho con.',
      realWant:
        'Muốn con cố thêm một chút trong việc đang làm, và thật ra là muốn sớm được khoe con mình với hàng xóm như nhà người ta vậy.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Nhận và hứa cụ thể',
          text: 'Dạ con nghe rồi ạ. Con đang cố đây bố, cho con thêm ít thời gian, con làm được việc cho bố khoe lại hàng xóm ạ.',
        },
        {
          label: 'Đỡ đòn bằng kết quả',
          text: 'Bố chờ con một thời gian nữa thôi, con có tin vui là con báo bố đầu tiên luôn ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Con nhà người ta giỏi thế mà có về ăn cơm với bố mẹ nó không bố? Con thì về đều đều đây này 😌',
        },
      ],
    },
  },
  {
    note: 'rule:con-nha-nguoi-ta/Cả hai',
    input: {
      message: 'Con nhà người ta giỏi lắm',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Chiêu so sánh kinh điển: không hẳn là chê con đâu, mà là bố mẹ vừa nghe hàng xóm khoe con họ xong nên hơi... sốt ruột thay cho con.',
      realWant:
        'Muốn con cố thêm một chút trong việc đang làm, và thật ra là muốn sớm được khoe con mình với hàng xóm như nhà người ta vậy.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Nhận và hứa cụ thể',
          text: 'Dạ con nghe rồi ạ. Con đang cố đây bố mẹ, cho con thêm ít thời gian, con làm được việc cho bố mẹ khoe lại hàng xóm ạ.',
        },
        {
          label: 'Đỡ đòn bằng kết quả',
          text: 'Bố mẹ chờ con một thời gian nữa thôi, con có tin vui là con báo bố mẹ đầu tiên luôn ạ.',
        },
        {
          label: 'Hài hước',
          text: 'Con nhà người ta giỏi thế mà có về ăn cơm với bố mẹ nó không bố mẹ? Con thì về đều đều đây này 😌',
        },
      ],
    },
  },
  {
    note: 'rule:tien-bac-khong-quan-trong/Mẹ',
    input: {
      message: 'Tiền bạc không quan trọng',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Nghe thì nhẹ nhàng nhưng vế sau mới là phần chính: tiền không quan trọng bằng sức khoẻ, bằng gia đình, bằng việc con có mặt ở nhà. Câu nói thường bị ngắt giữa chừng vì bố mẹ ngại nói thẳng.',
      realWant:
        'Muốn con đừng lao vào kiếm tiền mà bỏ bê sức khoẻ và gia đình — và muốn con tự hiểu điều đó thay vì phải nghe giảng.',
      angerLevel: 1,
      dangerLabel: 'Hơi nhạy cảm thôi',
      replies: [
        {
          label: 'Hiểu ý ngay',
          text: 'Dạ con hiểu ý mẹ ạ. Tiền con kiếm được, nhưng thời gian với mẹ thì không mua lại được. Con sắp xếp về nhà thường xuyên hơn ạ.',
        },
        {
          label: 'Nếu đang biếu tiền',
          text: 'Mẹ cứ nhận cho con vui ạ, đây là tấm lòng của con. Con hứa vẫn lo sức khoẻ và về nhà đều, mẹ yên tâm nhé.',
        },
        {
          label: 'Hài hước',
          text: 'Tiền không quan trọng, quan trọng là con của mẹ ngoan — câu này con thuộc lòng rồi ạ 😄',
        },
      ],
    },
  },
  {
    note: 'rule:tien-bac-khong-quan-trong/Bố',
    input: {
      message: 'Tiền bạc không quan trọng',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Nghe thì nhẹ nhàng nhưng vế sau mới là phần chính: tiền không quan trọng bằng sức khoẻ, bằng gia đình, bằng việc con có mặt ở nhà. Câu nói thường bị ngắt giữa chừng vì bố mẹ ngại nói thẳng.',
      realWant:
        'Muốn con đừng lao vào kiếm tiền mà bỏ bê sức khoẻ và gia đình — và muốn con tự hiểu điều đó thay vì phải nghe giảng.',
      angerLevel: 1,
      dangerLabel: 'Hơi nhạy cảm thôi',
      replies: [
        {
          label: 'Hiểu ý ngay',
          text: 'Dạ con hiểu ý bố ạ. Tiền con kiếm được, nhưng thời gian với bố thì không mua lại được. Con sắp xếp về nhà thường xuyên hơn ạ.',
        },
        {
          label: 'Nếu đang biếu tiền',
          text: 'Bố cứ nhận cho con vui ạ, đây là tấm lòng của con. Con hứa vẫn lo sức khoẻ và về nhà đều, bố yên tâm nhé.',
        },
        {
          label: 'Hài hước',
          text: 'Tiền không quan trọng, quan trọng là con của bố ngoan — câu này con thuộc lòng rồi ạ 😄',
        },
      ],
    },
  },
  {
    note: 'rule:tien-bac-khong-quan-trong/Cả hai',
    input: {
      message: 'Tiền bạc không quan trọng',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Nghe thì nhẹ nhàng nhưng vế sau mới là phần chính: tiền không quan trọng bằng sức khoẻ, bằng gia đình, bằng việc con có mặt ở nhà. Câu nói thường bị ngắt giữa chừng vì bố mẹ ngại nói thẳng.',
      realWant:
        'Muốn con đừng lao vào kiếm tiền mà bỏ bê sức khoẻ và gia đình — và muốn con tự hiểu điều đó thay vì phải nghe giảng.',
      angerLevel: 1,
      dangerLabel: 'Hơi nhạy cảm thôi',
      replies: [
        {
          label: 'Hiểu ý ngay',
          text: 'Dạ con hiểu ý bố mẹ ạ. Tiền con kiếm được, nhưng thời gian với bố mẹ thì không mua lại được. Con sắp xếp về nhà thường xuyên hơn ạ.',
        },
        {
          label: 'Nếu đang biếu tiền',
          text: 'Bố mẹ cứ nhận cho con vui ạ, đây là tấm lòng của con. Con hứa vẫn lo sức khoẻ và về nhà đều, bố mẹ yên tâm nhé.',
        },
        {
          label: 'Hài hước',
          text: 'Tiền không quan trọng, quan trọng là con của bố mẹ ngoan — câu này con thuộc lòng rồi ạ 😄',
        },
      ],
    },
  },
  {
    note: 'rule:suc-khoe-lo/Mẹ',
    input: {
      message: 'Dạo này hơi mệt lắm',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Khi bố mẹ chủ động nói "hơi mệt" thì thường là mệt hơn mức họ nói rất nhiều. Bố mẹ Việt mình hay khai giảm bệnh xuống một nửa để con khỏi lo.',
      realWant:
        'Muốn con hỏi han kỹ hơn và nếu được thì sắp xếp đưa đi khám — chứ câu "mẹ/bố nghỉ ngơi đi ạ" qua loa là chưa đủ đâu.',
      angerLevel: 1,
      dangerLabel: 'Hơi nhạy cảm thôi',
      replies: [
        {
          label: 'Hỏi kỹ luôn',
          text: 'Mẹ mệt chỗ nào, từ bao giờ rồi ạ? Mẹ kể kỹ cho con, con đặt lịch khám rồi con đưa mẹ đi ạ.',
        },
        {
          label: 'Hành động',
          text: 'Thôi mẹ đừng gắng nữa, để con lo phần này. Mẹ nghỉ đi, có gì con xử lý hết ạ.',
        },
        {
          label: 'Nhẹ nhàng',
          text: 'Con lo cho mẹ lắm. Mẹ hứa với con là mệt nữa là gọi con ngay nhé, đừng giấu con ạ.',
        },
      ],
      warning:
        'Bố mẹ nói mệt lần thứ hai trong tuần là nên đưa đi khám thật, đừng chỉ hỏi thăm qua điện thoại.',
    },
  },
  {
    note: 'rule:suc-khoe-lo/Bố',
    input: {
      message: 'Dạo này hơi mệt lắm',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Khi bố mẹ chủ động nói "hơi mệt" thì thường là mệt hơn mức họ nói rất nhiều. Bố mẹ Việt mình hay khai giảm bệnh xuống một nửa để con khỏi lo.',
      realWant:
        'Muốn con hỏi han kỹ hơn và nếu được thì sắp xếp đưa đi khám — chứ câu "mẹ/bố nghỉ ngơi đi ạ" qua loa là chưa đủ đâu.',
      angerLevel: 1,
      dangerLabel: 'Hơi nhạy cảm thôi',
      replies: [
        {
          label: 'Hỏi kỹ luôn',
          text: 'Bố mệt chỗ nào, từ bao giờ rồi ạ? Bố kể kỹ cho con, con đặt lịch khám rồi con đưa bố đi ạ.',
        },
        {
          label: 'Hành động',
          text: 'Thôi bố đừng gắng nữa, để con lo phần này. Bố nghỉ đi, có gì con xử lý hết ạ.',
        },
        {
          label: 'Nhẹ nhàng',
          text: 'Con lo cho bố lắm. Bố hứa với con là mệt nữa là gọi con ngay nhé, đừng giấu con ạ.',
        },
      ],
      warning:
        'Bố mẹ nói mệt lần thứ hai trong tuần là nên đưa đi khám thật, đừng chỉ hỏi thăm qua điện thoại.',
    },
  },
  {
    note: 'rule:suc-khoe-lo/Cả hai',
    input: {
      message: 'Dạo này hơi mệt lắm',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Khi bố mẹ chủ động nói "hơi mệt" thì thường là mệt hơn mức họ nói rất nhiều. Bố mẹ Việt mình hay khai giảm bệnh xuống một nửa để con khỏi lo.',
      realWant:
        'Muốn con hỏi han kỹ hơn và nếu được thì sắp xếp đưa đi khám — chứ câu "mẹ/bố nghỉ ngơi đi ạ" qua loa là chưa đủ đâu.',
      angerLevel: 1,
      dangerLabel: 'Hơi nhạy cảm thôi',
      replies: [
        {
          label: 'Hỏi kỹ luôn',
          text: 'Bố mẹ mệt chỗ nào, từ bao giờ rồi ạ? Bố mẹ kể kỹ cho con, con đặt lịch khám rồi con đưa bố mẹ đi ạ.',
        },
        {
          label: 'Hành động',
          text: 'Thôi bố mẹ đừng gắng nữa, để con lo phần này. Bố mẹ nghỉ đi, có gì con xử lý hết ạ.',
        },
        {
          label: 'Nhẹ nhàng',
          text: 'Con lo cho bố mẹ lắm. Bố mẹ hứa với con là mệt nữa là gọi con ngay nhé, đừng giấu con ạ.',
        },
      ],
      warning:
        'Bố mẹ nói mệt lần thứ hai trong tuần là nên đưa đi khám thật, đừng chỉ hỏi thăm qua điện thoại.',
    },
  },
  {
    note: 'rule:nho-con/Mẹ',
    input: {
      message: 'Lâu không thấy gọi về gì cả',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Đây là nỗi nhớ nói vòng vo: bố mẹ không trách con bận đâu, chỉ là lâu không nghe giọng con nên nhà trống trải hẳn.',
      realWant: 'Muốn được con chủ động gọi về thường xuyên hơn, vài phút thôi cũng quý lắm rồi.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Hẹn lịch cố định',
          text: 'Dạ con xin lỗi mẹ. Từ giờ tối nào con cũng gọi về một lúc, mẹ khỏi phải chờ con nữa ạ.',
        },
        {
          label: 'Gọi ngay bây giờ',
          text: 'Con đây rồi ạ! Nay con kể mẹ nghe chuyện này hay lắm...',
        },
        {
          label: 'Hài hước',
          text: 'Khách hàng thân thiết gọi ít quá nên mẹ nhắc khéo rồi. Con nạp "gói gọi về nhà" ngay đây ạ 📞',
        },
      ],
    },
  },
  {
    note: 'rule:nho-con/Bố',
    input: {
      message: 'Lâu không thấy gọi về gì cả',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Đây là nỗi nhớ nói vòng vo: bố mẹ không trách con bận đâu, chỉ là lâu không nghe giọng con nên nhà trống trải hẳn.',
      realWant: 'Muốn được con chủ động gọi về thường xuyên hơn, vài phút thôi cũng quý lắm rồi.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Hẹn lịch cố định',
          text: 'Dạ con xin lỗi bố. Từ giờ tối nào con cũng gọi về một lúc, bố khỏi phải chờ con nữa ạ.',
        },
        {
          label: 'Gọi ngay bây giờ',
          text: 'Con đây rồi ạ! Nay con kể bố nghe chuyện này hay lắm...',
        },
        {
          label: 'Hài hước',
          text: 'Khách hàng thân thiết gọi ít quá nên bố nhắc khéo rồi. Con nạp "gói gọi về nhà" ngay đây ạ 📞',
        },
      ],
    },
  },
  {
    note: 'rule:nho-con/Cả hai',
    input: {
      message: 'Lâu không thấy gọi về gì cả',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Đây là nỗi nhớ nói vòng vo: bố mẹ không trách con bận đâu, chỉ là lâu không nghe giọng con nên nhà trống trải hẳn.',
      realWant: 'Muốn được con chủ động gọi về thường xuyên hơn, vài phút thôi cũng quý lắm rồi.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Hẹn lịch cố định',
          text: 'Dạ con xin lỗi bố mẹ. Từ giờ tối nào con cũng gọi về một lúc, bố mẹ khỏi phải chờ con nữa ạ.',
        },
        {
          label: 'Gọi ngay bây giờ',
          text: 'Con đây rồi ạ! Nay con kể bố mẹ nghe chuyện này hay lắm...',
        },
        {
          label: 'Hài hước',
          text: 'Khách hàng thân thiết gọi ít quá nên bố mẹ nhắc khéo rồi. Con nạp "gói gọi về nhà" ngay đây ạ 📞',
        },
      ],
    },
  },
  {
    note: 'fallback:Mẹ/Khác',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'Mẹ',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Mẹ hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với mẹ, được con để ý là đã vui rồi.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, mẹ nói vậy là còn chuyện gì nữa không ạ? Mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn mẹ. Có gì mẹ cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với mẹ kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback:Mẹ/Về quê',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'Mẹ',
      context: 'Về quê',
    },
    expected: {
      meaning:
        'Chuyện về quê, về nhà mà được nhắc tới là mẹ đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
      realWant:
        'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để mẹ có cái mà đợi. Chuyện về quê thì đừng hứa suông: chốt ngày cụ thể, bố mẹ nghe ngày tháng rõ ràng là vui cả tuần.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho mẹ sớm.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với mẹ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Giờ con chưa về được, nhưng con gọi video với mẹ mỗi tối nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback:Bố/Khác',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'Bố',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Bố hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với bố, được con để ý là đã vui rồi.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố nói vậy là còn chuyện gì nữa không ạ? Bố kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn bố. Có gì bố cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với bố kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback:Bố/Về quê',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'Bố',
      context: 'Về quê',
    },
    expected: {
      meaning:
        'Chuyện về quê, về nhà mà được nhắc tới là bố đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
      realWant:
        'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để bố có cái mà đợi. Chuyện về quê thì đừng hứa suông: chốt ngày cụ thể, bố mẹ nghe ngày tháng rõ ràng là vui cả tuần.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho bố sớm.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với bố.',
        },
        {
          label: 'An toàn nhất',
          text: 'Giờ con chưa về được, nhưng con gọi video với bố mỗi tối nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback:Cả hai/Khác',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'Cả hai',
      context: 'Khác',
    },
    expected: {
      meaning:
        'Câu này nghe nhẹ mà thường còn một lớp nghĩa ở dưới. Bố mẹ hay nói giảm nói tránh cho con đỡ lo, nên phải nghe cả điều không được nói ra mới hiểu hết.',
      realWant:
        'Muốn con hỏi thêm một câu và quan tâm thêm một chút. Với bố mẹ, được con để ý là đã vui rồi.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, bố mẹ nói vậy là còn chuyện gì nữa không ạ? Bố mẹ kể con nghe đi.',
        },
        {
          label: 'Khéo nhất',
          text: 'Con cảm ơn bố mẹ. Có gì bố mẹ cứ nói thẳng với con, con nghe hết ạ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Dạ, để con gọi về nói chuyện với bố mẹ kỹ hơn nhé.',
        },
      ],
    },
  },
  {
    note: 'fallback:Cả hai/Về quê',
    input: {
      message: 'Nhà mình nói chuyện này nhé con',
      speaker: 'Cả hai',
      context: 'Về quê',
    },
    expected: {
      meaning:
        'Chuyện về quê, về nhà mà được nhắc tới là bố mẹ đang nhớ con. Nhà có việc chỉ là cái cớ, lý do thật là muốn nhìn thấy con một lần cho yên tâm.',
      realWant:
        'Muốn con sắp xếp về một chuyến, hoặc ít nhất chốt một dịp cụ thể để bố mẹ có cái mà đợi. Chuyện về quê thì đừng hứa suông: chốt ngày cụ thể, bố mẹ nghe ngày tháng rõ ràng là vui cả tuần.',
      angerLevel: 2,
      dangerLabel: 'Hơi nguy hiểm — đáp khéo vào',
      replies: [
        {
          label: 'Ngoan nhất',
          text: 'Dạ, để con sắp xếp công việc rồi con về một chuyến. Con báo ngày cho bố mẹ sớm.',
        },
        {
          label: 'Khéo nhất',
          text: 'Dạ con cũng muốn về lắm. Kỳ này về con ở nhà lâu lâu với bố mẹ.',
        },
        {
          label: 'An toàn nhất',
          text: 'Giờ con chưa về được, nhưng con gọi video với bố mẹ mỗi tối nhé.',
        },
      ],
    },
  },
];

test('golden: server — output vai bố/mẹ (pattern chung + fallback) giữ nguyên từng byte', () => {
  assert.ok(SERVER_GOLDEN.length >= 50, `corpus server quá mỏng: ${SERVER_GOLDEN.length}`);
  for (const c of SERVER_GOLDEN) {
    assert.deepEqual(translateDichbome(c.input), c.expected, `server corpus đổi output: ${c.note}`);
  }
});

test('golden: client — output vai bố/mẹ (rule chung + fallback) giữ nguyên từng byte', () => {
  assert.ok(CLIENT_GOLDEN.length >= 30, `corpus client quá mỏng: ${CLIENT_GOLDEN.length}`);
  for (const c of CLIENT_GOLDEN) {
    assert.deepEqual(
      translateParentMessage(c.input),
      c.expected,
      `client corpus đổi output: ${c.note}`,
    );
  }
});
