import { useState, useRef, useCallback, type ReactNode } from 'react';

const THRESHOLD = 60;

export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void>; children: ReactNode }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return;
    // Only activate when scrolled to top
    const el = e.currentTarget;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      setPullY(Math.min(dy * 0.4, 100));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try { await onRefresh(); } catch { /* ignore */ }
      setRefreshing(false);
    }
    setPullY(0);
  }, [pullY, onRefresh]);

  return (
    <div
      className="h-full overflow-y-auto"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex justify-center items-center overflow-hidden transition-[height] text-e3-muted text-xs"
        style={{ height: pullY > 0 ? pullY : 0, transitionDuration: pulling.current ? '0ms' : '200ms' }}
      >
        {refreshing ? '更新中...' : pullY >= THRESHOLD ? '放開更新' : '下拉更新'}
      </div>
      {children}
    </div>
  );
}
