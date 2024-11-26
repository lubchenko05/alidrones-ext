chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "syncOrders") {
    handleSyncOrders(message.sheetCode, sendResponse);
    return true;
  }
});

async function handleSyncOrders(sheetCode, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await clickViewOrders(tab.id);
    const orders = await extractOrdersFromPage(tab.id);

    if (!orders || orders.length === 0) {
      sendResponse({ success: false, message: "No orders found on the page." });
      return;
    }

    for (const order of orders) {
      if (order.trackingLink) {
        const trackingNumbers = await getTrackingNumbers(tab.id, order.trackingLink);
        order.trackingNumbers = Array.isArray(trackingNumbers) && trackingNumbers.length > 0
          ? trackingNumbers.join(", ")
          : "N/A";
      } else {
        order.trackingNumbers = "N/A";
      }
    }

    await sendOrdersToSheet(sheetCode, orders);

    sendResponse({ success: true, message: "Orders synced successfully!" });
  } catch (error) {
    console.error("Error syncing orders:", error);
    sendResponse({ success: false, message: error.message });
  }
}

function clickViewOrders(tabId) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => {
            const buttons = document.querySelectorAll(".comet-btn-large span");
            for (const button of buttons) {
              if (button.textContent.includes("View orders")) {
                button.click();
                return true;
              }
            }
            return false;
          },
        },
        (results) => {
          if (chrome.runtime.lastError) {
            console.error("Error in View Orders script:", chrome.runtime.lastError.message);
            clearInterval(interval);
            resolve();
            return;
          }

          const stillExists = results[0]?.result;
          if (!stillExists) {
            clearInterval(interval);
            resolve();
          }
        }
      );
    }, 1000);
  });
}

function extractOrdersFromPage(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: () => {
          const orders = [];

          document.querySelectorAll(".order-item").forEach((order) => {
            const status = order.querySelector(".order-item-header-status-text")?.textContent.trim();
            const date = order.querySelector(".order-item-header-right-info div:first-child")
              ?.textContent.replace("Order date: ", "").trim();
            let id = order.querySelector(".order-item-header-right-info div:nth-child(2)")
              ?.textContent.replace("Order ID: ", "").trim();

            if (id) {
              id = id.replace("Copy", "").trim();
            }

            const total = order.querySelector(".order-item-content-opt-price-total .es--wrap--2p8eS4Q")
              ?.textContent.replace("US $", "").trim();
            const name = order.querySelector(".order-item-content-info-name span")?.title;

            const pricePerUnitElement = order.querySelector(".order-item-content-info-number .es--wrap--2p8eS4Q");
            const pricePerUnit = pricePerUnitElement
              ? parseFloat(pricePerUnitElement.textContent.replace("US $", "").trim())
              : null;

            const quantityElement = order.querySelector(".order-item-content-info-number-quantity");
            const quantityMatch = quantityElement ? quantityElement.textContent.match(/x(\d+)/) : null;
            const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

            const trackingLinkElement = Array.from(order.querySelectorAll("a.order-item-btn, button.order-item-btn")).find(
              (btn) => btn.textContent.trim() === "Track order"
            );
            const trackingLink = trackingLinkElement && trackingLinkElement.tagName === "A" ? trackingLinkElement.href : null;

            if (status && date && id && total && name && pricePerUnit !== null) {
              orders.push({
                status,
                date,
                id,
                total: parseFloat(total),
                name,
                pricePerUnit,
                quantity,
                trackingLink,
              });
            }
          });

          const cookies = document.cookie;
          const emailMatch = cookies.match(/rmb_pp=([^&;]+)/);
          const email = emailMatch ? decodeURIComponent(emailMatch[1]) : "N/A";

          orders.forEach(order => (order.email = email));

          return orders;
        },
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve(results[0]?.result);
      }
    );
  });
}

function waitForTrackingPageLayout(tabId) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.warn("Timeout: tracking-page-layout-v2 not found within 5 seconds");
      resolve();
    }, 5000);

    const interval = setInterval(() => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func: () => !!document.querySelector('.tracking-page-layout-v2'),
        },
        (results) => {
          if (chrome.runtime.lastError) {
            clearInterval(interval);
            clearTimeout(timeout);
            reject(chrome.runtime.lastError.message);
            return;
          }

          const isLoaded = results[0]?.result;
          if (isLoaded) {
            clearInterval(interval);
            clearTimeout(timeout);
            resolve();
          }
        }
      );
    }, 500);
  });
}

function getTrackingNumbers(tabId, trackingLink) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: trackingLink, active: false }, async (newTab) => {
      try {
        await waitForTrackingPageLayout(newTab.id);

        chrome.scripting.executeScript(
          {
            target: { tabId: newTab.id },
            func: async () => {
              const trackingNumbers = [];
              const tabs = document.querySelectorAll("[class^='tab-list-v2--tab']");

              const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

              if (tabs.length > 0) {
                for (const tab of tabs) {
                  tab.click();
                  await sleep(1000);
                  const elements = document.querySelectorAll("[class^='logistic-info-v2--mailNoValue']");
                  elements.forEach((el) => {
                    const trackingNumber = el.textContent.trim();
                    if (trackingNumber) trackingNumbers.push(trackingNumber);
                  });
                }
              } else {
                const elements = document.querySelectorAll("[class^='logistic-info-v2--mailNoValue']");
                elements.forEach((el) => {
                  const trackingNumber = el.textContent.trim();
                  if (trackingNumber) trackingNumbers.push(trackingNumber);
                });
              }

              return trackingNumbers;
            },
          },
          (results) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError.message);
              return;
            }

            const trackingNumbers = results[0]?.result || [];
            chrome.tabs.remove(newTab.id, () => {
              resolve(trackingNumbers);
            });
          }
        );
      } catch (error) {
        chrome.tabs.remove(newTab.id, () => {
          reject(error);
        });
      }
    });
  });
}

async function sendOrdersToSheet(sheetCode, orders) {
  const TIMEOUT = 300000;

  const fetchWithTimeout = async (url, options, timeout) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), timeout)),
    ]);
  };

  try {
    const response = await fetchWithTimeout(
      `https://script.google.com/macros/s/${sheetCode}/exec`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify(orders),
      },
      TIMEOUT
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send data: ${response.statusText || errorText}`);
    }
  } catch (error) {
    console.log("Error in sendOrdersToSheet:", error);
    throw error;
  }
}
