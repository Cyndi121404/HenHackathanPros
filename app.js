let darkMode = true;
let scannerRunning = false;

function toggleScanner() {
    let scannerContainer = document.getElementById("scanner-container");
    scannerContainer.classList.toggle("hidden");
    
    if (!scannerContainer.classList.contains("hidden")) {
        startScanner();
    } else {
        stopScanner();
    }
}

function startScanner() {
    if (scannerRunning) return;
    scannerRunning = true;
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector("#scanner"),
            constraints: {
                facingMode: "environment"
            }
        },
        decoder: {
            readers: ["ean_reader", "upc_reader"]
        }
    }, function(err) {
        if (err) {
            console.error("QuaggaJS initialization failed:", err);
            return;
        }
        Quagga.start();
    });

    Quagga.onDetected(data => {
        stopScanner();
        fetchDrugInfo(data.codeResult.code);
    });
}

function stopScanner() {
    if (scannerRunning) {
        Quagga.stop();
        scannerRunning = false;
    }
}

function fetchDrugInfo(code) {
    fetch(`https://api.fda.gov/drug/ndc.json?search=product_ndc:${code}`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                let drug = data.results[0];
                document.getElementById("drug-info").innerHTML = `<h2>${drug.brand_name}</h2><p>${drug.dosage_form}</p>`;
                addDrugToList(drug.brand_name);
                requestNotification();
            } else {
                document.getElementById("drug-info").innerHTML = "<p>No drug found for this barcode.</p>";
            }
        })
        .catch(err => console.error("Error fetching drug data:", err));
}

function manualSearch() {
    let query = document.getElementById("search-input").value.trim();
    if (!query) {
        alert("Please enter a valid drug name or NDC.");
        return;
    }

    fetch(`https://api.fda.gov/drug/ndc.json?search=brand_name:"${query}"`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                let drug = data.results[0];
                document.getElementById("drug-info").innerHTML = `<h2>${drug.brand_name}</h2><p>${drug.dosage_form}</p>`;
                addDrugToList(drug.brand_name);
                requestNotification();
            } else {
                document.getElementById("drug-info").innerHTML = "<p>No results found.</p>";
            }
        })
        .catch(err => console.error("Error fetching drug data:", err));
}

function addDrugToList(name) {
    let list = document.getElementById("drug-list");
    let item = document.createElement("li");
    item.textContent = name;
    list.appendChild(item);
}

function requestNotification() {
    if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                scheduleNotification();
            }
        });
    } else if (Notification.permission === "granted") {
        scheduleNotification();
    }
}

function scheduleNotification() {
    let time = prompt("Enter reminder time in minutes:");
    let delay = parseInt(time, 10);
    if (!isNaN(delay) && delay > 0) {
        setTimeout(() => new Notification("Medication Reminder!"), delay * 60000);
    } else {
        alert("Invalid time entered.");
    }
}

function toggleTheme() {
    darkMode = !darkMode;
    document.body.style.backgroundColor = darkMode ? "#2c1b0f" : "#888";
    document.body.style.color = darkMode ? "#a0e0ff" : "black";
}
