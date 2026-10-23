export type ClipboardDeps = {
  writeText?: (text: string) => Promise<void>;
  execCopy?: (text: string) => boolean;
};

function defaultExecCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  try {
    ta.select();
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

/**
 * Sao chép trung thực: chỉ trả true khi một đường sao chép thật sự thành công.
 * Không bao giờ throw ra ngoài và không bao giờ báo thành công khi cả hai đường đều thất bại.
 */
export async function copyText(text: string, deps?: ClipboardDeps): Promise<boolean> {
  const writeText =
    deps !== undefined
      ? deps.writeText
      : typeof navigator !== 'undefined' && navigator.clipboard?.writeText
        ? (t: string) => navigator.clipboard.writeText(t)
        : undefined;

  if (writeText) {
    try {
      await writeText(text);
      return true;
    } catch {
      // Rơi xuống đường execCopy bên dưới.
    }
  }

  const execCopy = deps?.execCopy ?? defaultExecCopy;
  try {
    return execCopy(text) === true;
  } catch {
    return false;
  }
}
