import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0LXu1vXYEMCVFSvIjE0GKMUh63bXYSiE",
  authDomain: "lakhushya.firebaseapp.com",
  projectId: "lakhushya",
  storageBucket: "lakhushya.firebasestorage.app",
  messagingSenderId: "561463554908",
  appId: "1:561463554908:web:a589562f1fee13df850799",
measurementId: "G-9H22YNLYX5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);