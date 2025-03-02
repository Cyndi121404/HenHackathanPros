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
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const chatToggleButton = document.getElementById("chat-toggle");
    const chatProviderButton = document.getElementById("chat-provider-button");

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

    chatbox.style.display = "none";

    function updateHistory() {
        historyList.innerHTML = "";
        searchHistory.forEach(drug => {
            let li = document.createElement("li");
            li.textContent = drug;
            li.addEventListener("click", () => fetchDrugInfo(drug));
            historyList.appendChild(li);
        });
    }

    function updateChatHistory() {
        chatMessages.innerHTML = "";
        chatHistory.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.textContent = msg;
            chatMessages.appendChild(messageDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
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
            decoder: { readers: ["ean_reader"] }
        }, err => {
            if (!err) Quagga.start();
        });

        Quagga.onDetected(data => {
            Quagga.stop();
            video.style.display = "none";
            
            let tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());

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

    function sendMessage() {
        let messageText = messageInput.value.trim();
        if (messageText === "") return;

        chatHistory.push(messageText);
        localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
        updateChatHistory();
        messageInput.value = "";
    }

    sendButton.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", event => {
        if (event.key === "Enter") sendMessage();
    });

    chatProviderButton.addEventListener("click", () => {
        chatbox.style.display = "block";
    });

    chatToggleButton.addEventListener("click", () => {
        chatbox.classList.toggle("minimized");
    });

    updateHistory();
    updateChatHistory();
    document.addEventListener("DOMContentLoaded", () => {
        const themeButton = document.getElementById("toggle-theme");
    
        // Check for saved theme preference
        if (localStorage.getItem("theme") === "grayscale") {
            document.body.classList.add("grayscale");
        }
    
        // Toggle grayscale mode on button click
        themeButton.addEventListener("click", () => {
            document.body.classList.toggle("grayscale");
    
            // Save the user's preference in localStorage
            if (document.body.classList.contains("grayscale")) {
                localStorage.setItem("theme", "grayscale");
            } else {
                localStorage.removeItem("theme");
            }
        });
    });
    
});
