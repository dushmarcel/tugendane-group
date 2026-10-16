import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyApsYu6xOZ9-aJtiiMMenUKEyO27HSSyxE",
  authDomain: "tujyane-rwanda.firebaseapp.com",
  projectId: "tujyane-rwanda",
  storageBucket: "tujyane-rwanda.firebasestorage.app",
  messagingSenderId: "193709444377",
  appId: "1:193709444377:web:879d15fbdffd3dffb28988",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);