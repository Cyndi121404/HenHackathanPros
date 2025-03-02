document.addEventListener("DOMContentLoaded", () => {
    const scanButton = document.getElementById("start-scan");
    const video = document.getElementById("camera-preview");
    const videoMinimizeButton = document.getElementById("video-minimize-button");
    const drugInput = document.getElementById("drug-input");
    const searchButton = document.getElementById("search-drug");
    const drugNameElem = document.querySelector("#drug-name span");
    const drugFactsElem = document.querySelector("#drug-facts span");
    const historyList = document.getElementById("history-list");
    const reminderButton = document.getElementById("set-reminder");
    const reminderList = document.getElementById("reminder-list");
    const themeButton = document.getElementById("toggle-theme");
    const chatContainer = document.querySelector(".chat-provider");
    const chatProviderButton = document.getElementById("chat-provider-button");
    const chatbox = document.getElementById("chatbox");
    const chatMinimizeButton = document.getElementById("chat-minimize-button");
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

    chatbox.classList.add("hidden");
    chatMessages.style.overflowY = "auto";
    chatMessages.style.maxHeight = "300px";

    // Hide the video preview initially
    video.style.display = "none";

    // Start scan to access the camera
    scanButton.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();
            video.style.display = "block"; // Show video preview
        } catch (error) {
            console.error("Error accessing the camera:", error);
        }
    });

    // Minimize video preview when 'X' button is clicked
    videoMinimizeButton.addEventListener("click", () => {
        video.style.display = "none"; // Hide video preview
    });

    // Set reminder functionality
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
                        // Add reminder to the list
                        let reminderItem = document.createElement("li");
                        reminderItem.textContent = `Reminder set for: ${time}`;
                        reminderList.appendChild(reminderItem);

                        setTimeout(() => {
                            new Notification("Medication Reminder", {
                                body: `Time to take your medication!`
                            });

                            console.log(`Notification triggered at ${time}`);
                        }, delay);
                    } else {
                        alert("The time you entered has already passed today.");
                    }
                }
            });
        }
    });

    // Toggle theme functionality
    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("grayscale");
        if (document.body.classList.contains("grayscale")) {
            localStorage.setItem("theme", "grayscale");
        } else {
            localStorage.removeItem("theme");
        }
    });

    // Chat provider button functionality
    chatProviderButton.addEventListener("click", () => {
        chatContainer.style.display = "none";  // Hide chat button container
        chatbox.style.display = "block"; // Show chatbox
    });

    // Minimize chatbox when 'X' button is clicked
    chatMinimizeButton.addEventListener("click", () => {
        chatbox.style.display = "none"; // Hide chatbox
        chatContainer.style.display = "block"; // Show chat button container
    });

    // Send chat message functionality
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

    // Fetch drug information from API
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

    // Update history list
    function updateHistory() {
        historyList.innerHTML = "";
        searchHistory.forEach(drug => {
            let li = document.createElement("li");
            li.textContent = drug;
            li.addEventListener("click", () => fetchDrugInfo(drug));
            historyList.appendChild(li);
        });
    }

    // Update chat history display
    function updateChatHistory() {
        chatMessages.innerHTML = "";
        chatHistory.forEach(msg => {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message");
            messageDiv.textContent = msg;
            chatMessages.appendChild(messageDiv);
        });
        // Scroll to the bottom of the entire chat container (including the input)
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    updateHistory();
    updateChatHistory();
});
