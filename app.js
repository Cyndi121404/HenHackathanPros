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
    const reminderList = document.getElementById("reminder-list");
    
    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
    let reminders = JSON.parse(localStorage.getItem("reminders")) || [];

    chatbox.classList.add("hidden");
    chatMessages.style.overflowY = "auto";
    chatMessages.style.maxHeight = "300px";

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

    function updateReminderList() {
        reminderList.innerHTML = "";
        reminders.forEach(reminder => {
            let li = document.createElement("li");
            li.textContent = reminder.time;
            reminderList.appendChild(li);
        });
    }

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
        chatContainer.innerHTML = "";
        chatbox.classList.remove("hidden");
        chatContainer.appendChild(chatbox);
    });

    chatMinimizeButton.addEventListener("click", () => {
        chatbox.classList.add("hidden");
        chatContainer.innerHTML = '<button id="chat-provider-button">💬 Chat with Provider</button>';
        document.getElementById("chat-provider-button").addEventListener("click", () => {
            chatContainer.innerHTML = "";
            chatbox.classList.remove("hidden");
            chatContainer.appendChild(chatbox);
        });
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

    themeButton.addEventListener("click", () => {
        document.body.classList.toggle("grayscale");
        if (document.body.classList.contains("grayscale")) {
            localStorage.setItem("theme", "grayscale");
        } else {
            localStorage.removeItem("theme");
        }
    });

    reminderButton.addEventListener("click", () => {
        let time = prompt("Enter reminder time (HH:MM 24h format):");
        if (time) {
            // Validate time format
            let timeParts = time.split(":");
            if (timeParts.length !== 2 || isNaN(timeParts[0]) || isNaN(timeParts[1])) {
                alert("Invalid time format! Please use HH:MM.");
                return;
            }

            let [hour, minute] = timeParts.map(Number);

            // Create reminder and calculate the time difference
            let now = new Date();
            let reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
            
            // If the reminder time is already passed today, set it for tomorrow
            if (reminderTime < now) {
                reminderTime.setDate(now.getDate() + 1);
            }

            let delay = reminderTime - now;
            console.log(`Reminder set for: ${reminderTime} (Delay: ${delay}ms)`); // Debugging the time

            if (delay > 0) {
                reminders.push({ time: time, reminderTime: reminderTime });
                localStorage.setItem("reminders", JSON.stringify(reminders));
                updateReminderList();

                // Request permission for notifications
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        console.log("Notification permission granted");

                        // Set the notification
                        setTimeout(() => {
                            console.log("Notification triggered");
                            new Notification("Medication Reminder", {
                                body: `Time to take your medication at ${time}!`
                            });
                        }, delay);
                    } else {
                        console.log("Notification permission denied.");
                    }
                });
            }
        }
    });

    // Update the reminder list on page load
    updateReminderList();

    // Test a simple notification after 5 seconds to check if the notifications are working
    setTimeout(() => {
        console.log("Testing notification...");
        new Notification("Test Notification", {
            body: "This is a test notification to verify notifications are working."
        });
    }, 5000);

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
