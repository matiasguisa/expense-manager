import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjKk0FuQmYpYNm9LzvKHEFGNtksdQog9o",
  authDomain: "expense-manager-dan.firebaseapp.com",
  projectId: "expense-manager-dan",
  storageBucket: "expense-manager-dan.firebasestorage.app",
  messagingSenderId: "216714392080",
  appId: "1:216714392080:web:3544468b046194fc061095"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);