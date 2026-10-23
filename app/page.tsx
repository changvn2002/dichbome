import { DichbomeApp } from '@/components/dichbome/app';

/**
 * Nội dung SEO (FAQ, câu kinh điển, riêng tư) nay sống trong tab «Tìm hiểu» của Bảng
 * (components/dichbome/find-out.tsx) — vẫn được render phía server vào HTML ban đầu
 * vì Board là cây component được SSR, đồng thời hết cảnh "footer template" dưới app.
 */
export default function Page() {
  return <DichbomeApp />;
}
