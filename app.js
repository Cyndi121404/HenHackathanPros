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

    const reminderList = document.getElementById("reminder-list"); // List to display reminders

    let searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
    let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];

    // Initially, hide the chatbox and show the chat button
    chatbox.classList.add("hidden");
    chatMessages.style.overflowY = "auto";
    chatMessages.style.maxHeight = "300px";

    // Apply hover effect for shadow (bottom and right sides only)
    const lightBlueColor = "#7A73D1"; // Light blue shade for the shadow
    gridBoxes.forEach(box => {
        box.addEventListener("mouseover", () => {
            // Apply shadow on bottom and right only
            box.style.boxShadow = `5px 5px 15px ${lightBlueColor}`; // 5px to the right and bottom
        });

        box.addEventListener("mouseout", () => {
            box.style.boxShadow = "none"; // Remove shadow when not hovering
        });
    });

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
        // Scroll to the bottom of the entire chat container (including the input)
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    chatProviderButton.addEventListener("click", () => {
        // Hide the entire grid box containing the chat provider button and show the chatbox
        chatContainer.style.display = "none";  // Hides the entire grid-box with the button
        chatbox.style.display = "block"; // Shows the chatbox
    });

    chatMinimizeButton.addEventListener("click", () => {
        // Hide the chatbox and show the grid-box with the chat provider button again
        chatbox.style.display = "none"; // Hide the chatbox
        chatContainer.style.display = "block"; // Show the grid-box with the chat button
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
    scanButton.addEventListener("click", async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = stream;
            video.play();
    
            // Start Quagga (barcode scanning) when the camera is active
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: video, // The video element where the scan is happening
                },
                decoder: {
                    readers: ["ean_reader", "upc_reader", "code_128_reader"], // Add other readers as needed
                },
            }, function(err) {
                if (err) {
                    console.error(err);
                    return;
                }
                Quagga.start();
            });
    
            // Handle scanned barcode
            Quagga.onDetected(function(result) {
                const barcode = result.codeResult.code; // Get the scanned barcode
                const barcodeOverlay = document.getElementById("barcode-overlay");
                
                // Update the overlay text and show it
                barcodeOverlay.textContent = `Scanned: ${barcode}`;
                barcodeOverlay.style.display = "flex"; // Show the overlay
            });
    
        } catch (error) {
            console.error("Error accessing the camera:", error);
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
                let dosing = drug.dosage_and_administration ? drug.dosage_and_administration[0] : "No dosing recommendations found";
                let sideEffects = drug.warnings_and_precautions ? drug.warnings_and_precautions[0] : "No side effects listed";
    
                drugNameElem.textContent = name;
                drugFactsElem.textContent = facts;
                document.getElementById("drug-dosing").textContent = `Dosing Recommendation: ${dosing}`;
                document.getElementById("drug-side-effects").textContent = `Side Effects: ${sideEffects}`;
    
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
                document.getElementById("drug-dosing").textContent = "No data available";
                document.getElementById("drug-side-effects").textContent = "No data available";
            });
    }
    
    particlesJS("particles-js", {
        particles: {
            number: {
                value: 1000,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: ["#B5A8D5", "#211C84", "#7A73D1"]
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: 0.7,
                random: true
            },
            size: {
                value: 5,
                random: true
            },
            move: {
                enable: true,
                speed: 5,
                direction: "none",
                random: true,
                straight: false,
                out_mode: "out",
                bounce: true
            },
            line_linked: {
                enable: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: {
                    enable: true,
                    mode: "repulse"
                },
                onclick: {
                    enable: true,
                    mode: "push"
                },
                resize: true
            }
        },
        retina_detect: true
    });
    

    const clearHistoryButton = document.createElement("button");
clearHistoryButton.id = "clear-history";
clearHistoryButton.textContent = "Clear History";
document.querySelector(".sidebar").appendChild(clearHistoryButton);

clearHistoryButton.addEventListener("click", () => {
    localStorage.removeItem("searchHistory");
    searchHistory = [];
    updateHistory();
});

updateHistory();
    updateChatHistory();
});
