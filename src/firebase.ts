
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA8zSN1YFn_uEEzPo0p6diP8fw77w-G1-s",
  authDomain: "crudv2-75850.firebaseapp.com",
  projectId: "crudv2-75850",
  storageBucket: "crudv2-75850.firebasestorage.app",
  messagingSenderId: "606692903435",
  appId: "1:606692903435:web:70c9036bce788843f2950e",
  measurementId: "G-71NEFNW88F"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
