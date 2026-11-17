import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC50O8ff4x7ENb_5fv5XRo-DAftwBVLRXM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "caglabufe-a2a41.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "caglabufe-a2a41",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "caglabufe-a2a41.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "956654483862",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:956654483862:web:bcec3cdae8715afcba85b7",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-VB3EM1H0BV"
};

// Initialize Firebase once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize reCAPTCHA Enterprise App Check in browser environment
if (typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(
        process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_KEY || '6LckESQuAAAAAGJ0iqEloBfH67zUTIf0-LorqN2p'
      ),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('AppCheck initialization warning:', err);
  }
}

