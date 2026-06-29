/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 讀取從 Firebase 設置工具自動生成的憑證
const firebaseConfig = {
  apiKey: "AIzaSyAOHR8PFAI2a7kPlTaF059Lqj4ZNHXG6Ko",
  authDomain: "the-grail-7fs6l.firebaseapp.com",
  projectId: "the-grail-7fs6l",
  storageBucket: "the-grail-7fs6l.firebasestorage.app",
  messagingSenderId: "710221808277",
  appId: "1:710221808277:web:2ee4480af7998d129f119c"
};

// 避免在開發熱重載時重複初始化 App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化 Auth 與指定 ID 的 Firestore 資料庫
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 綁定指定資料庫 ID：ai-studio-6913c995-862c-4a77-9590-8a03e7eede7b
export const db = getFirestore(app, "ai-studio-6913c995-862c-4a77-9590-8a03e7eede7b");

/**
 * 封裝 Firebase Storage 或模擬 Base64 頭像上傳，以確保不需設定 Storage Rule 也能運作
 * @param file 檔案
 * @returns 檔案下載網址 (Base64)
 */
export async function uploadFileMock(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
