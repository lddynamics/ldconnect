// ========== MENU UTILISATEUR ==========
const userTrigger = document.getElementById("userTrigger");
const userDropdown = document.getElementById("userDropdown");

userTrigger.addEventListener("click", () => {
    userDropdown.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!userTrigger.contains(e.target)) {
        userDropdown.classList.remove("open");
    }
});

// Déconnexion
document.querySelector(".logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "../login.html";
});


// ========== MENU MOBILE ==========
const navbarToggle = document.getElementById('navbarToggle');
const navbarMenu = document.getElementById('navbarMenu');

navbarToggle.addEventListener('click', () => {
    navbarToggle.classList.toggle('active');
    navbarMenu.classList.toggle('active');
});