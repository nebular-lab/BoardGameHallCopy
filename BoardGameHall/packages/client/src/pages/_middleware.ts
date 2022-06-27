import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // ステージング環境のみ制限をかける
  const isStaging = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'preview';
  if (!isStaging) return NextResponse.next();

  // 開発者のIPからは無制限で見れるようにする
  const allowList = ['175.134.170.45', '27.91.209.56'];
  const xff = req.headers.get('x-forwarded-for');
  const ip = xff ? xff.split(',')[0] : '127.0.0.1';
  if (allowList.includes(ip)) {
    return NextResponse.next();
  }

  // それ以外のIPからはBasic認証で対応する 参考：https://zenn.dev/a_da_chi/articles/2b94160f11671e
  const basicAuth = req.headers.get('authorization');
  if (basicAuth) {
    const auth = basicAuth.split(' ')[1];
    const [user, password] = atob(auth).split(':');

    if (
      process.env.BASIC_AUTH_USER &&
      process.env.BASIC_AUTH_PASSWORD &&
      user === process.env.BASIC_AUTH_USER &&
      password === process.env.BASIC_AUTH_PASSWORD
    ) {
      return NextResponse.next();
    }
  }

  return new Response('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
