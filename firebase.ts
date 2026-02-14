import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA021fiVjzYwjOwffH2II4Mv2JLQfdLajk",
  authDomain: "lohar-cricket.firebaseapp.com",
  projectId: "lohar-cricket",
  storageBucket: "lohar-cricket.firebasestorage.app",
  messagingSenderId: "349853505322",
  appId: "1:349853505322:web:cdf67f457daae234ba7053",
  measurementId: "G-T6RKG20PGE"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);   // 👈 ADD THIS
