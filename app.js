let darkMode = true;

function toggleScanner() {
    let scannerContainer = document.getElementById("scanner-container");
    scannerContainer.classList.toggle("hidden");
    if (!scannerContainer.classList.contains("hidden")) {
        startScanner();
    } else {
        Quagga.stop();
    }
}

function startScanner() {
    Quagga.init({
        inputStream: { name: "Live", type: "LiveStream", target: document.querySelector("#scanner") },
        decoder: { readers: ["ean_reader", "upc_reader"] }
    }, function(err) {
        if (!err) { Quagga.start(); }
    });
    Quagga.onDetected(data => {
        fetchDrugInfo(data.codeResult.code);
        Quagga.stop();
    });
}

function fetchDrugInfo(code) {
    fetch(`https://api.fda.gov/drug/ndc.json?search=product_ndc:${code}`)
        .then(response => response.json())
        .then(data => {
            if (data.results) {
                let drug = data.results[0];
                document.getElementById("drug-info").innerHTML = `<h2>${drug.brand_name}</h2><p>${drug.dosage_form}</p>`;
                addDrugToList(drug.brand_name);
                requestNotification();
            }
        });
}

function manualSearch() {
    let query = document.getElementById("search-input").value;
    fetch(`https://api.fda.gov/drug/ndc.json?search=brand_name:${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.results) {
                let drug = data.results[0];
                document.getElementById("drug-info").innerHTML = `<h2>${drug.brand_name}</h2><p>${drug.dosage_form}</p>`;
                addDrugToList(drug.brand_name);
                requestNotification();
            }
        });
}

function addDrugToList(name) {
    let list = document.getElementById("drug-list");
    let item = document.createElement("li");
    item.textContent = name;
    list.appendChild(item);
}

function requestNotification() {
    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    } else {
        let time = prompt("Enter reminder time in minutes:");
        setTimeout(() => new Notification("Medication Reminder!"), time * 60000);
    }
}

function toggleTheme() {
    darkMode = !darkMode;
    document.body.style.backgroundColor = darkMode ? "#2c1b0f" : "#888";
    document.body.style.color = darkMode ? "#a0e0ff" : "black";
}
