'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initSessionTracking, trackPageView } from '@/lib/analytics';

export const AnalyticsProvider = () => {
  const pathname = usePathname();

  useEffect(() => {
    initSessionTracking();
  }, []);

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return null;
};
