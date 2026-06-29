/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, Expense, TravelMember, MemberBalance, SettleUpTransaction } from '../types';

/**
 * 計算旅行倒數天數
 * @param targetDateStr 目標日期字串 (YYYY-MM-DD)
 * @returns 剩餘天數，若已過期則返回負數或 0
 */
export function calculateCountdown(targetDateStr: string): number {
  const targetDate = new Date(targetDateStr + 'T00:00:00');
  const currentDate = new Date();
  
  // 將目前的日期時間也重設為 00:00:00，以便精確計算天數差
  currentDate.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 檢查新活動與現有行程活動是否存在時間衝突
 * @param newActivity 準備加入的新活動
 * @param existingActivities 該天現有的所有活動
 * @returns 衝突的活動列表，若無衝突則返回空陣列
 */
export function checkItineraryConflicts(newActivity: Partial<Activity>, existingActivities: Activity[]): Activity[] {
  if (!newActivity.date || !newActivity.startTime || !newActivity.endTime) {
    return [];
  }

  const conflicts: Activity[] = [];
  const newStart = parseTimeToMinutes(newActivity.startTime);
  const newEnd = parseTimeToMinutes(newActivity.endTime);

  // 只篩選同一天的活動進行比對
  const sameDayActivities = existingActivities.filter(act => act.date === newActivity.date && act.id !== newActivity.id);

  for (const act of sameDayActivities) {
    const actStart = parseTimeToMinutes(act.startTime);
    const actEnd = parseTimeToMinutes(act.endTime);

    // 重疊條件: (StartA < EndB) 且 (EndA > StartB)
    if (newStart < actEnd && newEnd > actStart) {
      conflicts.push(act);
    }
  }

  return conflicts;
}

/**
 * 將時間格式 (HH:MM) 轉換為分鐘數，方便比較
 * @param timeStr 時間字串 "14:30"
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

/**
 * 預算與財務分析
 * @param expenses 所有記帳支出項目
 * @param budgetLimit 預算上限
 * @returns 預算消耗比例、總支出、超支金額
 */
export function analyzeBudget(expenses: Expense[], budgetLimit: number) {
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const percentUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const overBudget = Math.max(0, totalSpent - budgetLimit);

  // 依據類別加總
  const categoryTotals: Record<string, number> = {
    food: 0,
    transport: 0,
    accommodation: 0,
    ticket: 0,
    other: 0,
  };

  expenses.forEach(exp => {
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += exp.amount;
    } else {
      categoryTotals.other += exp.amount;
    }
  });

  return {
    totalSpent,
    percentUsed: Math.min(100, percentUsed),
    actualPercent: percentUsed,
    overBudget,
    categoryTotals,
  };
}

/**
 * Splitwise 核心演算法：計算個人應收/應付餘額，並簡化債務關係 (減低交易次數)
 * @param expenses 行程的所有支出
 * @param members 旅行成員名單
 * @returns 包含各成員餘額以及最小化結算路徑建議
 */
export function calculateSplitwiseBalances(expenses: Expense[], members: TravelMember[]) {
  // 1. 初始化所有成員的餘額為 0
  const balances: Record<string, number> = {};
  members.forEach(m => {
    balances[m.id] = 0;
  });

  // 2. 累加每筆帳務帶來的正負餘額
  expenses.forEach(exp => {
    const payerId = exp.payerId;
    const amount = exp.amount;
    const participants = exp.splitWith && exp.splitWith.length > 0 ? exp.splitWith : members.map(m => m.id);
    
    // 付款人先墊付了這筆錢，所以他的餘額增加該金額
    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }

    // 每位參與者均分該金額，故他們的餘額減少
    const share = amount / participants.length;
    participants.forEach(pId => {
      if (balances[pId] !== undefined) {
        balances[pId] -= share;
      }
    });
  });

  // 轉為前端展示格式
  const memberBalances: MemberBalance[] = members.map(m => ({
    memberId: m.id,
    memberName: m.name,
    avatar: m.avatar,
    amount: parseFloat((balances[m.id] || 0).toFixed(2)),
  }));

  // 3. 債務最小化簡化演算法 (Greedy Algorithm)
  // 分成兩個陣列：應收款者 (creditors, balance > 0) 與應付款者 (debtors, balance < 0)
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  members.forEach(m => {
    const bal = parseFloat((balances[m.id] || 0).toFixed(2));
    if (bal < -0.01) {
      debtors.push({ id: m.id, name: m.name, amount: -bal }); // 存為正數便於計算
    } else if (bal > 0.01) {
      creditors.push({ id: m.id, name: m.name, amount: bal });
    }
  });

  const transactions: SettleUpTransaction[] = [];

  let dIdx = 0;
  let cIdx = 0;

  // 雙指針貪婪匹配，最少次數解決債務
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    // 取得本次轉帳金額 (取兩者中較小值)
    const minAmount = Math.min(debtor.amount, creditor.amount);

    if (minAmount > 0.01) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: parseFloat(minAmount.toFixed(2)),
      });
    }

    debtor.amount -= minAmount;
    creditor.amount -= minAmount;

    if (debtor.amount < 0.01) {
      dIdx++;
    }
    if (creditor.amount < 0.01) {
      cIdx++;
    }
  }

  return {
    memberBalances,
    transactions,
  };
}

/**
 * 通用搜尋、排序與篩選演算法
 */
export function filterAndSortActivities(
  activities: Activity[],
  searchQuery: string,
  categoryFilter: string,
  sortBy: 'time' | 'cost' | 'custom'
): Activity[] {
  let result = [...activities];

  // 1. 搜尋篩選 (名稱、地點、備註)
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      act =>
        act.title.toLowerCase().includes(query) ||
        act.locationName.toLowerCase().includes(query) ||
        (act.notes && act.notes.toLowerCase().includes(query))
    );
  }

  // 2. 分類篩選
  if (categoryFilter && categoryFilter !== 'all') {
    result = result.filter(act => act.category === categoryFilter);
  }

  // 3. 排序
  if (sortBy === 'time') {
    result.sort((a, b) => {
      // 先比日期，再比開始時間
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  } else if (sortBy === 'cost') {
    result.sort((a, b) => b.cost - a.cost); // 費用由高到低
  } else if (sortBy === 'custom') {
    result.sort((a, b) => a.order - b.order); // 自訂拖曳順序
  }

  return result;
}

/**
 * 計算今日行程完成進度
 * @param activities 今日的所有活動
 * @returns 已完成百分比 (依據當前時間判斷)
 */
export function calculateDailyProgress(activities: Activity[]): number {
  if (activities.length === 0) return 0;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toISOString().split('T')[0];

  let completedCount = 0;

  activities.forEach(act => {
    if (act.date < todayStr) {
      completedCount++;
    } else if (act.date === todayStr) {
      const endMinutes = parseTimeToMinutes(act.endTime);
      if (currentMinutes >= endMinutes) {
        completedCount++;
      }
    }
  });

  return Math.round((completedCount / activities.length) * 100);
}
