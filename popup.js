document.addEventListener("DOMContentLoaded", function () {
  var inqbutton = document.getElementById("inqbutton");
  var checkTimeButton = document.getElementById("checkTimeButton");
  var timeDisplay = document.getElementById("timeDisplay"); // 获取显示时间的元素
  var triggerButton = document.getElementById("triggerButton");
  var fillTimeButton = document.getElementById("fillTimeButton");

  function sendMessageToTab(tabId, action, onResponse) {
    chrome.tabs.sendMessage(tabId, { action: action }, onResponse);
  }

  function handleButtonClick(buttonId, action) {
    var button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener("click", function () {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          function (tabs) {
            sendMessageToTab(tabs[0].id, action, function (response) {
              if (chrome.runtime.lastError) {
                // 处理消息发送中可能出现的错误
                timeDisplay.textContent =
                  "发生错误：" + chrome.runtime.lastError.message;
                return;
              }

              if (response && response.data) {
                timeDisplay.innerHTML = response.data; // 显示时间数据
                let punchTimes = response.data; // 获取到的打卡时间

                // 保存打卡时间到存储中
                chrome.storage.local.set(
                  { punchTimes: punchTimes },
                  function () {
                    console.log("打卡时间已保存");
                  }
                );
              } else {
                timeDisplay.textContent = "没找到打卡时间。"; // 没有找到时间时的显示
              }
            });
          }
        );
      });
    }
  }

  handleButtonClick("checkTimeButton", "getPunchTimes");
  handleButtonClick("inqbutton", "handleinqbuttonClick");

  if (triggerButton) {
    triggerButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerWebpageButton" });
      });
    });
  }

  if (fillTimeButton) {
    fillTimeButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "fillTimeCells" });
      });
    });
  }
});
