/***********************
 * CONFIG
 ***********************/
const API_URL = "https://ldconnect-backend.onrender.com/api/auth";
const CODE_LENGTH = 6;
const RESEND_DELAY = 30;

/***********************
 * DOM ELEMENTS
 ***********************/
const forgotForm = document.getElementById("forgotForm");
const emailInput = document.getElementById("email");

const submitBtn = document.getElementById("submitBtn");
const verifyBtn = document.getElementById("verifyBtn");
const resendBtn = document.getElementById("resendBtn");

const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const infoMessage = document.getElementById("infoMessage");

const emailStep = document.getElementById("emailStep");
const verificationStep = document.getElementById("verificationStep");
const emailDisplay = document.getElementById("emailDisplay");

const codeInputs = [...document.querySelectorAll(".code-input")];

let resendTimer;
let resendCountdown = RESEND_DELAY;

/***********************
 * HELPERS
 ***********************/
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(button, state) {
  button.disabled = state;
  button.classList.toggle("loading", state);
}

function showMessage(type, text) {
  hideMessages();
  const map = {
    error: errorMessage,
    success: successMessage,
    info: infoMessage
  };
  map[type].textContent = text;
  map[type].classList.add("show");
}

function hideMessages() {
  [errorMessage, successMessage, infoMessage].forEach(el =>
    el.classList.remove("show")
  );
}

function getCode() {
  return codeInputs.map(i => i.value).join("");
}

function clearCodeInputs() {
  codeInputs.forEach(i => (i.value = ""));
  codeInputs[0].focus();
}

/***********************
 * STEP 1 – SEND CODE
 ***********************/
forgotForm.addEventListener("submit", async e => {
  e.preventDefault();
  hideMessages();

  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    showMessage("error", "Veuillez entrer une adresse email valide");
    return;
  }

  setLoading(submitBtn, true);

  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Erreur lors de l’envoi du code");
    }

    showMessage("success", "Code envoyé. Vérifiez votre email 📩");

    setTimeout(() => {
      emailStep.style.display = "none";
      verificationStep.classList.add("show");
      emailDisplay.textContent = email;
      clearCodeInputs();
      startResendTimer();
    }, 1000);

  } catch (err) {
    showMessage("error", err.message);
  } finally {
    setLoading(submitBtn, false);
  }
});

/***********************
 * CODE INPUT HANDLING
 ***********************/
codeInputs.forEach((input, index) => {
  input.addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "");
    if (e.target.value && index < CODE_LENGTH - 1) {
      codeInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      codeInputs[index - 1].focus();
    }
  });

  input.addEventListener("paste", e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length === CODE_LENGTH) {
      codeInputs.forEach((i, idx) => (i.value = pasted[idx]));
      codeInputs[CODE_LENGTH - 1].focus();
    }
  });
});

/***********************
 * STEP 2 – VERIFY CODE
 ***********************/
verifyBtn.addEventListener("click", async () => {
  hideMessages();

  const code = getCode();
  const email = emailDisplay.textContent;

  if (code.length !== CODE_LENGTH) {
    showMessage("error", "Veuillez entrer le code complet à 6 chiffres");
    return;
  }

  setLoading(verifyBtn, true);

  try {
    const res = await fetch(`${API_URL}/verify-reset-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Code invalide ou expiré");
    }

    showMessage("success", "Code vérifié. Redirection…");

    setTimeout(() => {
      window.location.href = `./reset-password.html?token=${data.token}`;
    }, 1000);

  } catch (err) {
    showMessage("error", err.message);
    clearCodeInputs();
  } finally {
    setLoading(verifyBtn, false);
  }
});

/***********************
 * RESEND CODE
 ***********************/
resendBtn.addEventListener("click", async () => {
  hideMessages();

  try {
    await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailDisplay.textContent })
    });

    showMessage("info", "Nouveau code envoyé");
    startResendTimer();

  } catch {
    showMessage("error", "Impossible de renvoyer le code");
  }
});

/***********************
 * RESEND TIMER
 ***********************/
function startResendTimer() {
  resendCountdown = RESEND_DELAY;
  resendBtn.disabled = true;
  document.getElementById("resendTimer").style.display = "inline";

  resendTimer = setInterval(() => {
    resendCountdown--;
    document.getElementById("seconds").textContent =
      resendCountdown.toString().padStart(2, "0");

    if (resendCountdown <= 0) {
      clearInterval(resendTimer);
      resendBtn.disabled = false;
      document.getElementById("resendTimer").style.display = "none";
    }
  }, 1000);
}

/***********************
 * UX CLEANUP
 ***********************/
emailInput.addEventListener("focus", hideMessages);
codeInputs.forEach(i => i.addEventListener("focus", hideMessages));
