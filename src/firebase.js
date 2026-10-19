import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAB9-GyUzTI3rH4N4HKeUfnTj-VwGKxzCs",
  authDomain: "tugendane-rwanda.firebaseapp.com",
  projectId: "tugendane-rwanda",
  storageBucket: "tugendane-rwanda.firebasestorage.app",
  messagingSenderId: "166007770565",
  appId: "1:166007770565:web:e9812ecb7cd2b55df0cfac",
  measurementId: "G-LD0Q4DC2TS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);