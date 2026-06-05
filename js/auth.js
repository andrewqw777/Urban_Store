import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ELEMENTE */
const form = document.getElementById("authForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmPassword");
const nameInput = document.getElementById("name");
const forgotBtn = document.getElementById("forgotPassword");
const toast = document.getElementById("toast");

/* MODE */
let isLogin = true;

window.setLoginMode = () => isLogin = true;
window.setSignupMode = () => isLogin = false;

/* TOAST */
function showToast(msg){
  if(!toast){
    alert(msg);
    return;
  }

  toast.textContent = msg;
  toast.classList.add("show");

  setTimeout(()=>{
    toast.classList.remove("show");
  },3000);
}

/* FORM */
if(form && emailInput && passwordInput){
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showToast("Completează datele");
    return;
  }

  try {
    if (isLogin) {

      /* LOGIN */
      await signInWithEmailAndPassword(auth, email, password);

      showToast("Bine ai revenit");

      setTimeout(()=>{
        window.location.href = "../index.html";
      },800);

    } else {

      /* SIGNUP */
      if (!confirmInput || password !== confirmInput.value.trim()) {
        showToast("Parolele nu coincid");
        return;
      }

      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        email: email,
        name: nameInput ? nameInput.value : "",
        role: "user"
      });

      showToast("Cont creat. Te conectăm...");

      setTimeout(()=>{
        window.location.href = "../index.html";
      },1000);
    }

  } catch (e) {
    console.error(e);

    if (e.code === "auth/user-not-found") {
      showToast("Contul nu există");
    } else if (e.code === "auth/wrong-password") {
      showToast("Parolă greșită");
    } else if (e.code === "auth/email-already-in-use") {
      showToast("Email deja folosit");
    } else if (e.code === "auth/invalid-email") {
      showToast("Email invalid");
    } else {
      showToast(e.message);
    }
  }
});
}

/* RESET PAROLĂ */
if (forgotBtn && emailInput) {
forgotBtn.addEventListener("click", async () => {

  const email = emailInput.value.trim();

  if (!email) {
    showToast("Introdu emailul mai întâi");
    emailInput.focus();
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Email trimis pentru resetare");
  } catch (e) {
    console.error(e);

    if (e.code === "auth/user-not-found") {
      showToast("Nu există cont cu acest email");
    } else {
      showToast("Eroare la resetare");
    }
  }

});
}

/* ADMIN MODE */
window.isAdmin = false;
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    window.location.href = "../index.html";
  });
}
window.isAdmin = false;

onAuthStateChanged(auth, async (user) => {
  const loginNav = document.getElementById("loginNav");
  const userNav = document.getElementById("userNav");
  const addProductNav = document.getElementById("addProductNav");
  const adminOrdersNav = document.getElementById("adminOrdersNav");

  if (!user) {
    if (loginNav) loginNav.style.display = "block";
    if (userNav) userNav.style.display = "none";
    if (addProductNav) addProductNav.style.display = "none";
    if (adminOrdersNav) adminOrdersNav.style.display = "none";
    return;
  }

  if (loginNav) loginNav.style.display = "none";
  if (userNav) userNav.style.display = "block";

  try {
    const ref = doc(db, "users", user.uid);
    let snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email,
        role: "user"
      });

      snap = await getDoc(ref);
    }

    const data = snap.data();
    window.isAdmin = data.role === "admin";

    if (addProductNav) {
      addProductNav.style.display = window.isAdmin ? "block" : "none";
    }

    if (adminOrdersNav) {
      adminOrdersNav.style.display = window.isAdmin ? "block" : "none";
    }

    document.dispatchEvent(new Event("admin-ready"));

  } catch (e) {
    console.error("Admin check error:", e);
  }
});


