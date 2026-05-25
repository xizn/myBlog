export interface AiHttpResult {
  ok: boolean;
  status: number;
  text: string;
  error?: string;
}

/** 发起 HTTP 请求（桌面版走主进程，避免 CORS） */
export async function aiHttpRequest(
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  }
): Promise<AiHttpResult> {
  if (typeof window !== 'undefined' && window.studioAiFetch) {
    return window.studioAiFetch({ url, ...init });
  }

  try {
    const res = await fetch(url, init);
    return { ok: res.ok, status: res.status, text: await res.text() };
  } catch (err) {
    const message = err instanceof Error ? err.message : '网络请求失败';
    return { ok: false, status: 0, text: '', error: message };
  }
}
