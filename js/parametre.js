/*================================================
 * ⚙️ SETTINGS FRONTEND CONTROLLER
 * Gestion des paramètres + sécurité Fedapay
==================================================*/

/* ========== ÉTAT GLOBAL ========== */
let originalData = {};
let hasChanges = false;
let fedapayUnlocked = false;

/* ========== ELEMENTS DOM ========== */
const form = document.getElementById("settingsForm");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

const fedapayInput = document.getElementById("fedapayKey");
const editFedapayBtn = document.getElementById("editFedapayBtn");

const otpModal = document.getElementById("otpModal");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const otpInput = document.getElementById("otpCode");

/* ========== UTILS ========== */

/**
 * 🔐 Récupère le token JWT
 */
const getToken = () => localStorage.getItem("token");

/**
 * ⏳ Gestion du bouton sauvegarde
 */
function setLoading(isLoading) {
    saveBtn.classList.toggle("loading", isLoading);
    saveBtn.disabled = isLoading || !hasChanges;
}

/**
 * 🔄 Reset UI Fedapay après sauvegarde
 */
function resetFedapayField() {
    fedapayUnlocked = false;
    fedapayInput.disabled = true;
    fedapayInput.type = "password";
    fedapayInput.value = "••••••••••••••";
}

/* ========== CHARGEMENT DES PARAMÈTRES ========== */

async function loadSettings() {
    try {
        shownotification("loading", "Chargement des paramètres...");

        const res = await fetch("https://ldconnect-backend.onrender.com/api/settings", {
            headers: { Authorization: `Bearer ${getToken()}` }
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        // Remplissage formulaire
        document.getElementById("wifiName").value = data.name || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("contactSupport").value = data.contact || "";
        document.getElementById("fedapayKey").value = data.fedapayPublicKey || "";
        document.getElementById("portalIp").value = data.portalIp || "";

        // Sauvegarde état initial
        originalData = {
            wifiName: data.name || "",
            contactSupport: data.contact || "",
            fedapayKey: data.fedapayPublicKey || "",
            portalIp: data.portalIp || ""
        };

        saveBtn.disabled = true;
        hideNotification();

    } catch (err) {
        console.error(err);
        shownotification("error", "Impossible de charger les paramètres", 3000);
    }
}

/* ========== DÉTECTION DES MODIFICATIONS ========== */

const editableFields = [
    "wifiName",
    "contactSupport",
    "fedapayKey",
    "portalIp"
];

editableFields.forEach(field => {
    const input = document.getElementById(field);
    input?.addEventListener("input", checkForChanges);
});

/**
 * 🔍 Vérifie si le formulaire a changé
 */
function checkForChanges() {
    hasChanges = editableFields.some(field => {
        const input = document.getElementById(field);
        return input && input.value !== (originalData[field] || "");
    });

    saveBtn.disabled = !hasChanges;
}

/* ========== FEDAPAY – DEMANDE OTP ========== */

editFedapayBtn.addEventListener("click", async () => {
    // 🔄 Activer le spinner
    editFedapayBtn.classList.add("loading");
    editFedapayBtn.setAttribute("disabled", "true");

    try {
        shownotification("loading", "Envoi du code de vérification...");

        const res = await fetch(
            "https://ldconnect-backend.onrender.com/api/settings/fedapay/request",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        otpInput.value = "";
        otpModal.classList.remove("hidden");

        shownotification("success", "Code envoyé par email", 2500);

    } catch (err) {
        console.error(err);
        shownotification("error", err.message || "Erreur lors de l’envoi du code");
    } finally {
        // ❌ Désactiver le spinner
        editFedapayBtn.classList.remove("loading");
        editFedapayBtn.removeAttribute("disabled");
    }
});

/* ========== FEDAPAY – VÉRIFICATION OTP ========== */

verifyOtpBtn.addEventListener("click", async () => {
    const code = otpInput.value.trim();

    if (code.length !== 6) {
        return shownotification("error", "Code invalide");
    }

    try {
        shownotification("loading", "Vérification du code...");

        const res = await fetch(
            "https://ldconnect-backend.onrender.com/api/settings/fedapay/verify",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ code })
            }
        );

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // 🔓 Déverrouillage champ Fedapay
        fedapayUnlocked = true;
        fedapayInput.disabled = false;
        fedapayInput.type = "text";
        fedapayInput.placeholder = "sk_live_xxxxxxxxx";
        fedapayInput.focus();

        otpModal.classList.add("hidden");
        shownotification("success", "Clé Fedapay déverrouillée", 2500);

    } catch (err) {
        console.error(err);
        shownotification("error", err.message || "Code incorrect");
    }
});

/* ========== ANNULATION ========== */

cancelBtn.addEventListener("click", () => {
    editableFields.forEach(field => {
        document.getElementById(field).value = originalData[field];
    });

    resetFedapayField();
    hasChanges = false;
    saveBtn.disabled = true;

    shownotification("error", "Modifications annulées", 2000);
});

/* ========== SAUVEGARDE ========== */

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        setLoading(true);
        shownotification("loading", "Sauvegarde en cours...");

        const fedapayValue = fedapayInput.value.trim();

        const payload = {
            name: document.getElementById("wifiName").value,
            contact: document.getElementById("contactSupport").value,
            portalIp: document.getElementById("portalIp").value
        };

        // 🔐 Envoi Fedapay seulement si autorisé et modifié
        if (fedapayUnlocked && fedapayValue && fedapayValue !== originalData.fedapayKey) {
            payload.fedapayPublicKey = fedapayValue;
        }

        const res = await fetch("https://ldconnect-backend.onrender.com/api/settings", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        originalData = {
            wifiName: payload.name,
            contactSupport: payload.contact,
            fedapayKey: payload.fedapayPublicKey || originalData.fedapayKey,
            portalIp: payload.portalIp
        };

        resetFedapayField();
        hasChanges = false;
        saveBtn.disabled = true;

        shownotification("success", "Paramètres mis à jour", 2500);

    } catch (err) {
        console.error(err);
        shownotification("error", err.message || "Erreur lors de la sauvegarde", 3000);
    } finally {
        setLoading(false);
    }
});

/* ========== NOTIFICATIONS ========== */

function shownotification(type, message, duration = null) {
    const notif = document.getElementById("notif");
    const icon = notif.querySelector(".notif-icon");
    const text = notif.querySelector(".notif-text");

    notif.className = "notif show " + type;

    icon.className = "notif-icon";
    if (type === "success") icon.classList.add("fas", "fa-check-circle");
    if (type === "error") icon.classList.add("fas", "fa-exclamation-circle");
    if (type === "loading") icon.classList.add("fas", "fa-spinner", "spinner");

    text.textContent = message;

    if (duration) setTimeout(hideNotification, duration);
}

function hideNotification() {
    document.getElementById("notif").classList.remove("show");
}

/* ========== INIT ========== */
window.addEventListener("DOMContentLoaded", loadSettings);
