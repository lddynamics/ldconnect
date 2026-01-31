/***********************
 * NOTIFICATIONS
 ***********************/
function showNotification(message, type = "success") {
    const notif = document.createElement("div");
    notif.className = `notification notification-${type}`;
    notif.innerHTML = `<span>${message}</span>`;

    document.body.appendChild(notif);

    setTimeout(() => notif.classList.add("show"), 10);
    setTimeout(() => {
        notif.classList.remove("show");
        setTimeout(() => notif.remove(), 200);
    }, 3000);
}


//Auto Guard
const token = localStorage.getItem("token");

if (!token) {
  redirectToLogin("Accès non autorisé");
}

async function verifyToken() {
  try {
    const res = await fetch("https://ldconnect-backend.onrender.com/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Token invalide");
    }

    await res.json();
  } catch (err) {
    redirectToLogin("Session expirée");
  }
}

verifyToken();

function redirectToLogin(message) {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");

  showNotification(message, "error");

  setTimeout(() => {
    window.location.href = "../login.html";
  }, 2000);
}
