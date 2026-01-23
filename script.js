let map;
let vectorLayer;

// Tab Switching Logic
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

// Variable to store the original button text
let originalBtnText = "";
let currentActiveBtn = null;

async function performSearch(url, buttonId) {
    const resultDiv = document.getElementById("result");
    const searchBtn = document.getElementById(buttonId);
    
    // 1. UI Feedback: Change button text and disable it
    originalBtnText = searchBtn.innerText;
    searchBtn.innerText = "Searching... Please wait.";
    searchBtn.disabled = true;
    searchBtn.style.opacity = "0.7";
    searchBtn.style.cursor = "not-allowed";

    if (typeof refreshAds === "function") refreshAds();

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data || data[0].Status !== "Success") {
            resultDiv.innerHTML = `<div class="card">No results found. Please check your entry.</div>`;
        } else {
            resultDiv.innerHTML = "";
            data[0].PostOffice.forEach(po => {
                resultDiv.innerHTML += `
                    <div class="card">
                        <div class="card-title">${po.Name}</div>
                        <div class="card-detail"><b>PIN Code:</b> ${po.Pincode}</div>
                        <div class="card-detail"><b>Block:</b> ${po.Block}</div>
                        <div class="card-detail"><b>Division:</b> ${po.Division}</div>
                        <div class="card-detail"><b>Region:</b> ${po.Region}</div>
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
        }
    } catch (e) {
        resultDiv.innerHTML = `<div class="card">API Error. Please try again later.</div>`;
    } finally {
        // 2. Reset Button: Always restore the button text when finished
        searchBtn.innerText = originalBtnText;
        searchBtn.disabled = false;
        searchBtn.style.opacity = "1";
        searchBtn.style.cursor = "pointer";
    }
}

// Updated triggers to pass the button ID
function searchByPin() {
    const pin = document.getElementById("pincode").value.trim();
    if (/^\d{6}$/.test(pin)) {
        performSearch(`https://api.postalpincode.in/pincode/${pin}`, "pinBtn");
    } else {
        alert("Invalid 6-digit PIN");
    }
}

function searchByLocation() {
    const loc = document.getElementById("location").value.trim();
    if (loc.length > 2) {
        performSearch(`https://api.postalpincode.in/postoffice/${loc}`, "locBtn");
    } else {
        alert("Enter at least 3 characters");
    }
}

// Utility: Copy PIN to clipboard
function copyPin(pin) {
    navigator.clipboard.writeText(pin).then(() => {
        alert("PIN Copied: " + pin);
    });
}

// Map Logic: OpenLayers Implementation
async function openMap(name, dist, state) {
    document.getElementById("mapModal").style.display = "block";
    
    if (typeof refreshAds === "function") refreshAds();

    // Initialize Map if it doesn't exist
    if (!map) {
        map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([78.9629, 20.5937]), // Center of India
                zoom: 5
            })
        });
    }

    // Search for coordinates using Nominatim
    try {
        const query = encodeURIComponent(`${name}, ${dist}, ${state}, India`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await res.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const coords = ol.proj.fromLonLat([lon, lat]);

            // Remove old marker layer if it exists
            if (vectorLayer) {
                map.removeLayer(vectorLayer);
            }

            // Create a new marker
            const marker = new ol.Feature({
                geometry: new ol.geom.Point(coords)
            });

     // New Style for the Marker (Professional Red Pin)
	marker.setStyle(new ol.style.Style({
    	image: new ol.style.Icon({
        anchor: [0.5, 1], // This ensures the tip of the pin points to the coordinate
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        // Using a high-quality standard red marker icon
        src: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        scale: 0.08 // Adjust this number (0.05 to 0.1) to make the pin larger or smaller
    })
}));

            vectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [marker]
                })
            });

            map.addLayer(vectorLayer);

            // Zoom to the location
            map.getView().animate({
                center: coords,
                zoom: 13,
                duration: 1000
            });
        }
    } catch (error) {
        console.error("Map search error:", error);
    }
}

// Close Map Modal
function closeMap() {
    document.getElementById("mapModal").style.display = "none";
}

// Scroll to top on Header Click
const headerElement = document.querySelector('header');
if (headerElement) {
    headerElement.onclick = () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
        if (typeof refreshAds === "function") refreshAds();
    };
}
