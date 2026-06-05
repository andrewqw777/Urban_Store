import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHda-LjpBJeBGjGJNLiMkfICJHSQhR0tA",
  authDomain: "site12-a5.firebaseapp.com",
  projectId: "site12-a5",
  storageBucket: "site12-a5.firebasestorage.app",
  messagingSenderId: "729283937837",
  appId: "1:729283937837:web:ab972c159fd1aa90c29aa4"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);