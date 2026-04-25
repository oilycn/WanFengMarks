const DEFAULT_ICON_BY_URL_ENDPOINT = 'https://ju.mk/api/icon-from-url';
const ICON_API_TIMEOUT_MS = 12000;
const ICON_API_MAX_RETRIES = 2;
const ICON_API_RETRY_DELAY_MS = 320;

type AutoIconApiResponse = {
  url?: string;
  data?: string;
};

type AutoUploadOptions = {
  sourceIconUrl?: string;
};

type UploadByUrlOptions = {
  sourceIconUrl: string;
  bookmarkUrl?: string;
};

function createApiHeaders(): Record<string, string> {
  const apiKey = process.env.ICON_AUTO_UPLOAD_API_KEY || process.env.ICON_API_KEY || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  return headers;
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ICON_API_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSourceIconUrl(sourceIconUrl: string, bookmarkUrl?: string): string {
  const trimmed = sourceIconUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/') && bookmarkUrl) {
    try {
      return new URL(trimmed, bookmarkUrl).toString();
    } catch {
      return '';
    }
  }
  return '';
}

export function buildIconCandidates(bookmarkUrl: string, sourceIconUrl?: string): string[] {
  const candidates: string[] = [];
  const normalizedSource = sourceIconUrl ? normalizeSourceIconUrl(sourceIconUrl, bookmarkUrl) : '';
  if (normalizedSource) {
    candidates.push(normalizedSource);
  }

  try {
    const parsed = new URL(bookmarkUrl);
    const hostWithPort = parsed.host.replace(/^www\./, '');
    const scheme = parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.protocol : 'https:';
    candidates.push(`${scheme}//${hostWithPort}/favicon.ico`);
  } catch {
    // Ignore parse error; caller validates URL separately.
  }

  return [...new Set(candidates.filter(Boolean))];
}

function extractApiUrl(payload: AutoIconApiResponse): string | null {
  const raw =
    typeof payload.url === 'string'
      ? payload.url
      : typeof payload.data === 'string'
        ? payload.data
        : '';
  if (!raw) return null;
  try {
    return new URL(raw).toString();
  } catch {
    return null;
  }
}

async function postIconApiOnce(
  endpoint: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<{ url: string | null; retryable: boolean }> {
  try {
    return await withTimeout(async (signal) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        return {
          url: null,
          retryable: response.status >= 500 || response.status === 408 || response.status === 429,
        };
      }

      try {
        const payload = (await response.json()) as AutoIconApiResponse;
        return { url: extractApiUrl(payload), retryable: false };
      } catch {
        return { url: null, retryable: true };
      }
    });
  } catch {
    return { url: null, retryable: true };
  }
}

export function isWeChatHostedIconUrl(value?: string | null): boolean {
  if (!value) return false;
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host.endsWith('wework.qpic.cn') ||
      host.endsWith('qpic.cn') ||
      host.includes('weixin.qq.com')
    );
  } catch {
    return false;
  }
}

export async function uploadIconBySourceUrl(options: UploadByUrlOptions): Promise<string | null> {
  const sourceIconUrl = normalizeSourceIconUrl(options.sourceIconUrl || '', options.bookmarkUrl);
  if (!sourceIconUrl) return null;

  const endpoint = process.env.ICON_UPLOAD_BY_URL_ENDPOINT || DEFAULT_ICON_BY_URL_ENDPOINT;
  const headers = createApiHeaders();

  for (let attempt = 0; attempt < ICON_API_MAX_RETRIES; attempt += 1) {
    const { url, retryable } = await postIconApiOnce(endpoint, headers, {
      iconUrl: sourceIconUrl,
      url: options.bookmarkUrl || '',
      destination: 'wechat',
    });
    if (url) return url;
    if (!retryable || attempt >= ICON_API_MAX_RETRIES - 1) {
      break;
    }
    await sleep(ICON_API_RETRY_DELAY_MS * (attempt + 1));
  }

  return null;
}

export async function autoUploadBookmarkIcon(bookmarkUrl: string, options?: AutoUploadOptions): Promise<string | null> {
  const trimmedUrl = bookmarkUrl?.trim();
  if (!trimmedUrl) {
    return null;
  }

  const candidates = buildIconCandidates(trimmedUrl, options?.sourceIconUrl);
  for (const candidate of candidates) {
    const uploaded = await uploadIconBySourceUrl({
      sourceIconUrl: candidate,
      bookmarkUrl: trimmedUrl,
    });
    if (uploaded) return uploaded;
  }

  return null;
}
