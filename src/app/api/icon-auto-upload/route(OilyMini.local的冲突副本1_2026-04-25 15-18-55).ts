import { NextResponse } from 'next/server';
import { autoUploadBookmarkIcon, buildIconCandidates } from '@/lib/bookmarkIcon';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    const sourceIconUrl = typeof body?.iconUrl === 'string' ? body.iconUrl.trim() : '';

    if (!rawUrl) {
      return NextResponse.json({ error: '缺少 url 参数。' }, { status: 400 });
    }

    const normalizedUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;

    let validatedUrl: string;
    try {
      validatedUrl = new URL(normalizedUrl).toString();
    } catch {
      return NextResponse.json({ error: 'URL 格式无效。' }, { status: 400 });
    }

    const iconUrl = await autoUploadBookmarkIcon(validatedUrl, { sourceIconUrl });
    if (iconUrl) {
      return NextResponse.json({ url: iconUrl });
    }

    const fallbackCandidates = buildIconCandidates(validatedUrl, sourceIconUrl);

    return NextResponse.json(
      { error: '自动上传图标失败，请稍后重试。', attempted: fallbackCandidates.length },
      { status: 502 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || '自动上传图标失败。' },
      { status: 500 }
    );
  }
}
