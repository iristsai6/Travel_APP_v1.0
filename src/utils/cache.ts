/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CacheItem } from '../types';

const CACHE_PREFIX = 'TRAVEL_APP_';

/**
 * 寫入快取資料至 LocalStorage，支援有效期限
 * @param key 快取鍵名
 * @param data 快取內容
 * @param expiresIn 存活時間 (毫秒)，預設 1 小時 (3600000 毫秒)
 */
export function setCache<T>(key: string, data: T, expiresIn = 3600000): void {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (error) {
    console.error('快取寫入失敗：', error);
  }
}

/**
 * 從 LocalStorage 讀取快取，若過期則自動刪除並返回 null
 * @param key 快取鍵名
 */
export function getCache<T>(key: string): T | null {
  try {
    const cachedStr = localStorage.getItem(CACHE_PREFIX + key);
    if (!cachedStr) return null;

    const item: CacheItem<T> = JSON.parse(cachedStr);
    const now = Date.now();

    // 檢查是否過期
    if (now - item.timestamp > item.expiresIn) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return item.data;
  } catch (error) {
    console.error('讀取快取失敗：', error);
    return null;
  }
}

/**
 * 刪除指定快取
 */
export function removeCache(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * 清除所有本 App 建立的快取項目
 */
export function clearAllCaches(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('清除快取失敗：', error);
  }
}

/**
 * 自訂防抖函數 (Debounce)
 * 限制高頻事件觸發，直至停止觸發一段時間後才執行一次
 */
export function debounce<A extends any[], R>(
  fn: (...args: A) => R,
  delay: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: A) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 自訂節流函數 (Throttle)
 * 確保高頻事件在設定時間內只執行一次
 */
export function throttle<A extends any[], R>(
  fn: (...args: A) => R,
  limit: number
): (...args: A) => void {
  let inThrottle = false;
  
  return function(this: any, ...args: A) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
