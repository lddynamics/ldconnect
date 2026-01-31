/***********************
 * CONFIG API + AUTH
 ***********************/
const API_TICKETS = "https://ldconnect-backend.onrender.com/api/tickets";

function getAuthHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

const API_TARIFS = `https://ldconnect-backend.onrender.com/api/tarifs`;

let tarifs = [];


/***********************
 * DATA
 ***********************/
let tickets = [];
let tarifsMap = {}; // { tariffId: { name, price } }
let filteredTickets = []; // tickets après filtres

/***********************
 * SPINNER TABLE
 ***********************/
function showSpinner() {
    const tbody = document.getElementById("ticketsBody");
    tbody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; padding:40px">
                <i class="fas fa-spinner fa-spin" style="font-size:26px;color:#6366f1"></i>
                <p style="margin-top:10px;color:#6b7280">Chargement des tickets...</p>
            </td>
        </tr>
    `;
}

function hideSpinner() {
    document.getElementById("tableSpinner").style.display = "none";
}

/***********************
 * LOAD TICKETS (GET)
 ***********************/
async function loadTickets() {
    showSpinner();

    try {
        const res = await fetch(API_TICKETS, {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Erreur API");

        tickets = await res.json();

        hideSpinner();
        renderTickets();

    } catch (err) {
        hideSpinner();
        console.error(err);
        showNotification("Erreur de chargement des tickets", "error");
    }
}

/***********************
 * FONCTION RENDER TABLE
 ***********************/
function renderTickets(list = tickets) {
    const tbody = document.getElementById("ticketsBody");
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:20px">
                    Aucun ticket trouvé
                </td>
            </tr>
        `;
        return;
    }

    list.forEach(ticket => {
        const tarif = ticket.tarif;

        const tarifLabel = tarif
            ? `${tarif.name} (${formatPrice(tarif.price)} XOF)`
            : "Tarif supprimé (-)";

        const row = `
            <tr>
                <td>${ticket.username}</td>
                <td>${ticket.password}</td>
                <td>${tarifLabel}</td>
                <td>
                    <span class="badge badge-${ticket.state === "ACTIVE" ? "active" : "sold"}">
                        ${ticket.state}
                    </span>
                </td>
                <td>
                    <button class="action-btn btn-view"
                        onclick="viewTicketDetails('${ticket._id}')">
                        <i class="fas fa-eye"></i>
                    </button>

                    <button class="action-btn btn-delete"
                        onclick="deleteTicket('${ticket._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>

            </tr>
        `;

        tbody.innerHTML += row;
    });
}


/***********************
 * FORMAT PRIX
 ***********************/
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("fr-FR");
}


/***********************
 * TARIF SELECTS
 ***********************/
async function loadTarifs() {
    try {
        const res = await fetch(API_TARIFS, {
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error("Erreur chargement tarifs");

        tarifs = await res.json();
        populateTarifSelects();

    } catch (err) {
        console.error(err);
        showNotification("Impossible de charger les tarifs", "error");
    }
}



function populateTarifSelects() {
    const addTarif = document.getElementById("addTarif");
    const importTarif = document.getElementById("importTarif");
    const filterTarif = document.getElementById("filterTarif");

    // reset
    addTarif.innerHTML = `<option value="">Choisir un tarif</option>`;
    importTarif.innerHTML = `<option value="">Choisir un tarif</option>`;
    filterTarif.innerHTML = `<option value="">Tous les tarifs</option>`;

    tarifs.forEach(tarif => {
        const label = `${tarif.name} (${formatPrice(tarif.price)} ${tarif.currency})`;

        addTarif.innerHTML += `
            <option value="${tarif._id}">${label}</option>
        `;

        importTarif.innerHTML += `
            <option value="${tarif._id}">${label}</option>
        `;

        filterTarif.innerHTML += `
            <option value="${tarif._id}">${label}</option>
        `;
    });
}



/***********************
 * FILTERS
 ***********************/
function applyFilters() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const tarifId = document.getElementById("filterTarif").value;
    const status = document.getElementById("filterStatus").value;

    filteredTickets = tickets.filter(ticket => {
        // 🔍 Recherche
        const matchSearch =
            ticket.username.toLowerCase().includes(search) ||
            ticket.password.toLowerCase().includes(search);

        // 🏷️ Tarif
        const matchTarif = !tarifId || ticket.tarif?._id === tarifId;

        // 🟢 État
        const matchStatus = !status || ticket.state === status;

        return matchSearch && matchTarif && matchStatus;
    });

    renderTickets(filteredTickets);
}

/***********************
 * ADD TICKET (POST)
 ***********************/
async function saveTicket() {
    const typeSelect = document.getElementById("addType").value;
    const tarifId = document.getElementById("addTarif").value;

    if (!tarifId) {
        showNotification("Veuillez choisir un tarif", "warning");
        return;
    }

    let username, password, type;

    if (typeSelect === "same") {
        const code = document.getElementById("addCode").value.trim();
        if (!code) {
            showNotification("Veuillez entrer le code", "warning");
            return;
        }
        username = code;
        password = code;
        type = "CRED";
    } else {
        username = document.getElementById("addUsername").value.trim();
        password = document.getElementById("addPassword").value.trim();
        type = "PAIR";

        if (!username || !password) {
            showNotification("Username et password requis", "warning");
            return;
        }
    }

    try {
        const res = await fetch(API_TICKETS, {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tarif: tarifId,
                type,
                username,
                password
            })
        });

        if (!res.ok) throw new Error("Erreur création ticket");

        showNotification("Ticket ajouté avec succès", "success");
        closeModal("modalAdd");

        // reset form
        document.getElementById("addUsername").value = "";
        document.getElementById("addPassword").value = "";
        document.getElementById("addCode").value = "";

        // reload tickets
        loadTickets();

    } catch (err) {
        console.error(err);
        showNotification("Erreur lors de l'ajout du ticket", "error");
    }
}


/***********************
 * DELETE TICKET
 ***********************/
async function deleteTicket(id) {
    if (!confirm("Supprimer ce ticket ?")) return;

    try {
        const res = await fetch(`${API_TICKETS}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!res.ok) throw new Error();

        loadTickets();
        showNotification("Ticket supprimé", "success");

    } catch (err) {
        console.error(err);
        showNotification("Erreur suppression", "error");
    }
}

/***********************
 * UI HELPERS
 ***********************/
function showModal(id) {
    document.getElementById(id).classList.add("show");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function toggleCodeField() {
    const same = document.getElementById("addType").value === "same";
    document.getElementById("groupUsername").style.display = same ? "none" : "block";
    document.getElementById("groupPassword").style.display = same ? "none" : "block";
    document.getElementById("groupCode").style.display = same ? "block" : "none";
}

/***********************
 * IMPORTS
 ***********************/
function parseCSV(text) {
    const lines = text.split("\n").filter(l => l.trim() !== "");
    const rows = [];

    for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(",");

        if (cols.length < 2) continue;

        const username = cols[0].trim();
        const password = cols[1].trim();

        // ignorer entêtes
        if (username.toLowerCase() === "username") continue;

        rows.push({ username, password });
    }

    return rows;
}


async function importTickets() {
    const fileInput = document.getElementById("importFile");
    const tarifId = document.getElementById("importTarif").value;
    const type = document.getElementById("importType").value;

    if (!fileInput.files.length) {
        showNotification("Veuillez sélectionner un fichier CSV", "error");
        return;
    }

    if (!tarifId) {
        showNotification("Veuillez choisir un tarif", "error");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
        const rows = parseCSV(reader.result);

        if (rows.length === 0) {
            showNotification("Aucun ticket valide trouvé", "error");
            return;
        }

        try {
            const res = await fetch(`${API_TICKETS}/import`, {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tariffId: tarifId,
                    type,
                    tickets: rows
                })
            });

            if (!res.ok) throw new Error();

            showNotification(`${rows.length} tickets importés`, "success");
            closeModal("modalImport");
            loadTickets();

        } catch (err) {
            console.error(err);
            showNotification("Erreur lors de l'import", "error");
        }
    };

    reader.readAsText(file);
}

/***********************
 * UTILS
 ***********************/

function viewTicketDetails(ticketId) {
    const ticket = tickets.find(t => t._id === ticketId);
    if (!ticket) return;

    const tarif = ticket.tarif;

    document.getElementById("dUsername").textContent = ticket.username;
    document.getElementById("dPassword").textContent = ticket.password;

    document.getElementById("dPrice").textContent = tarif
        ? `${formatPrice(tarif.price)} ${tarif.currency}`
        : "-";

    document.getElementById("dDuration").textContent = tarif?.duration || "-";
    document.getElementById("dValidity").textContent = tarif?.validity || "-";

    document.getElementById("dState").textContent = ticket.state;

    document.getElementById("dSoldAt").textContent =
        ticket.state === "SOLD" && ticket.soldAt
            ? new Date(ticket.soldAt).toLocaleString()
            : "—";

    showModal("modalViewTicket");


    const stateEl = document.getElementById("dState");

    stateEl.textContent = ticket.state;

    // reset classes
    stateEl.classList.remove("state-active", "state-sold");

    // appliquer la bonne classe
    if (ticket.state === "ACTIVE") {
        stateEl.classList.add("state-badge", "state-active");
    } else {
        stateEl.classList.add("state-badge", "state-sold");
    }

}

/***********************
 * INIT
 ***********************/
document.getElementById("btnAdd").onclick = () => showModal("modalAdd");
document.getElementById("btnImport").onclick = () => showModal("modalImport");
document.getElementById("addType").onchange = toggleCodeField;

document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("filterTarif").addEventListener("change", applyFilters);
document.getElementById("filterStatus").addEventListener("change", applyFilters);

loadTarifs();   // 👈 d'abord les tarifs
loadTickets();
