document.addEventListener("DOMContentLoaded", () => {
    const scanBtn = document.getElementById("scan-btn");
    const scannerPreview = document.getElementById("scanner-preview");
    const scannedBarcode = document.getElementById("scanned-barcode");
    const video = document.getElementById("scanner-stream");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const toggleAccessibilityBtn = document.getElementById("toggle-accessibility");

    // List to store medications
    let medications = [];

    // Toggle accessibility mode (high contrast greyscale)
    toggleAccessibilityBtn.addEventListener("click", () => {
        const isHighContrast = document.body.classList.toggle("high-contrast");
        toggleAccessibilityBtn.textContent = isHighContrast 
            ? "Accessibility Mode: Toggle On" 
            : "Accessibility Mode: Toggle Off";
    });

    // Button to start barcode scanning
    scanBtn.addEventListener("click", startScanner);

    // Function to start scanning using jsQR
    function startScanner() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
                scannerPreview.hidden = false;
                console.log("Camera access granted");

                // Start scanning
                requestAnimationFrame(scanFrame);
            }).catch((error) => {
                console.error("Camera access denied or not available:", error);
                alert("Camera access is required for barcode scanning. Please check your permissions.");
            });
    }

    // Function to scan the video stream using jsQR
    function scanFrame() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                const barcode = code.data;
                console.log("Barcode detected: ", barcode);
                scannedBarcode.textContent = `Scanned Barcode: ${barcode}`;
                fetchMedicineInfo(barcode); // Fetch information from OpenFDA API
                video.pause();  // Pause the video feed once a barcode is detected
            } else {
                // Continue scanning
                requestAnimationFrame(scanFrame);
            }
        }
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
                scannedBarcode.textContent = "No data found for this medicine.";
            }
        } catch (error) {
            console.error("Error fetching data from OpenFDA:", error);
            scannedBarcode.textContent = "Error fetching medicine data.";
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
        `;

        medications.push(medicine);
    }
});
document.addEventListener("DOMContentLoaded", function () {
    let chatMessages = document.getElementById("chat-messages");
    let messageInput = document.getElementById("message-input");
    let sendButton = document.getElementById("send-button");

    // Function to send message to Smalltalk server
    function sendMessageToSmalltalk(message) {
        fetch("http://localhost:8080", {
            method: "POST",
            body: message
        }).then(() => fetchMessages());
    }

    // Function to fetch messages from Smalltalk server
    function fetchMessages() {
        fetch("http://localhost:8080")
            .then(response => response.text())
            .then(data => {
                chatMessages.innerHTML = "";
                let messages = data.split("\n");
                messages.forEach(msg => {
                    let messageDiv = document.createElement("div");
                    messageDiv.textContent = msg;
                    chatMessages.appendChild(messageDiv);
                });
            });
    }

    // Event listener for sending messages
    sendButton.addEventListener("click", function () {
        let messageText = messageInput.value.trim();
        if (messageText) {
            sendMessageToSmalltalk(messageText);
            messageInput.value = "";
        }
    });

    // Auto-fetch messages every 3 seconds to update chatbox
    setInterval(fetchMessages, 3000);
});
