const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    errorMessage.classList.remove("show");
    successMessage.classList.remove("show");

    // 🔄 Activer le spinner
    loginBtn.classList.add("loading");

    try {
        const response = await fetch("https://ldconnect-backend.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erreur de connexion");
        }

        // ✅ Succès
        successMessage.classList.add("show");

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => {
            window.location.href = "pages/parametre.html";
        }, 1500);

    } catch (error) {
        errorMessage.textContent = error.message || "Impossible de contacter le serveur";
        errorMessage.classList.add("show");
    } finally {
        // ❌ Désactiver le spinner
        loginBtn.classList.remove("loading");
    }
});

// Masquer l'erreur au focus
document.querySelectorAll(".form-input").forEach(input => {
    input.addEventListener("focus", () => {
        errorMessage.classList.remove("show");
    });
});
