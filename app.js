document.addEventListener("DOMContentLoaded", () => {
    const scanButton = document.getElementById("start-scan");
    const video = document.getElementById("camera-preview");
    const drugInput = document.getElementById("drug-input");
    const searchButton = document.getElementById("search-drug");
    const drugNameElem = document.querySelector("#drug-name span");
    const drugFactsElem = document.querySelector("#drug-facts span");
    const historyList = document.getElementById("history-list");
    const reminderButton = document.getElementById("set-reminder");
    const themeButton = document.getElementById("toggle-theme");
    const chatbox = document.getElementById("chatbox");
    const chatToggle = document.getElementById("chat-toggle");
    const chatContent = document.getElementById("chat-content");

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];

    function updateHistory() {
        historyList.innerHTML = "";
        searchHistory.forEach(drug => {
            let li = document.createElement("li");
            li.textContent = drug;
            li.addEventListener("click", () => fetchDrugInfo(drug));
            historyList.appendChild(li);
        });
    }

    function fetchDrugInfo(query) {
        fetch(`https://api.fda.gov/drug/label.json?search=openfda.product_ndc:${query}+OR+openfda.brand_name:${query}`)
            .then(response => response.json())
            .then(data => {
                if (!data.results || data.results.length === 0) {
                    throw new Error("No results found");
                }

                let drug = data.results[0];
                let name = drug.openfda.brand_name ? drug.openfda.brand_name[0] : "Unknown";
                let facts = drug.indications_and_usage ? drug.indications_and_usage[0] : "No details found";

                drugNameElem.textContent = name;
                drugFactsElem.textContent = facts;

                if (!searchHistory.includes(query)) {
                    searchHistory.push(query);
                    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
                    updateHistory();
                }
            })
            .catch(error => {
                console.error("Error fetching drug info:", error);
                drugNameElem.textContent = "Not Found";
                drugFactsElem.textContent = "No data available";
            });
    }

    searchButton.addEventListener("click", () => {
        let query = drugInput.value.trim();
        if (query) fetchDrugInfo(query);
    });

    async function activateCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();
        } catch (error) {
            console.error("Error accessing the camera:", error);
        }
    }

    scanButton.addEventListener("click", async () => {
        await activateCamera();
        video.style.display = "block";
        Quagga.init({
            inputStream: { name: "Live", type: "LiveStream", target: video },
            inputStream: { name: "Live", type: "LiveStream", target: video },
            decoder: { readers: ["ean_reader"] }
        }, err => {
            if (!err) Quagga.start();
        });

        Quagga.onDetected(data => {
            Quagga.stop();
            video.style.display = "none";
            let barcode = data.codeResult.code;
            fetchDrugInfo(barcode);
        });
    });

    reminderButton.addEventListener("click", () => {
        let time = prompt("Enter reminder time (HH:MM 24h format):");
        if (time) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    let now = new Date();
                    let [hour, minute] = time.split(":").map(Number);
                    let reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

                    let delay = reminderTime - now;
                    if (delay > 0) {
                        setTimeout(() => {
                            new Notification("Medication Reminder", {
                                body: `Time to take ${drugNameElem.textContent}`
                            });
                        }, delay);
                    }
                }
            });
        }
    });

    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("grayscale");
    });

    updateHistory();

    // --- Chatbox Functionality ---
    let chatMessages = document.getElementById("chat-messages");
    let messageInput = document.getElementById("message-input");
    let sendButton = document.getElementById("send-button");

    function sendMessage() {
        let messageText = messageInput.value.trim();
        if (messageText === "") return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        messageDiv.textContent = messageText;
        chatMessages.appendChild(messageDiv);

        messageInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", event => {
        if (event.key === "Enter") sendMessage();
    });

    // --- Chatbox Minimize/Expand ---
    chatToggle.addEventListener("click", () => {
        chatbox.classList.toggle("minimized");
        chatContent.style.display = chatbox.classList.contains("minimized") ? "none" : "block";
        chatToggle.textContent = chatbox.classList.contains("minimized") ? "▲ Chat" : "▼ Chat";
    });
});
