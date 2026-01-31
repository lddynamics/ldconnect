
const loginForm = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const remember = document.getElementById("remember").checked;

    errorMessage.classList.remove("show");
    successMessage.classList.remove("show");

    try {
        const response = await fetch("https://ldconnect-backend.onrender.com/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent = data.message || "Erreur de connexion";
            errorMessage.classList.add("show");
            return;
        }

        // Succès
        successMessage.classList.add("show");

         // ✅ Stockage UNIQUE dans localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));


        // Redirection
        setTimeout(() => {
            window.location.href = "pages/parametre.html";
        }, 1500);

    } catch (error) {
        console.error(error);
        errorMessage.textContent = "Impossible de contacter le serveur";
        errorMessage.classList.add("show");
    }
});

// Masquer l'erreur au focus
document.querySelectorAll(".form-input").forEach(input => {
    input.addEventListener("focus", () => {
        errorMessage.classList.remove("show");
    });
});
