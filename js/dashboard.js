/***********************
 * CONFIG
 ***********************/
const API_URL = "https://ldconnect-backend.onrender.com";

let salesChart = null;
let stockChart = null;

const loadingOverlay = document.getElementById("loadingOverlay");

/***********************
 * LOADER
 ***********************/
function showLoader() {
    if (loadingOverlay) loadingOverlay.style.display = "flex";
}

function hideLoader() {
    if (loadingOverlay) loadingOverlay.style.display = "none";
}

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

/***********************
 * DASHBOARD
 ***********************/
async function loadDashboard() {
    showLoader();

    try {
        const res = await fetch(`${API_URL}/dashboard`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();

        renderUser(data.user);
        renderStats(data.stats);
        renderIndicators(data.stats.evolution);
        renderActivity(data.recentActivity);
        renderCharts(data.salesByDay, data.stockByTarif);

    } catch (err) {
        console.error("Dashboard error:", err);
        showNotification("Impossible de charger le dashboard.", "error");
    } finally {
        hideLoader();
    }
}

/***********************
 * USER
 ***********************/
function renderUser(user) {
    const userName = document.querySelector(".user-name");
    if (userName) userName.textContent = user.name || "Utilisateur";
}

/***********************
 * STATS
 ***********************/
function renderStats(stats) {
    animateValue("soldTickets", 0, stats.soldTickets, 1200);
    animateValue("totalRevenue", 0, stats.totalRevenue, 1200, true);
    animateValue("stockTickets", 0, stats.stockTickets, 1200);
}

/***********************
 * INDICATORS
 ***********************/
function renderIndicators(evolution) {
    setStatChange(0, `${evolution.soldTickets}% vs semaine dernière`);
    setStatChange(1, `${evolution.revenue}% vs semaine dernière`);
    setStatChange(2, "Ne laissez jamais votre stock descendre en dessous de 10");
}

function setStatChange(index, text) {
    const card = document.querySelectorAll(".stat-card")[index];
    if (!card) return;
    const span = card.querySelector(".stat-change span");
    if (span) span.textContent = text;
}

/***********************
 * ACTIVITY
 ***********************/
function renderActivity(activities = []) {
    const list = document.getElementById("activityList");

    if (!activities.length) {
        list.innerHTML = "<p>Aucune vente récente</p>";
        return;
    }

    list.innerHTML = activities.map(item => `
        <div class="activity-item">
            <div class="activity-info">
                <div class="activity-ticket">${item.ticket}</div>
                <div class="activity-tarif">${item.tarif}</div>
            </div>
            <div class="activity-meta">
                <div class="activity-amount">${formatPrice(item.amount)} XOF</div>
                <div class="activity-date">${new Date(item.date).toLocaleString()}</div>
            </div>
        </div>
    `).join("");
}

/***********************
 * CHARTS
 ***********************/
function renderCharts(salesByDay, stockByTarif) {
    renderSalesChart(salesByDay);
    renderStockChart(stockByTarif);

    window.addEventListener("resize", () => {
        salesChart?.resize();
        stockChart?.resize();
    });
}

function renderSalesChart(data) {
    if (!salesChart) {
        salesChart = echarts.init(document.getElementById("salesChart"));
    } else {
        salesChart.clear();
    }

    salesChart.setOption({
        tooltip: {
            trigger: "axis",
            backgroundColor: "#111827",
            textStyle: { color: "#fff" }
        },
        xAxis: {
            type: "category",
            data: data.labels,
            boundaryGap: false
        },
        yAxis: { type: "value" },
        series: [{
            name: "Ventes",
            type: "line",
            smooth: true,
            data: data.data,
            areaStyle: {}
        }]
    });
}

function renderStockChart(data) {
    if (!stockChart) {
        stockChart = echarts.init(document.getElementById("stockChart"));
    } else {
        stockChart.clear();
    }

    stockChart.setOption({
        tooltip: { trigger: "item" },
        series: [{
            type: "pie",
            radius: ["55%", "75%"],
            data: data.labels.map((label, i) => ({
                name: label,
                value: data.data[i]
            }))
        }]
    });
}

/***********************
 * UTILITIES
 ***********************/
function animateValue(id, start, end, duration, isCurrency = false) {
    const el = document.getElementById(id);
    if (!el) return;

    const range = end - start;
    let current = start;
    const increment = range / (duration / 16);

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }

        el.textContent = isCurrency
            ? `${formatPrice(Math.floor(current))} XOF`
            : Math.floor(current);
    }, 16);
}

function formatPrice(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
