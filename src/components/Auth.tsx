/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db, uploadFileMock } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Mail, Lock, User as UserIcon, Camera, HelpCircle, Loader2, Compass } from 'lucide-react';

interface AuthProps {
  onUserChanged: (user: User | null, profileName?: string, avatarUrl?: string) => void;
}

export default function Auth({ onUserChanged }: AuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // 欄位狀態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 從 Firestore 讀取延伸欄位 (如自訂大頭照)
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileName(data.displayName || currentUser.displayName || '旅人');
            setAvatarUrl(data.photoURL || currentUser.photoURL || '');
            onUserChanged(currentUser, data.displayName, data.photoURL);
          } else {
            setProfileName(currentUser.displayName || '旅人');
            setAvatarUrl(currentUser.photoURL || '');
            onUserChanged(currentUser);
          }
        } catch (e) {
          setProfileName(currentUser.displayName || '旅人');
          setAvatarUrl(currentUser.photoURL || '');
          onUserChanged(currentUser);
        }
      } else {
        setProfileName('');
        setAvatarUrl('');
        onUserChanged(null);
      }
    });
    return () => unsubscribe();
  }, [onUserChanged]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('登入成功！');
        setTimeout(() => setIsModalOpen(false), 800);
      } else if (authMode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('請輸入暱稱');
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName });
        
        // 寫入 Firestore 備份
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          email: credential.user.email,
          displayName: displayName,
          photoURL: '',
          createdAt: new Date().toISOString()
        });
        
        setSuccessMsg('註冊成功！');
        setTimeout(() => setIsModalOpen(false), 800);
      } else if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('密碼重設信件已寄出，請檢查您的信箱。');
      }
    } catch (err: any) {
      console.error(err);
      let localErrorMsg = '認證失敗：' + (err.message || '未知錯誤');
      if (err.code === 'auth/user-not-found') localErrorMsg = '找不到該使用者信箱';
      if (err.code === 'auth/wrong-password') localErrorMsg = '密碼錯誤';
      if (err.code === 'auth/email-already-in-use') localErrorMsg = '該信箱已被註冊';
      setError(localErrorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const currentUser = res.user;
      
      // 同步到 Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Google旅人',
          photoURL: currentUser.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setError('Google 登入失敗：' + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('登出失敗：', err);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    setUpdatingProfile(true);
    try {
      const file = e.target.files[0];
      const base64Url = await uploadFileMock(file);
      
      // 更新 Firestore 上的使用者資料
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profileName,
        photoURL: base64Url,
        email: user.email,
        uid: user.uid
      }, { merge: true });

      setAvatarUrl(base64Url);
      onUserChanged(user, profileName, base64Url);
    } catch (err) {
      console.error('上傳頭像失敗：', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleNameChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (!user) return;
    const newName = e.target.value.trim();
    if (!newName || newName === profileName) return;
    
    setUpdatingProfile(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        displayName: newName
      }, { merge: true });
      
      setProfileName(newName);
      onUserChanged(user, newName, avatarUrl);
    } catch (err) {
      console.error('更新姓名失敗：', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* 登入區塊狀態 */}
      {!user ? (
        <button
          id="btn-open-auth"
          onClick={() => {
            setAuthMode('login');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-semibold shadow-md shadow-white/5 hover:bg-white/90 active:scale-95 transition-all text-sm"
        >
          <LogIn className="w-4 h-4" />
          登入 / 註冊
        </button>
      ) : (
        <div className="flex items-center gap-4">
          {/* 使用者大頭照與資訊 */}
          <div className="relative group">
            <div className="w-10 h-10 rounded-2xl border border-white/20 overflow-hidden bg-[#1a1a1a] relative flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerpolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5 text-white/50" />
              )}
              {updatingProfile && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
            </div>
            
            {/* 上傳頭像浮動按鈕 */}
            <label className="absolute -bottom-1 -right-1 bg-[#FF385C] text-white p-1 rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="flex flex-col text-left">
            <input
              type="text"
              defaultValue={profileName}
              onBlur={handleNameChange}
              className="bg-transparent text-sm font-semibold border-b border-transparent focus:border-white/40 focus:outline-none py-0.5 w-24 text-white placeholder-white/40"
              placeholder="編輯旅人名稱"
            />
            <span className="text-[10px] text-white/40 uppercase tracking-widest">已登入旅程</span>
          </div>

          <button
            id="btn-logout"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
            title="登出"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 登入彈出視窗 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* 背景遮罩 */}
            <div 
              className="absolute inset-0 bg-[#020202]/80 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />

            {/* 視窗主體 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-[32px] p-8 overflow-hidden shadow-2xl z-10"
            >
              {/* 光影背景 */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#FF385C]/20 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/15 blur-3xl pointer-events-none rounded-full" />

              {/* 頂部 LOGO 與標題 */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-12 h-12 bg-[#FF385C] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF385C]/20 mb-3">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {authMode === 'login' && '登入旅人帳號'}
                  {authMode === 'signup' && '加入全球探險隊'}
                  {authMode === 'forgot' && '重設旅人密碼'}
                </h2>
                <p className="text-white/40 text-xs mt-1">
                  {authMode === 'login' && '解鎖您專屬的極簡 Bento 旅遊儀表板'}
                  {authMode === 'signup' && '開始您與夥伴的完美雲端旅遊協作'}
                  {authMode === 'forgot' && '輸入電子信箱，我們將發送密碼重置連結'}
                </p>
              </div>

              {/* 狀態訊息 */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-medium">
                  {successMsg}
                </div>
              )}

              {/* 信箱表單 */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      required
                      placeholder="旅人暱稱 (例：小明)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    required
                    placeholder="電子信箱 (Email)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>

                {authMode !== 'forgot' && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
                    <input
                      type="password"
                      required
                      placeholder="登入密碼"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-white text-black font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-95 transition-all text-sm mt-6 shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <>
                      {authMode === 'login' && '立即登入'}
                      {authMode === 'signup' && '建立新帳號'}
                      {authMode === 'forgot' && '發送驗證信'}
                    </>
                  )}
                </button>
              </form>

              {/* 橫向分割線 */}
              {authMode !== 'forgot' && (
                <>
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink mx-4 text-white/20 text-xs">或使用第三方帳號</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>

                  {/* Google Login 按鈕 */}
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Google 帳號登入
                  </button>
                </>
              )}

              {/* 切換連結 */}
              <div className="flex justify-between text-xs text-white/40 mt-6 pt-4 border-t border-white/5">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('forgot')} className="hover:text-white transition-colors">
                      忘記密碼？
                    </button>
                    <button onClick={() => setAuthMode('signup')} className="text-[#FF385C] font-semibold hover:underline">
                      註冊新探險者
                    </button>
                  </>
                ) : authMode === 'signup' ? (
                  <div className="w-full text-center">
                    已有帳號？{' '}
                    <button onClick={() => setAuthMode('login')} className="text-[#FF385C] font-semibold hover:underline">
                      立即登入
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center">
                    想起密碼了？{' '}
                    <button onClick={() => setAuthMode('login')} className="text-[#FF385C] font-semibold hover:underline">
                      返回登入
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
