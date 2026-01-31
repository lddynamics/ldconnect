const form = document.getElementById("resetForm");
const errorDiv = document.getElementById("error");
const successDiv = document.getElementById("success");
const submitBtn = document.getElementById("submitBtn");

// 🔐 Récupérer le token depuis l'URL
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

// ❌ Si pas de token → accès interdit
if (!token) {
window.location.href = "../login.html";
}

form.addEventListener("submit", async (e) => {
e.preventDefault();
errorDiv.style.display = "none";
successDiv.style.display = "none";

const password = document.getElementById("password").value;
const confirm = document.getElementById("confirmPassword").value;

if (password.length < 6) { showError("Le mot de passe doit contenir au moins 6 caractères"); return; } if (password
    !==confirm) { showError("Les mots de passe ne correspondent pas"); return; } submitBtn.disabled=true; try { const
    res=await fetch("https://ldconnect-backend.onrender.com/api/auth/reset-password", { method: "POST" , headers: { "Content-Type"
    : "application/json" , "Authorization" : `Bearer ${token}` }, body: JSON.stringify({ password }) }); const
    data=await res.json(); if (!res.ok) throw new Error(data.message);
    successDiv.textContent="Mot de passe réinitialisé avec succès 🎉" ; successDiv.style.display="block" ;
    sessionStorage.clear(); setTimeout(()=> {
    window.location.href = "../login.html";
    }, 2000);

    } catch (err) {
    showError(err.message || "Erreur serveur");
    } finally {
    submitBtn.disabled = false;
    }
    });

    function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = "block";
    }