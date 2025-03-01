document.addEventListener("DOMContentLoaded", () => {
    const scanBtn = document.getElementById("scan-btn");
    const scannerPreview = document.getElementById("scanner-preview");
    const scannedBarcode = document.getElementById("scanned-barcode");
    const video = document.getElementById("scanner-stream");
    const manualEntryForm = document.getElementById("manual-entry-form");
    const medicinesList = document.getElementById("medicines");
    const medicineInfo = document.getElementById("medicine-info");
    const toggleAccessibilityBtn = document.getElementById("toggle-accessibility");

    // List to store medications
    let medications = [];

    // Toggle accessibility mode (high contrast greyscale)
    toggleAccessibilityBtn.addEventListener("click", () => {
        document.body.classList.toggle("high-contrast");
    });

    // Button to start barcode scanning
    scanBtn.addEventListener("click", startScanner);

    // Function to start scanning using Quagga
    function startScanner() {
        // Initialize the scanner
        Quagga.init({
            inputStream: {
                type: "LiveStream",
                constraints: {
                    facingMode: "environment"
                }
            },
            decoder: {
                readers: ["ean_reader", "upc_reader", "code_128_reader", "ean_13_reader"]
            }
        }, function(err) {
            if (err) {
                console.log("Error initializing scanner:", err);
                return;
            }
            Quagga.start();
            scannerPreview.hidden = false; // Show video preview
        });

        // Listen for detected barcode
        Quagga.onDetected(function(result) {
            const barcode = result.codeResult.code;
            scannedBarcode.textContent = `Scanned Barcode: ${barcode}`;
            fetchMedicineInfo(barcode); // Fetch information from OpenFDA API
            Quagga.stop();  // Stop the scanner once a barcode is detected
        });
    }

    // Fetch medicine info from OpenFDA API by name or barcode
    async function fetchMedicineInfo(query) {
        try {
            let apiUrl = '';
            if (isNaN(query)) {
                // If it's not a number, it's a name
                apiUrl = `https://api.fda.gov/drug/ndc.json?search=brand_name:"${query}"&limit=1`;
            } else {
                // If it's a number, treat it as a barcode (product_ndc)
                apiUrl = `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${query}"&limit=1`;
            }

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const medicine = data.results[0];
                addMedicineToList(medicine);
            } else {
                medicineInfo.textContent = "No data found for this medicine.";
            }
        } catch (error) {
            console.error("Error fetching data from OpenFDA:", error);
            medicineInfo.textContent = "Error fetching medicine data.";
        }
    }

    // Add the medicine to the list and display its details
    function addMedicineToList(medicine) {
        const name = medicine.openfda.brand_name ? medicine.openfda.brand_name[0] : "Unknown";
        const manufacturer = medicine.openfda.manufacturer_name ? medicine.openfda.manufacturer_name[0] : "Unknown Manufacturer";
        const dosageForm = medicine.dosage_form ? medicine.dosage_form : "Unknown dosage form";
        const productNdc = medicine.product_ndc ? medicine.product_ndc[0] : "N/A";

        const medicineItem = document.createElement("li");
        medicineItem.innerHTML = `
            <p><strong>Brand Name:</strong> ${name}</p>
            <p><strong>Manufacturer:</strong> ${manufacturer}</p>
            <p><strong>Dosage Form:</strong> ${dosageForm}</p>
            <p><strong>Product NDC:</strong> ${productNdc}</p>
            <button onclick="deleteMedicine('${productNdc}')">Delete</button>
        `;

        medicines.push(medicine);
        medicinesList.appendChild(medicineItem);
        medicineInfo.innerHTML = `
            <p><strong>Brand Name:</strong> ${name}</p>
            <p><strong>Manufacturer:</strong> ${manufacturer}</p>
            <p><strong>Dosage Form:</strong> ${dosageForm}</p>
            <p><strong>Product NDC:</strong> ${productNdc}</p>
        `;
    }

    // Function to delete a medicine from the list
    window.deleteMedicine = function(ndc) {
        medicines = medications.filter(med => med.product_ndc[0] !== ndc);
        renderMedicineList();
    };
});
