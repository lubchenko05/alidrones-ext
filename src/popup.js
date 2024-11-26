document.addEventListener("DOMContentLoaded", () => {
  const sheetCodeInput = document.getElementById("sheetCode");
  const syncOrdersButton = document.getElementById("syncOrders");
  const statusMessage = document.getElementById("statusMessage");
  const buttonText = document.querySelector(".button-text");
  const buttonLoader = document.querySelector(".button-loader");

  chrome.storage.sync.get("sheetCode", (data) => {
    if (data.sheetCode) {
      sheetCodeInput.value = data.sheetCode;
    }
  });

  syncOrdersButton.addEventListener("click", () => {
    const sheetCode = sheetCodeInput.value.trim();

    if (!sheetCode) {
      statusMessage.textContent = "Please enter a valid token.";
      statusMessage.style.color = "#d9534f";
      return;
    }

    buttonText.style.display = "none";
    buttonLoader.style.display = "inline-block";
    statusMessage.textContent = "";

    chrome.storage.sync.set({ sheetCode }, () => {
      chrome.runtime.sendMessage({ action: "syncOrders", sheetCode }, (response) => {
        buttonText.style.display = "inline-block";
        buttonLoader.style.display = "none";

        if (response.success) {
          statusMessage.style.color = "#5cb85c";
          statusMessage.textContent = `${response.message}`;
        } else {
          statusMessage.style.color = "#d9534f";
          statusMessage.textContent = `Error: ${response.message}`;
        }
      });
    });
  });
});
