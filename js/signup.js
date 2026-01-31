// Éléments du DOM
const form = document.getElementById('signupForm');
const wifiNameInput = document.getElementById('wifiName');
const emailInput = document.getElementById('email');
const contactInput = document.getElementById('contact');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Validation en temps réel pour le nom du Wi-Fi
wifiNameInput.addEventListener('input', function () {
    validateField(this, this.value.trim().length >= 3, 'wifiName');
});

// Validation en temps réel pour l'email
emailInput.addEventListener('input', function () {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validateField(this, emailRegex.test(this.value), 'email');
});

// Validation en temps réel pour le contact
contactInput.addEventListener('input', function () {
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    validateField(this, phoneRegex.test(this.value.replace(/\s/g, '')), 'contact');
});

// Validation et indicateur de force du mot de passe
passwordInput.addEventListener('input', function () {
    const password = this.value;
    const strength = checkPasswordStrength(password);

    // Afficher l'indicateur
    document.getElementById('passwordStrength').classList.add('show');

    // Mettre à jour les barres
    updateStrengthBars(strength);

    // Validation
    validateField(this, strength >= 2, 'password');
});

// Fonction de validation de champ
function validateField(input, isValid, fieldName) {
    const icon = document.getElementById(fieldName + 'Icon');
    const error = document.getElementById(fieldName + 'Error');

    if (isValid) {
        input.classList.remove('invalid');
        input.classList.add('valid');
        icon.textContent = '✓';
        icon.className = 'validation-icon valid show';
        error.classList.remove('show');
    } else if (input.value.length > 0) {
        input.classList.remove('valid');
        input.classList.add('invalid');
        icon.textContent = '✗';
        icon.className = 'validation-icon invalid show';
        error.classList.add('show');
    } else {
        input.classList.remove('valid', 'invalid');
        icon.classList.remove('show');
        error.classList.remove('show');
    }
}

// Vérifier la force du mot de passe
function checkPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return Math.min(strength, 4);
}

// Mettre à jour les barres de force
function updateStrengthBars(strength) {
    const bars = ['bar1', 'bar2', 'bar3', 'bar4'];
    const strengthText = document.getElementById('strengthText');

    bars.forEach((bar, index) => {
        const element = document.getElementById(bar);
        element.classList.remove('active', 'weak', 'medium', 'strong');

        if (index < strength) {
            element.classList.add('active');
            if (strength <= 1) element.classList.add('weak');
            else if (strength <= 2) element.classList.add('medium');
            else element.classList.add('strong');
        }
    });

    // Texte de force
    if (strength === 0) strengthText.textContent = 'Trop faible';
    else if (strength === 1) strengthText.textContent = 'Faible';
    else if (strength === 2) strengthText.textContent = 'Moyen';
    else if (strength === 3) strengthText.textContent = 'Fort';
    else strengthText.textContent = 'Très fort';

    strengthText.style.color = strength <= 1 ? '#ef4444' : strength === 2 ? '#f59e0b' : '#10b981';
}

// Soumission du formulaire
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');

    const name = wifiNameInput.value.trim();   // correspond à "name" backend
    const email = emailInput.value.trim();
    const contact = contactInput.value.trim();
    const password = passwordInput.value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    const passwordStrength = checkPasswordStrength(password);

    const isValid =
        name.length >= 3 &&
        emailRegex.test(email) &&
        phoneRegex.test(contact.replace(/\s/g, '')) &&
        passwordStrength >= 2;

    if (!isValid) {
        errorMessage.classList.add('show');

        validateField(wifiNameInput, name.length >= 3, 'wifiName');
        validateField(emailInput, emailRegex.test(email), 'email');
        validateField(contactInput, phoneRegex.test(contact.replace(/\s/g, '')), 'contact');
        validateField(passwordInput, passwordStrength >= 2, 'password');
        return;
    }

    try {
        const response = await fetch("https://ldconnect-backend.onrender.com/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password,
                contact
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent = data.message || "Erreur lors de l'inscription";
            errorMessage.classList.add('show');
            return;
        }

        // Succès
        successMessage.classList.add('show');

        // Stockage du token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirection
        setTimeout(() => {
            window.location.href = "pages/parametre.html";
        }, 2000);

    } catch (error) {
        console.error(error);
        errorMessage.textContent = "Impossible de contacter le serveur";
        errorMessage.classList.add('show');
    }
});

// Masquer les messages au focus
[wifiNameInput, emailInput, contactInput, passwordInput].forEach(input => {
    input.addEventListener('focus', () => {
        errorMessage.classList.remove('show');
    });
});
