import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const EMAILJS_PUBLIC_KEY = "W73j0It1a6rJvnYgg";
const EMAILJS_SERVICE_ID = "service_kgyensu";
const EMAILJS_TEMPLATE_ID = "template_hs8wjrs";

emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
});

const form = document.getElementById("contactForm");
const formMsg = document.getElementById("formMsg");

function setFormMessage(text, isError = false) {
  if (!formMsg) return;
  formMsg.style.display = "block";
  formMsg.textContent = text;
  formMsg.style.color = isError ? "#b00020" : "#0a7a2f";
}

function clearFormMessage() {
  if (!formMsg) return;
  formMsg.style.display = "none";
  formMsg.textContent = "";
}

function generateDiscountCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  function part() {
    let out = "";
    for (let i = 0; i < 4; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  return `AH-${part()}-${part()}`;
}

async function codeExists(code) {
  const q = query(
    collection(db, "reviews"),
    where("discountCode", "==", code),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

async function generateUniqueCode() {
  let code = "";
  let exists = true;

  while (exists) {
    code = generateDiscountCode();
    exists = await codeExists(code);
  }

  return code;
}

async function emailAlreadyUsed(email) {
  const q = query(
    collection(db, "reviews"),
    where("email", "==", email),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
}

async function sendDiscountEmail({ name, email, code, message }) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_name: name,
      to_email: email,
      user_name: name,
      user_email: email,
      user_message: message,
      discount_code: code,
      discount_percent: "10%",
    }
  );
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormMessage();

    const submitBtn = form.querySelector('button[type="submit"]');

    const name = form.elements["name"]?.value.trim() || "";
    const email = form.elements["email"]?.value.trim() || "";
    const message = form.elements["message"]?.value.trim() || "";

    if (!name || !email || !message) {
      setFormMessage("Completează toate câmpurile.", true);
      return;
    }

    try {
      if (submitBtn) submitBtn.disabled = true;

      const alreadyExists = await emailAlreadyUsed(email);

      if (alreadyExists) {
        setFormMessage("Pentru acest email a fost trimis deja un cupon.", true);
        return;
      }

      const discountCode = await generateUniqueCode();

      await addDoc(collection(db, "reviews"), {
        name,
        email,
        message,
        discountCode,
        discountPercent: 10,
        used: false,
        source: "contactForm",
        createdAt: Date.now(),
      });

      await sendDiscountEmail({
        name,
        email,
        code: discountCode,
        message,
      });

      form.reset();
      setFormMessage("Recenzia a fost trimisă. Verifică emailul pentru cod.");
    } catch (error) {
      console.error("Eroare formular:", error);
      setFormMessage("A apărut o eroare. Încearcă din nou.", true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}