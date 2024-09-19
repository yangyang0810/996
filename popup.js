document.addEventListener("DOMContentLoaded", function () {
  var inqbutton = document.getElementById("inqbutton");
  var checkTimeButton = document.getElementById("checkTimeButton");
  var timeDisplay = document.getElementById("timeDisplay");
  var triggerButton = document.getElementById("triggerButton");
  var fillTimeButton = document.getElementById("fillTimeButton");

  function handleResponse(response) {
    if (chrome.runtime.lastError) {
      timeDisplay.textContent = "发生错误：" + chrome.runtime.lastError.message;
      return;
    }

    if (response && response.data) {
      timeDisplay.innerHTML = response.data;
      chrome.storage.local.get("punchTimesData", function (data) {
        if (data.punchTimesData) {
          updateTotalHours(data.punchTimesData);
          addCheckboxListeners();
        }
      });
    } else {
      timeDisplay.textContent = "没找到打卡时间。";
    }
  }

  if (checkTimeButton) {
    checkTimeButton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "getPunchTimes" },
          handleResponse
        );
      });
    });
  }

  if (inqbutton) {
    inqbutton.addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "handleinqbuttonClick" },
          handleResponse
        );
      });
    });
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

  function handleCheckboxChange(event) {
    const index = parseInt(event.target.dataset.index);
    const checkbox = event.target;

    if (checkbox.disabled) {
      return;
    }

    chrome.storage.local.get("punchTimesData", function (data) {
      if (data.punchTimesData) {
        data.punchTimesData[index].isChecked = checkbox.checked;
        chrome.storage.local.set(
          { punchTimesData: data.punchTimesData },
          function () {
            console.log("更新的打卡时间数据已保存");
            updateTotalHours(data.punchTimesData);
          }
        );
      }
    });
  }
  function updateTotalHours(punchTimesData) {
    let totalEffective = 0;
    let totalOvertime = 0;
    punchTimesData.forEach((time, index) => {
      if (time.isChecked) {
        totalEffective += time.effectiveHours;
        totalOvertime += time.overtimeHours;
      }
    });
    document.getElementById("effective-hours").textContent =
      totalEffective.toFixed(1);
    document.getElementById("overtime-hours").textContent =
      totalOvertime.toFixed(1);
  }
  function addCheckboxListeners() {
    const checkboxes = document.querySelectorAll(".overtime-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.removeEventListener("change", handleCheckboxChange);
      checkbox.addEventListener("change", handleCheckboxChange);
    });
  }

  // 初始化总时长显示
  chrome.storage.local.get("punchTimesData", function (data) {
    if (data.punchTimesData) {
      updateTotalHours(data.punchTimesData);
      addCheckboxListeners();
    }
  });
});
