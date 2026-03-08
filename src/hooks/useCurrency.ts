'use client';
import { useEffect, useState, useCallback } from 'react';

export function useCurrency() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    fetch('/api/currency')
      .then(r => r.json())
      .then(d => {
        setBalance(d.data?.balance ?? 0);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { balance, loading, refetch };
}
