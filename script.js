let map;

// Refresh Ads visually
function refreshAds() {
    const adSelectors = '.ad-box-300-600, .ad-box-728-90, .ad-box.square';
    document.querySelectorAll(adSelectors).forEach(ad => {
        ad.style.opacity = "0.3";
        setTimeout(() => {
            ad.style.opacity = "1";
        }, 400);
    });
}

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    if (tab === 'pin') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('pinTab').classList.add('active');
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('locationTab').classList.add('active');
    }
}

// Search Logic
async function performSearch(url) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<div class="loader" style="text-align:center;">Searching... Please wait.</div>`;
    refreshAds();

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data[0].Status !== "Success") {
            resultDiv.innerHTML = `<div class="card">No results found.</div>`;
            return;
        }

        resultDiv.innerHTML = "";
        data[0].PostOffice.forEach(po => {
            resultDiv.innerHTML += `
                <div class="card">
                    <div class="card-title">${po.Name}</div>
                    <div class="card-detail"><b>PIN Code:</b> ${po.Pincode}</div>
                    <div class="card-detail"><b>Block:</b> ${po.Block}</div>
                    <div class="card-detail"><b>Division:</b> ${po.Division}</div>
                    <div class="card-detail"><b>District:</b> ${po.District}</div>
                    <div class="card-detail"><b>State:</b> ${po.State}</div>
                    <div class="card-detail"><b>Country:</b> ${po.Country}</div>
                    <div class="card-footer">Type: ${po.BranchType} | ${po.DeliveryStatus}</div>
                    <div class="card-actions">
                        <button onclick="copyPin('${po.Pincode}')">Copy PIN</button>
                        <button onclick="openMap('${po.Name}','${po.District}','${po.State}')">View on Map</button>
                    </div>
                </div>`;
        });
    } catch (e) {
        resultDiv.innerHTML = `<div class="card">API Error. Please try again.</div>`;
    }
}

function searchByPin() {
    const pin = document.getElementById("pincode").value;
    if (/^\d{6}$/.test(pin)) performSearch(`https://api.postalpincode.in/pincode/${pin}`);
    else alert("Invalid 6-digit PIN");
}

function searchByLocation() {
    const loc = document.getElementById("location").value;
    if (loc.length > 2) performSearch(`https://api.postalpincode.in/postoffice/${loc}`);
    else alert("Enter at least 3 characters");
}

// Utility
function copyPin(pin) {
    navigator.clipboard.writeText(pin).then(() => alert("PIN Copied: " + pin));
}

// Map Logic
async function openMap(name, dist, state) {
    document.getElementById("mapModal").style.display = "block";
    refreshAds();

    if (!map) {
        map = L.map('map').setView([20, 78], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }

    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${name}, ${dist}, ${state}, India`);
    const data = await res.json();

    if (data.length) {
        const lat = data[0].lat;
        const lon = data[0].lon;
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup(name).openPopup();
    }
}

function closeMap() {
    document.getElementById("mapModal").style.display = "none";
}

// Scroll to top on Header Click
document.querySelector('header').onclick = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
    refreshAds();
};