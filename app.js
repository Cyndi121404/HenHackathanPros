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
    const chatContainer = document.querySelector(".chat-provider");
    const chatProviderButton = document.getElementById("chat-provider-button");
    const chatbox = document.getElementById("chatbox");
    const chatMinimizeButton = document.getElementById("chat-minimize-button");
    const chatMessages = document.getElementById("chat-messages");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const gridBoxes = document.querySelectorAll('.grid-box'); // Select all grid boxes

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

    // Initially, hide the chatbox and show the chat button
    chatbox.classList.add("hidden");
    chatMessages.style.overflowY = "auto";
    chatMessages.style.maxHeight = "300px";

    // Function to randomize border styles using the specified colors
    const borderColors = ["#211C84", "#7A73D1", "#B5A8D5"];
    function randomizeBorder() {
        gridBoxes.forEach(box => {
            const randomWidth = Math.floor(Math.random() * 5) + 1; // Border width between 1px and 5px
            const randomStyle = ["solid", "dotted", "dashed"][Math.floor(Math.random() * 3)];
            const randomColor = borderColors[Math.floor(Math.random() * borderColors.length)]; // Pick one of the specified colors
            box.style.border = `${randomWidth}px ${randomStyle} ${randomColor}`;
        });
    }

    // Randomize borders when the page loads
    randomizeBorder();

    // Update the history list
    function updateHistory() {
        historyList.innerHTML = "";
        searchHistory.forEach(drug => {
            let li = document.createElement("li");
            li.textContent = drug;
            li.addEventListener("click", () => fetchDrugInfo(drug));
            historyList.appendChild(li);
        });
    }

    // Update the chat history display
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
    chatProviderButton.addEventListener("click", () => {
        // Hide the chat provider button and show the chatbox
        chatProviderButton.style.display = "none"; // Hide the chat button
        chatbox.style.display = "block"; // Show the chatbox
    });
    
    chatMinimizeButton.addEventListener("click", () => {
        // Hide the chatbox and show the button again
        chatbox.style.display = "none"; // Hide the chatbox
        chatProviderButton.style.display = "block"; // Show the chat provider button
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

    scanButton.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();
        } catch (error) {
            console.error("Error accessing the camera:", error);
        }
    });

    searchButton.addEventListener("click", () => {
        let query = drugInput.value.trim();
        if (query) fetchDrugInfo(query);
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
        if (document.body.classList.contains("grayscale")) {
            localStorage.setItem("theme", "grayscale");
        } else {
            localStorage.removeItem("theme");
        }
    });

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

    updateHistory();
    updateChatHistory();
});
