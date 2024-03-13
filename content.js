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
      let punchTimesArray = data.punchTimes.split("\n"); // 假设打卡时间以换行符分隔
      let triggerCount = punchTimesArray.length - 1;

      for (let i = 0; i < triggerCount; i++) {
        // 触发网页上的按钮
        let button = document.querySelector(
          ".weapp-form-detail-table__action-btn"
        );
        if (button) {
          button.click();
        }
      }
    } else {
      for (let i = 0; i < 3; i++) {
        // 触发网页上的按钮
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
// function fillTimeCells() {
//   chrome.storage.local.get("punchTimes", function (data) {
//     if (data.punchTimes) {
//       let punchTimesArray = data.punchTimes.split("\n");
//       let cells = document.querySelectorAll(
//         ".ui-input.ui-date-time-picker-rangeWrap-input"
//       );

//       punchTimesArray.forEach((timeEntry, index) => {
//         let times = timeEntry.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g) || [];
//         if (times.length === 2) {
//           if (cells[index * 2]) {
//             cells[index * 2].setAttribute("value", times[0]); // 设置最早时间的value属性
//           }
//           if (cells[index * 2 + 1]) {
//             cells[index * 2 + 1].setAttribute("value", times[1]); // 设置最晚时间的value属性
//           }
//         }
//       });
//     }
//   });
//   triggerConfirmButton();
// }

function findNextInput(element) {
  let num = 0;
  while (element != null) {
    num++;
    if (element.tagName === "INPUT" && num == 2) {
      return element;
    }
    if (element.firstElementChild) {
      let found = findNextInput(element.firstElementChild);
      if (found) return found;
    }
    element = element.nextElementSibling;
  }
  return null;
}
function fillTimeCells() {
  chrome.storage.local.get("punchTimes", function (data) {
    if (data.punchTimes) {
      let punchTimesArray = data.punchTimes.split("\n");
      let cells = document.querySelectorAll(
        ".ui-input.ui-date-time-picker-rangeWrap-input"
      );
      punchTimesArray.forEach((timeEntry, index) => {
        let [startDate, startTime, endDate, endTime] = timeEntry.split(" ");
        let times = timeEntry.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/g) || [];
        let matches = timeEntry.match(/\d{4}-\d{2}-\d{2}/g);
        if (times.length === 2) {
          // 创建一个新的点击事件
          var event = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });

          if (cells[index * 2]) {
            cells[index * 2].setAttribute("value", times[0]); // 设置最早时间的value属性
          }
          if (cells[index * 2 + 1]) {
            cells[index * 2 + 1].setAttribute("value", times[1]); // 设置最晚时间的value属性
          }
          // 派发点击事件

          cells[index * 2].dispatchEvent(event);
          let DateInputs = document.querySelectorAll(".ui-input.dateInput");
          if (DateInputs[index * 2]) {
            DateInputs[index * 2].setAttribute("value", matches[0]); // 设置最早时间的value属性
            DateInputs[index * 2 + 1].setAttribute("value", matches[1]);
          }
          var TimeInputs = document.querySelectorAll(
            'input[placeholder="选择时间"]'
          );
          let timeInput = findNextInput(DateInputs[index * 2].parentNode);
          timeInput.setAttribute("value", startTime);
          timeInput = findNextInput(DateInputs[index * 2 + 1].parentNode);
          timeInput.setAttribute("value", endTime);

          cells[index * 2 + 1].dispatchEvent(event);

          let confirmButton = document.querySelectorAll(".item.confirm");
          if (confirmButton[index]) {
            confirmButton[index].click();
          }
        }
      });
    }
  });
  //   chrome.storage.local.get("punchTimes", function (data) {
  //     if (data.punchTimes) {
  //       let punchTimesArray = data.punchTimes.split("\n");
  //       let startDateInputs = document.querySelectorAll(".ui-input.dateInput");
  //       let startTimeInputs = document.querySelectorAll(
  //         ".ui-time-picker-wrap.ui-input[start-time]"
  //       );
  //       let endDateInputs = document.querySelectorAll(
  //         ".ui-input.dateInput[end-date]"
  //       );
  //       let endTimeInputs = document.querySelectorAll(
  //         ".ui-time-picker-wrap .ui-input[end-time]"
  //       );

  //       punchTimesArray.forEach((timeEntry, index) => {
  //         let [startDate, startTime, endDate, endTime] = timeEntry.split(" ");
  //         if (startDateInputs[index] && startTimeInputs[index]) {
  //           startDateInputs[index].value = startDate; // 填充开始日期部分
  //           startTimeInputs[index].value = startTime; // 填充开始时间部分
  //         }
  //         if (endDateInputs[index] && endTimeInputs[index]) {
  //           endDateInputs[index].value = endDate; // 填充结束日期部分
  //           endTimeInputs[index].value = endTime; // 填充结束时间部分
  //         }
  //       });
  //     }
  //   });
  triggerConfirmButton();
}
