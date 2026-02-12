import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYdBEIoIiC-HsHIpoKEd4JvTsugBSgz-4",
  authDomain: "lohar-wadha-cricket.firebaseapp.com",
  projectId: "lohar-wadha-cricket",
  storageBucket: "lohar-wadha-cricket.firebasestorage.app",
  messagingSenderId: "415966561150",
  appId: "1:415966561150:web:8109570052ab1ded40e92f"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
