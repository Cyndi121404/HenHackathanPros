document.addEventListener("DOMContentLoaded", () => {
    const scanBtn = document.getElementById("scan-btn");
    const scannerPreview = document.getElementById("scanner-preview");
    const scannedBarcode = document.getElementById("scanned-barcode");
    const video = document.getElementById("scanner-stream");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const toggleAccessibilityBtn = document.getElementById("toggle-accessibility");
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    let medications = [];

    // Toggle accessibility mode
    toggleAccessibilityBtn.addEventListener("click", () => {
        const isHighContrast = document.body.classList.toggle("high-contrast");
        toggleAccessibilityBtn.textContent = isHighContrast 
            ? "Accessibility Mode: Toggle On" 
            : "Accessibility Mode: Toggle Off";
    });

    // Start scanning barcode
    scanBtn.addEventListener("click", startScanner);

    function startScanner() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
                video.srcObject = stream;
                video.play();
                scannerPreview.hidden = false;
                requestAnimationFrame(scanFrame);
            }).catch((error) => {
                alert("Camera access is required for barcode scanning.");
            });
    }

    function scanFrame() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code) {
                const barcode = code.data;
                scannedBarcode.textContent = `Scanned Barcode: ${barcode}`;
                fetchMedicineInfo(barcode);
                video.pause();
            } else {
                requestAnimationFrame(scanFrame);
            }
        }
    }

    async function fetchMedicineInfo(query) {
        try {
            let apiUrl = isNaN(query) 
                ? `https://api.fda.gov/drug/ndc.json?search=brand_name:"${query}"&limit=1`
                : `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${query}"&limit=1`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.results?.length > 0) {
                addMedicineToList(data.results[0]);
            } else {
                scannedBarcode.textContent = "No data found.";
            }
        } catch (error) {
            scannedBarcode.textContent = "Error fetching medicine data.";
        }
    }

    function addMedicineToList(medicine) {
        const name = medicine.openfda?.brand_name?.[0] || "Unknown";
        const manufacturer = medicine.openfda?.manufacturer_name?.[0] || "Unknown Manufacturer";
        const dosageForm = medicine.dosage_form || "Unknown dosage form";
        const productNdc = medicine.product_ndc || "N/A";

        medications.push(medicine);

        document.getElementById("medicine-list").innerHTML += `
            <li>
                <p><strong>Brand Name:</strong> ${name}</p>
                <p><strong>Manufacturer:</strong> ${manufacturer}</p>
                <p><strong>Dosage Form:</strong> ${dosageForm}</p>
                <p><strong>Product NDC:</strong> ${productNdc}</p>
            </li>
        `;
    }

    // Chatbox functionality (Fixed duplicate code)
    function sendMessageToSmalltalk(message) {
        fetch("http://localhost:8080", {
            method: "POST",
            body: message
        }).then(() => fetchMessages());
    }

    function fetchMessages() {
        fetch("http://localhost:8080")
            .then(response => response.text())
            .then(data => {
                chatMessages.innerHTML = "";
                data.split("\n").forEach(msg => {
                    let messageDiv = document.createElement("div");
                    messageDiv.textContent = msg;
                    chatMessages.appendChild(messageDiv);
                });
            });
    }

    sendButton.addEventListener("click", () => {
        let messageText = messageInput.value.trim();
        if (messageText) {
            sendMessageToSmalltalk(messageText);
            messageInput.value = "";
        }
    });

    setInterval(fetchMessages, 3000);
});
