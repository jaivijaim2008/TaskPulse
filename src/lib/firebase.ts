import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  updateDoc,
  onSnapshot,
  writeBatch
} from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  projectId: "model-yarn-tkpr3",
  appId: "1:478025274381:web:d015cd86de4159d55c3144",
  apiKey: "AIzaSyCE8kT33sK2xouT7AcWQ7q71MMbOSs5MxA",
  authDomain: "model-yarn-tkpr3.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-taskpulse-7eabf13a-2105-496e-9ef6-fcf3b7c74f1b",
  storageBucket: "model-yarn-tkpr3.firebasestorage.app",
  messagingSenderId: "478025274381"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  writeBatch
};
export type { User };
