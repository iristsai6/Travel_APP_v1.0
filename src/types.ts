/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 旅遊行程目的地與基本資訊
export interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  coverImage?: string;
  budgetLimit: number;
}

// 行程單一活動類型
export type ActivityCategory = 'sightseeing' | 'food' | 'transport' | 'hotel' | 'shopping' | 'other';

// 行程中的具體活動項目
export interface Activity {
  id: string;
  tripId: string;
  title: string;
  category: ActivityCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  locationName: string;
  latitude: number;
  longitude: number;
  notes?: string;
  cost: number;
  order: number; // 用於拖曳排序
}

// 帳務/費用項目
export interface Expense {
  id: string;
  tripId: string;
  title: string;
  amount: number;
  payerId: string; // 付款人使用者 ID
  payerName: string; // 付款人姓名
  splitWith: string[]; // 分攤對象的使用者 ID 列表
  date: string;
  category: 'food' | 'transport' | 'accommodation' | 'ticket' | 'other';
}

// 共同旅行成員
export interface TravelMember {
  id: string;
  name: string;
  avatar?: string;
  email: string;
}

// Splitwise 結算餘額分析結果
export interface MemberBalance {
  memberId: string;
  memberName: string;
  avatar?: string;
  amount: number; // 正數代表應收回，負數代表應支付
}

// 結算建議 (Settle-up transaction)
export interface SettleUpTransaction {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

// 景點收藏
export interface FavoritePlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  rating?: number;
  addedAt: string;
}

// 快取物件結構
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // 毫秒數
}
