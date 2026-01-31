/*********************************************************
 * CONFIGURATION API & AUTHENTIFICATION
 *********************************************************/
const API_BASE_URL = "https://ldconnect-backend.onrender.com/api/tarifs";

/**
 * Génère les headers d’authentification pour les requêtes API
 */
function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}

/*********************************************************
 * VARIABLES GLOBALES
 *********************************************************/
let tarifs = [];           // Liste des tarifs chargés
let editingTarifId = null; // null = création | string = édition

/*********************************************************
 * RÉFÉRENCES DOM
 *********************************************************/
const modalAddTarif = document.getElementById("modalAddTarif");
const modalTitle = modalAddTarif.querySelector(".modal-title");

const btnAddTarif = document.getElementById("btnAddTarif");
const saveAddModal = document.getElementById("saveAddModal");
const closeAddModal = document.getElementById("closeAddModal");
const cancelAddModal = document.getElementById("cancelAddModal");

const formAddTarif = document.getElementById("formAddTarif");
const tarifNameInput = document.getElementById("tarifName");
const tarifDureeInput = document.getElementById("tarifDuree");
const tarifValidityInput = document.getElementById("tarifValidity");
const tarifPriceInput = document.getElementById("tarifPrice");

const modalLink = document.getElementById("modalLink");
const closeLinkModal = document.getElementById("closeLinkModal");
const linkDisplay = document.getElementById("linkDisplay");
const btnCopyLink = document.getElementById("btnCopyLink");

/*********************************************************
 * UTILITAIRES
 *********************************************************/

/**
 * Formate un prix avec séparateur de milliers
 */
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/*********************************************************
 * SPINNER TABLE
 *********************************************************/
function showTableSpinner() {
    document.getElementById("tableSpinner")?.style.setProperty("display", "table-row");
    document.getElementById("emptyState")?.style.setProperty("display", "none");
}

function hideTableSpinner() {
    document.getElementById("tableSpinner")?.style.setProperty("display", "none");
}

/*********************************************************
 * CHARGEMENT DES TARIFS
 *********************************************************/
async function loadTarifs() {
    showTableSpinner();

    try {
        const response = await fetch(API_BASE_URL, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error();

        tarifs = await response.json();
        renderTable();
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors du chargement des tarifs", "error");
    } finally {
        hideTableSpinner();
    }
}

/*********************************************************
 * AFFICHAGE DU TABLEAU
 *********************************************************/
function renderTable() {
    const tbody = document.getElementById("tarifsTableBody");
    const emptyState = document.getElementById("emptyState");
    const table = document.querySelector("table");

    tbody.innerHTML = "";

    if (!tarifs.length) {
        emptyState.style.display = "block";
        table.style.display = "none";
        return;
    }

    emptyState.style.display = "none";
    table.style.display = "table";

    tarifs.forEach((tarif, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td >${index + 1}</td>
            <td class="tarif-name">${tarif.name}</td>
            <td class="tarif-duration">${tarif.duration}</td>
            <td class="tarif-price">${formatPrice(tarif.price)} XOF</td>
            <td>
                <button class="action-btn btn-link" onclick="openLinkModal('${tarif._id}')">
                    <i class="fas fa-link"></i> Générer
                </button>
            </td>
            <td>
                <button class="action-btn btn-edit" onclick="openEditTarif('${tarif._id}')">
                    <i class="fas fa-edit"></i> Modifier
                </button>

                <button class="action-btn btn-delete" onclick="deleteTarif('${tarif._id}')">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/*********************************************************
 * MODAL — OUVERTURE (AJOUT)
 *********************************************************/
btnAddTarif.addEventListener("click", () => {
    editingTarifId = null;
    modalTitle.textContent = "Ajouter un tarif";
    formAddTarif.reset();
    saveAddModal.disabled = true;
    modalAddTarif.classList.add("show");
    tarifNameInput.focus();
});

/*********************************************************
 * MODAL — OUVERTURE (ÉDITION)
 *********************************************************/
function openEditTarif(tarifId) {
    const tarif = tarifs.find(t => t._id === tarifId);
    if (!tarif) return;

    editingTarifId = tarifId;
    modalTitle.textContent = "Modifier le tarif";

    tarifNameInput.value = tarif.name;
    tarifDureeInput.value = tarif.duration;
    tarifValidityInput.value = tarif.validity || "";
    tarifPriceInput.value = tarif.price;

    saveAddModal.disabled = false;
    modalAddTarif.classList.add("show");
}

/*********************************************************
 * MODAL — FERMETURE
 *********************************************************/
function closeModal() {
    modalAddTarif.classList.remove("show");
    formAddTarif.reset();
    saveAddModal.disabled = true;
    editingTarifId = null;
}

[closeAddModal, cancelAddModal].forEach(btn =>
    btn.addEventListener("click", closeModal)
);

modalAddTarif.addEventListener("click", e => {
    if (e.target === modalAddTarif) closeModal();
});

/*********************************************************
 * VALIDATION FORMULAIRE
 *********************************************************/
function validateForm() {
    const valid =
        tarifNameInput.value.trim() &&
        tarifDureeInput.value.trim() &&
        parseInt(tarifPriceInput.value) > 0;

    saveAddModal.disabled = !valid;
}

[tarifNameInput, tarifDureeInput, tarifPriceInput].forEach(input =>
    input.addEventListener("input", validateForm)
);

/*********************************************************
 * ENREGISTRER TARIF (POST / PUT)
 *********************************************************/
saveAddModal.addEventListener("click", async () => {
    const payload = {
        name: tarifNameInput.value.trim(),
        duration: tarifDureeInput.value.trim(),
        validity: tarifValidityInput.value.trim(),
        price: parseInt(tarifPriceInput.value),
        currency: "XOF"
    };

    const isEdit = Boolean(editingTarifId);
    const url = isEdit ? `${API_BASE_URL}/${editingTarifId}` : API_BASE_URL;
    const method = isEdit ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error();

        await loadTarifs();
        closeModal();

        showNotification(
            isEdit ? "Tarif modifié avec succès" : "Tarif ajouté avec succès",
            "success"
        );
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de l'enregistrement", "error");
    }
});

/*********************************************************
 * SUPPRESSION TARIF
 *********************************************************/
async function deleteTarif(tarifId) {
    if (!confirm("Voulez-vous supprimer ce tarif ?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/${tarifId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error();

        await loadTarifs();
        showNotification("Tarif supprimé avec succès", "success");
    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de la suppression", "error");
    }
}

/*********************************************************
 * LIEN DE PAIEMENT
 *********************************************************/
async function openLinkModal(tarifId) {
    try {
        const res = await fetch(`https://ldconnect-backend.onrender.com/api/payment-links/${tarifId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erreur serveur");

        linkDisplay.textContent = data.url;
        modalLink.classList.add("show");
    } catch (err) {
        console.error(err);
        showNotification(err.message, "error");
    }
}

closeLinkModal.addEventListener("click", () =>
    modalLink.classList.remove("show")
);

modalLink.addEventListener("click", e => {
    if (e.target === modalLink) modalLink.classList.remove("show");
});

/*********************************************************
 * COPIER LIEN
 *********************************************************/
btnCopyLink.addEventListener("click", () =>
    navigator.clipboard.writeText(linkDisplay.textContent)
        .then(() => showNotification("Lien copié", "success"))
        .catch(() => showNotification("Erreur de copie", "error"))
);

/*********************************************************
 * INITIALISATION
 *********************************************************/
loadTarifs();
