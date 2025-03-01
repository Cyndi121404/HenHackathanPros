document.addEventListener("DOMContentLoaded", function () {
  let barcodeInput = document.getElementById("barcode-input");
  let searchButton = document.getElementById("search-button");
  let scanButton = document.getElementById("scan-button");
  let medicineInfo = document.getElementById("medicine-info");
  let scheduleList = document.getElementById("schedule-list");
  let chatMessages = document.getElementById("chat-messages");
  let messageInput = document.getElementById("message-input");
  let sendButton = document.getElementById("send-button");
  
  let medicineDatabase = {
      "123456": { name: "Aspirin", times: ["08:00 AM", "08:00 PM"] },
      "654321": { name: "Ibuprofen", times: ["09:00 AM", "09:00 PM"] }
  };

  searchButton.addEventListener("click", function () {
      let barcode = barcodeInput.value;
      fetchMedicineInfo(barcode);
  });

  function fetchMedicineInfo(barcode) {
      let medicine = medicineDatabase[barcode];
      if (medicine) {
          medicineInfo.innerHTML = `<h2>${medicine.name}</h2><p>Recommended Times: ${medicine.times.join(", ")}</p>`;
          generateSchedule(medicine);
      } else {
          medicineInfo.innerHTML = "<p>Medicine not found.</p>";
      }
  }

  function generateSchedule(medicine) {
      scheduleList.innerHTML = "";
      let reminders = medicine.times.flatMap(time => {
          return [15, 10, 5, 0].map(min => {
              return { message: `Take ${medicine.name} in ${min} minutes`, time: time };
          });
      });
      reminders.forEach(reminder => {
          let listItem = document.createElement("li");
          listItem.textContent = `${reminder.message} at ${reminder.time}`;
          scheduleList.appendChild(listItem);
      });
  }

  sendButton.addEventListener("click", function () {
      let messageText = messageInput.value.trim();
      if (messageText) {
          let messageDiv = document.createElement("div");
          messageDiv.innerHTML = `<strong>User:</strong> ${messageText}`;
          chatMessages.appendChild(messageDiv);
          messageInput.value = "";
      }
  });
});
