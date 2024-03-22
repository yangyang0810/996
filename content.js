chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getPunchTimes") {
    // 异步操作
    setTimeout(function () {
      // 使用 setTimeout 模拟异步操作
      var punchTimes = extractAndProcessPunchTimes();
      sendResponse({ data: punchTimes });
    }, 0);

    return true; // 表明响应将异步发送
  }
  return false; // 如果不处理该消息，则不需要返回 true
});
function extractAndProcessPunchTimes() {
  // 省略了时间提取逻辑的细节，这部分取决于您的页面结构
  let timeElements = document.querySelectorAll("span.unit");
  let dailyTimes = {};

  timeElements.forEach((element) => {
    let dateTime = element.textContent.trim();
    let [date, time] = dateTime.split(" ");

    let earliestTime = calculateEarliestTime(time);

    if (!dailyTimes[date]) {
      dailyTimes[date] = { earliest: earliestTime, latest: time };
    } else {
      if (time < dailyTimes[date].earliest) {
        dailyTimes[date].earliest = earliestTime;
      }
      if (time > dailyTimes[date].latest) {
        dailyTimes[date].latest = time;
      }
    }
  });

  return formatPunchTimes(dailyTimes);
}

function calculateEarliestTime(time) {
  let [hours, minutes] = time.split(":").map(Number);
  let earliestTime = "18:00"; // 默认值

  // 如果时间早于8:30，按8:30计算
  if (hours < 8 || (hours === 8 && minutes < 30)) {
    earliestTime = "18:00";
  } else if ((hours === 8 && minutes >= 30) || (hours === 9 && minutes === 0)) {
    // 计算超过8:30的分钟数
    let extraMinutes = (hours - 8) * 60 + (minutes - 30);
    earliestTime = `18:${extraMinutes.toString().padStart(2, "0")}`;
  }

  return earliestTime;
}

function formatPunchTimes(times) {
  return Object.keys(times)
    .map((date) => {
      let formattedDate = date.replace(/\//g, "-");
      let earliestTime = times[date].earliest;
      let latestTime = times[date].latest;
      let timeColor = latestTime < "18:00" ? "style='color: red;'" : "";
      return `<span ${timeColor}>最早：${formattedDate} ${earliestTime}    最晚：${formattedDate} ${latestTime}</span>`;
    })
    .join("\n");
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "triggerWebpageButton") {
    triggerWebpageButton();
  }
});

function triggerWebpageButton() {
  chrome.storage.local.get("punchTimes", function (data) {
    if (data.punchTimes) {
      let punchTimesArray = data.punchTimes.split("\n");
      let triggerCount = 0;

      for (let i = 0; i < punchTimesArray.length; i++) {
        let timeEntries = punchTimesArray[i].split(/\s+/); // 使用空格分割字符串
        if (timeEntries.length > 3) {
          let endTime = timeEntries[3];
          if (endTime.localeCompare("19:00") > 0) {
            // 检查是否晚于19:00
            triggerCount++;
          }
        }
      }

      for (let i = 0; i < --triggerCount; i++) {
        let button = document.querySelector(
          ".weapp-form-detail-table__action-btn"
        );
        if (button) {
          button.click();
        }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        let button = document.querySelector(
          ".weapp-form-detail-table__action-btn"
        );
        if (button) {
          button.click();
        }
      }
    }
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "fillTimeCells") {
    fillTimeCells();
  }
});
function triggerConfirmButton() {
  let confirmButton = document.querySelector(".item.confirm");
  if (confirmButton) {
    confirmButton.click();
  }
}

function findNextInput(startElement) {
  var currentElement = startElement;
  // 遍历DOM节点，寻找下一个input元素
  while ((currentElement = currentElement.nextElementSibling)) {
    if (currentElement.tagName === "INPUT") {
      return currentElement;
    }
    // 如果当前节点有子节点，深入检查子节点
    if (currentElement.firstElementChild) {
      var found = findNextInput(currentElement.firstElementChild);
      if (found) return found;
    }
  }
  return null;
}
function fillTimeCells() {
  try {
    triggerWebpageButton(); // 先触发 triggerWebpageButton 函数

    // 设置一个 2 秒的延时，然后继续执行填充时间的逻辑
    setTimeout(() => {
      chrome.storage.local.get("punchTimes", function (data) {
        if (!data.punchTimes) {
          console.log("No punch times data available.");
          return;
        }

        const punchTimesArray = data.punchTimes.split("\n");
        const cells = document.querySelectorAll(
          ".ui-input.ui-date-time-picker-rangeWrap-input"
        );
        let fillIndex = 0; // 用于跟踪实际填充的序号

        punchTimesArray.forEach((timeEntry) => {
          // Split the string into two parts - earliest and latest
          let [earliest, latest] = timeEntry.split("最晚：");

          // Remove the '最早：' part from the earliest string
          earliest = earliest.replace("最早：", "").trim();

          // Split the earliest and latest parts to get date and time separately
          let [startDate, startTime] = earliest.split(" ");
          let [endDate, fullEndTime] = latest.split(" ");
          let [endHours, endMinutes] = fullEndTime.split(":");

          // 只保留小时和分钟
          let endTime = `${endHours}:${endMinutes}`;

          // 转换小时为数字并比较
          if (parseInt(endHours) < 19) {
            console.log(
              `Skipping entry with end time before 19:00: ${timeEntry}`
            );
            return; // 跳过本次循环
          }

          let times = timeEntry.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g) || [];
          let matches = timeEntry.match(/\d{4}-\d{2}-\d{2}/g);
          if (times.length === 2) {
            processTimeEntry(
              cells,
              fillIndex,
              times,
              matches,
              endTime,
              startTime
            );
          }
          fillIndex++;
        });
      });
    }, 2000); // 等待 2 秒后执行
  } catch (error) {
    console.error("An error occurred while processing punch times:", error);
  }
}

function processTimeEntry(
  cells,
  fillIndex,
  times,
  matches,
  endTime,
  startTime
) {
  const event = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  if (cells[fillIndex * 2]) {
    cells[fillIndex * 2].setAttribute("value", times[0]); // 设置最早时间的value属性
  }
  if (cells[fillIndex * 2 + 1]) {
    cells[fillIndex * 2 + 1].setAttribute("value", times[1]); // 设置最晚时间的value属性
  }
  cells[fillIndex * 2].dispatchEvent(event);

  const dateInputs = document.querySelectorAll(".ui-input.dateInput");
  if (dateInputs[fillIndex * 2]) {
    dateInputs[fillIndex * 2].setAttribute("value", matches[0]);
    dateInputs[fillIndex * 2 + 1].setAttribute("value", matches[1]);
  }

  setTimeout(() => {
    safelyFocusAndDispatch(
      cells,
      dateInputs,
      fillIndex,
      event,
      endTime,
      startTime
    );
  }, 1000 * (fillIndex + 1));
}

function safelyFocusAndDispatch(
  cells,
  dateInputs,
  fillIndex,
  event,
  endTime,
  startTime
) {
  try {
    let timeInput = document.querySelectorAll('input[placeholder="选择时间"]');
    // timeInput[fillIndex * 2].setAttribute("value", startTime);
    // timeInput[fillIndex * 2 + 1].setAttribute("value", endTime);
    // 检查并聚焦第一个时间输入
    if (timeInput[fillIndex * 2 + 1]) {
      cells[fillIndex * 2 + 1].dispatchEvent(event);
      timeInput[fillIndex * 2 + 1].dispatchEvent(event);
    } else {
      console.log("First time input not found");
    }

    // 等待 2 秒后执行第二个时间输入
    setTimeout(() => {
      if (timeInput[fillIndex * 2]) {
        cells[fillIndex * 2].dispatchEvent(event);
        timeInput[fillIndex * 2].dispatchEvent(event);
      } else {
        console.log("Second time input not found");
      }

      // 再等待 2 秒后点击确认按钮
      setTimeout(() => {
        let confirmButton = document.querySelectorAll(".item.confirm");
        if (confirmButton[fillIndex]) {
          confirmButton[fillIndex].click();
        } else {
          console.log("Confirm button not found");
        }
        let timeconfirmButton = document.querySelectorAll(
          "ui-btn.ui-btn-link.ui-btn-middle.ui-btn-inline.confirm isValid"
        );
        if (confirmButton[fillIndex * 2]) {
          timeconfirmButton[fillIndex * 2].click();
        } else {
          console.log("Confirm button not found");
        }
        if (confirmButton[fillIndex * 2 + 1]) {
          timeconfirmButton[fillIndex * 2 + 1].click();
        } else {
          console.log("Confirm button not found");
        }
      }, 500);
    }, 5000);
  } catch (error) {
    console.error("An error occurred in safelyFocusAndDispatch:", error);
  }
}
