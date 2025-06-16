// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcLqYbZbf-8XjV7wq6jOzzwuSQZuFVrhk",
  authDomain: "tce-cart-app.firebaseapp.com",
  projectId: "tce-cart-app",
  storageBucket: "tce-cart-app.firebasestorage.app",
  messagingSenderId: "882459741826",
  appId: "1:882459741826:web:2543e638ab4728bc34ae9b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 