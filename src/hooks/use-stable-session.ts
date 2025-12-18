'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

type StableSessionResult = {
  session: Session | null;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  isInitialLoading: boolean;
  isRevalidating: boolean;
};

/**
 * next-auth 默认会在窗口重新获得焦点时刷新 session，这会让 `status` 短暂进入 `loading`。
 * 对于 Editor 这类强状态页面，这个 `loading` 很容易触发“整页闪一下/像刷新”，并导致组件卸载丢状态。
 *
 * 这个 hook 会在 revalidate 期间保留上一次的 session，从而让 UI 保持稳定，
 * 同时当刷新结果为 unauthenticated 时仍然能正确跳转登录。
 */
export function useStableSession(): StableSessionResult {
  const { data, status } = useSession();
  const lastSessionRef = useRef<Session | null>(null);

  useEffect(() => {
    if (data) {
      lastSessionRef.current = data;
    }
  }, [data]);

  return useMemo(() => {
    const isRevalidating = status === 'loading' && Boolean(lastSessionRef.current);
    const session = isRevalidating ? data ?? lastSessionRef.current : data ?? null;

    return {
      session,
      isAuthenticated: status === 'authenticated' || isRevalidating,
      isUnauthenticated: status === 'unauthenticated',
      isInitialLoading: status === 'loading' && !lastSessionRef.current && !data,
      isRevalidating,
    };
  }, [data, status]);
}

