"use client";

import { useEffect } from 'react';
import { initDatabase } from '@/lib/database/labourRequestDb';

export default function DatabaseInitializer() {
  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initialize();
  }, []);

  return null;
}