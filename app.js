document.addEventListener("DOMContentLoaded", () => {
    const scanBtn = document.getElementById("scan-btn");
    const notificationBtn = document.getElementById("enable-notifications");
    const submitSideEffectBtn = document.getElementById("submit-side-effect");
    const contrastToggle = document.getElementById("toggle-contrast");
    const body = document.body;
    const scannedBarcode = document.getElementById("scanned-barcode");
    const medicineList = document.getElementById("medicine-list");
    const medicineDetails = document.getElementById("medicine-details");
    const manualEntryForm = document.getElementById("manual-entry-form");

    // Toggle high contrast mode for accessibility
    contrastToggle.addEventListener("click", () => {
        body.classList.toggle("high-contrast");
    });

    // Barcode Scanner Setup (QuaggaJS)
    scanBtn.addEventListener("click", () => {
        startScanner();
    });

    function startScanner() {
        Quagga.init({
            inputStream: {
                type: "LiveStream",
                constraints: {
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["ean_reader", "upc_reader"]
            }
        }, function (err) {
            if (err) {
                console.log("Error initializing scanner: ", err);
                return;
            }
            Quagga.start();
            document.getElementById("scanner-preview").hidden = false; // Show camera stream
        });

        Quagga.onDetected(function(result) {
            const barcode = result.codeResult.code;
            scannedBarcode.textContent = `Scanned Barcode: ${barcode}`;
            storeMedicine(barcode); // Store scanned medicine
            fetchMedicineInfo(barcode); // Fetch details from OpenFDA API
            Quagga.stop(); // Stop scanner once a barcode is detected
        });
    }

    // Store Medicine in LocalStorage (Simple Database)
    function storeMedicine(barcode, name, manufacturer, dosageForm, notes) {
        const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
        const medicine = { barcode, name, manufacturer, dosageForm, notes };
        
        if (!medicines.some(m => m.barcode === barcode)) {
            medicines.push(medicine);
            localStorage.setItem("medicines", JSON.stringify(medicines));
            updateMedicineList();
        }
    }

    // Fetch Medicine Info from OpenFDA API
    async function fetchMedicineInfo(barcode) {
        try {
            const apiUrl = `https://api.fda.gov/drug/ndc.json?search=product_ndc:${barcode}&limit=1`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const medicine = data.results[0];
                displayMedicineDetails(medicine);
            } else {
                alert("No data found for this barcode.");
            }
        } catch (error) {
            console.error("Error fetching data from OpenFDA: ", error);
        }
    }

    // Display Medicine Details from OpenFDA
    function displayMedicineDetails(medicine) {
        const name = medicine.openfda.brand_name ? medicine.openfda.brand_name[0] : "Unknown";
        const manufacturer = medicine.openfda.manufacturer_name ? medicine.openfda.manufacturer_name[0] : "Unknown Manufacturer";
        const dosageForm = medicine.dosage_form ? medicine.dosage_form : "Unknown dosage form";
        
        medicineDetails.innerHTML = `
            <h3>Medicine Information:</h3>
            <p><strong>Brand Name:</strong> ${name}</p>
            <p><strong>Manufacturer:</strong> ${manufacturer}</p>
            <p><strong>Dosage Form:</strong> ${dosageForm}</p>
        `;
    }

    // Update the list of stored medicines
    function updateMedicineList() {
        const medicines = JSON.parse(localStorage.getItem("medicines")) || [];
        medicineList.innerHTML = medicines.map(medicine => `
            <li>
                <strong>Medicine:</strong> ${medicine.name} <br>
                <strong>Manufacturer:</strong> ${medicine.manufacturer} <br>
                <strong>Dosage:</strong> ${medicine.dosageForm} <br>
                <strong>Barcode:</strong> ${medicine.barcode || "N/A"} <br>
                <strong>Notes:</strong> ${medicine.notes || "No notes"} 
            </li>
        `).join("");
    }

    // Handle Manual Medicine Entry
    manualEntryForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const name = document.getElementById("medicine-name").value;
        const manufacturer = document.getElementById("manufacturer").value;
        const dosageForm = document.getElementById("dosage-form").value;
        const barcode = document.getElementById("barcode").value;
        const notes = document.getElementById("notes").value;
        
        if (name && manufacturer && dosageForm) {
            storeMedicine(barcode, name, manufacturer, dosageForm, notes);
            // Clear the form
            manualEntryForm.reset();
        } else {
            alert("Please fill in all required fields.");
        }
    });

    // Enable Push Notifications
    notificationBtn.addEventListener("click", () => {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Medicine reminders enabled!");
            }
        });
    });

    // Log Side Effects
    submitSideEffectBtn.addEventListener("click", () => {
        const sideEffectInput = document.getElementById("side-effect-input").value;
        if (sideEffectInput.trim()) {
            alert(`Side effect logged: ${sideEffectInput}`);
            document.getElementById("side-effect-input").value = ""; // Clear input
        }
    });

    // Initialize the medicine list on load
    updateMedicineList();
});
