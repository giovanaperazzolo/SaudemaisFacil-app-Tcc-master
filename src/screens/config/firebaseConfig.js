import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBLt5WHIc7nItlIQJA40inMxTa1RrgQLAY",
  authDomain: "saudemaisfacil-71347.firebaseapp.com",
  projectId: "saudemaisfacil-71347",
  storageBucket: "saudemaisfacil-71347.appspot.com",
  messagingSenderId: "377467939321",
  appId: "1:377467939321:web:666923ea19c78e573fb528",
  measurementId: "G-L0WF8LXB4C"
};

let app;
let db;
let auth;
let storage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { db, auth, storage,app };
