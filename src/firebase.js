import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSrV-NIaiea64vH3lm1SMRbKeWCwl2-yA",
  authDomain: "my-recipe-books-22c8a.firebaseapp.com",
  projectId: "my-recipe-books-22c8a",
  storageBucket: "my-recipe-books-22c8a.firebasestorage.app",
  messagingSenderId: "969389522617",
  appId: "1:969389522617:web:8ad09816bc4c0e663aa568"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
