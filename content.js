/**
 * 监听来自其他部分的 Chrome 扩展消息，并响应获取考勤时间的请求。
 * @param {Object} request - 收到的消息对象。包含执行的动作信息。
 * @param {Object} sender - 发送消息的源。包含发送者的详细信息。
 * @param {Function} sendResponse - 用于响应消息的函数。发送响应数据。
 * @returns {boolean} - 如果响应是异步的，则返回 true；否则返回 false。
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "getPunchTimes") {
    // 使用 setTimeout 模拟异步获取考勤时间的过程
    setTimeout(function () {
      var punchTimes = extractAndProcessPunchTimes("ehr"); // 提取并处理考勤时间
      sendResponse({ data: punchTimes }); // 异步发送处理后的考勤时间数据
    }, 0);

    return true; // 表明响应将异步发送
  }
  return false; // 如果不处理该消息，则不需要返回 true
});

/**
 * 提取并处理考勤时间。
 * 该函数从页面中选取特定的时间元素，并汇总为每天的最早和最晚考勤时间。
 * 页面结构和时间元素的选择方式在函数中有所省略，需根据实际情况调整。
 *
 * @returns {Object} 格式化后的每天考勤时间对象，键为日期，值为包含最早和最晚考勤时间的对象。
 */
function extractAndProcessPunchTimes(identifier) {
  let dailyTimes = {};
  if (identifier == "ehr") {
    // 选择页面中所有的时间元素
    let timeElements = document.querySelectorAll("span.unit");

    // 遍历每个时间元素，提取日期和时间，并计算每天的最早和最晚考勤时间
    timeElements.forEach((element) => {
      let dateTime = element.textContent.trim();
      let [date, time] = dateTime.split(" ");

      let formattedDate = date.replace(/\//g, "-");

      let dateParts = formattedDate.split("-");
      let dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // 月份-1是因为JavaScript的月份从0开始
      let dayOfWeek = dateObj.getDay(); // 0表示周日，6表示周六
      let earliestTime = calculateEarliestTime(time);
      // 周末特殊处理
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        earliestTime = time;
      }
      // 计算时间的最早形式（例如，将"13:30"转换为"13:30:00"）

      // 如果当天考勤信息尚未初始化，则以当前时间为最早和最晚时间开始记录
      if (!dailyTimes[date]) {
        dailyTimes[date] = { earliest: earliestTime, latest: time };
      } else {
        // 如果当前时间早于已记录的最早时间，则更新最早时间
        if (time < dailyTimes[date].earliest) {
          dailyTimes[date].earliest = earliestTime;
        }
        // 如果当前时间晚于已记录的最晚时间，则更新最晚时间
        if (time > dailyTimes[date].latest) {
          dailyTimes[date].latest = time;
        }
      }
    });
  }
  if (identifier == "eteam") {
    let frmMain = document.getElementById("frmMain");
    const iframeDoc = frmMain.contentDocument || frmMain.contentWindow.document;
    // 选择页面中所有的时间元素
    let timeElements = iframeDoc.querySelectorAll("ul.content3");

    // 遍历每个时间元素，提取日期和时间，并计算每天的最早和最晚考勤时间
    timeElements.forEach((element) => {
      let dateTime = element.textContent.trim();
      // 使用正则表达式替换掉"打卡日期"和"打卡时间"以及它们之间的空格
      let cleanedRecord = dateTime.replace(/打卡日期\s+|打卡时间\B/g, " ");
      let [date, time] = cleanedRecord.split(" ");

      let formattedDate = date.replace(/\//g, "-");

      let dateParts = formattedDate.split("-");
      let dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // 月份-1是因为JavaScript的月份从0开始
      let dayOfWeek = dateObj.getDay(); // 0表示周日，6表示周六
      let earliestTime = calculateEarliestTime(time);
      // 周末特殊处理
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        earliestTime = time;
      }
      // 如果当天考勤信息尚未初始化，则以当前时间为最早和最晚时间开始记录
      if (!dailyTimes[date]) {
        dailyTimes[date] = { earliest: earliestTime, latest: time };
      } else {
        // 如果当前时间早于已记录的最早时间，则更新最早时间
        if (time < dailyTimes[date].earliest) {
          dailyTimes[date].earliest = earliestTime;
        }
        // 如果当前时间晚于已记录的最晚时间，则更新最晚时间
        if (time > dailyTimes[date].latest) {
          dailyTimes[date].latest = time;
        }
      }
    });
  }
  // 格式化每天的考勤时间，并返回结果
  return formatPunchTimes(dailyTimes);
}

/**
 * 计算最早的时间。
 * 该函数接收一个时间字符串（格式为"hh:mm"），并返回一个字符串格式的最早时间。
 * 若输入时间早于8:30，则返回固定值18:00；若输入时间大于等于8:30，则计算相对于8:30的分钟数，并以此确定最早时间。
 *
 * @param {string} time - 输入的时间字符串，格式为"hh:mm"。
 * @return {string} 返回计算出的最早时间，格式为"hh:mm"。
 */
function calculateEarliestTime(time) {
  // 将时间字符串分割为小时和分钟，并转换为数字
  let [hours, minutes] = time.split(":").map(Number);
  let earliestTime = "18:00"; // 默认的最早时间为18:00

  // 判断输入时间是否早于8:30，若是，则最早时间为18:00
  if (hours < 8 || (hours === 8 && minutes < 30)) {
    earliestTime = "18:00";
  } else if ((hours === 8 && minutes >= 30) || (hours === 9 && minutes === 0)) {
    // 计算超过8:30的分钟数，并据此设置最早时间
    let extraMinutes = (hours - 8) * 60 + (minutes - 30);
    earliestTime = `18:${extraMinutes.toString().padStart(2, "0")}`;
  }

  return earliestTime;
}

/**
 * 格式化考勤时间。
 * @param {Object} times - 包含日期和对应最早/latest考勤时间的对象。
 * @returns {string} - 格式化后的考勤时间字符串，每个日期及其最早和最晚考勤时间会被格式化为HTML标签显示。
 */

function formatPunchTimes(times) {
  let totalEffectiveHours = 0;
  let totalOvertimeHours = 0;
  return (
    Object.keys(times)
      .map((date) => {
        let formattedDate = date.replace(/\//g, "-");
        let dateParts = formattedDate.split("-");
        let dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        let dayOfWeek = dateObj.getDay();

        let earliestTime = times[date].earliest;
        let latestTime = times[date].latest;
        let timeColor = "";

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          timeColor = "style='color: green;'";
          let rawHoursDiff = calculateHours(earliestTime, latestTime);
          let effectiveHoursDiff =
            rawHoursDiff >= 1 ? Math.floor(rawHoursDiff * 2) / 2 : 0;
          totalEffectiveHours += effectiveHoursDiff;
          totalOvertimeHours += rawHoursDiff;
        } else {
          timeColor = latestTime < "18:00" ? "style='color: red;'" : "";
          if (latestTime >= "18:00") {
            let rawHoursDiff = calculateHours(earliestTime, latestTime);
            let effectiveHoursDiff =
              rawHoursDiff >= 1 ? Math.floor(rawHoursDiff * 2) / 2 : 0;
            totalEffectiveHours += effectiveHoursDiff;
            totalOvertimeHours += rawHoursDiff;
            if (effectiveHoursDiff === 0) {
              timeColor = "style='color: red;'";
            }
          }
        }

        return `<span ${timeColor}>${formattedDate} 最早：${earliestTime} 最晚：${latestTime}</span>`;
      })
      .join("\n") +
    `\n有效总时长：${totalEffectiveHours.toFixed(
      1
    )} h\n加班总时长：${totalOvertimeHours.toFixed(1)} h`
  );
  /**
   * 计算两个时间之间的小时数差
   * @param {string} startTime - 开始时间（格式：HH:mm）
   * @param {string} endTime - 结束时间（格式：HH:mm）
   * @returns {number} - 时间差（小时数）
   */
  function calculateHours(startTime, endTime) {
    const start = convertTimeToDecimal(startTime);
    const end = convertTimeToDecimal(endTime);
    return end - start;
  }

  /**
   * 将时间（格式：HH:mm）转换为十进制表示（例如：13:30 -> 13.5）
   * @param {string} time - 时间（格式：HH:mm）
   * @returns {number} - 十进制表示的时间
   */
  function convertTimeToDecimal(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours + minutes / 60;
  }
}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "triggerWebpageButton") {
    triggerWebpageButton();
  }
});

function extractLatestTimeOnly(dataArray) {
  const timePattern = /(\d{2}:\d{2}):\d{2}/g; // 匹配小时和分钟，忽略秒
  const results = [];

  dataArray.forEach((item) => {
    let matches = item.match(timePattern); // 获取所有时间匹配项
    if (matches && matches.length > 0) {
      // 提取最后一个匹配的时间（假设最后一个为最晚时间）
      const latestTime = matches[matches.length - 1];
      results.push(latestTime);
    }
  });

  return results;
}
/**
 * 触发网页按钮点击的函数。
 * 该函数首先从Chrome本地存储中获取打卡时间（punchTimes），然后根据这些时间进行操作。
 * 如果存在打卡时间且有晚于19:00的记录，将触发按钮点击次数；若不存在打卡时间或所有时间都早于19:00，则固定触发三次按钮点击。
 * 该函数不接受参数，并且没有返回值。
 */
function triggerWebpageButton() {
  // 从Chrome本地存储获取打卡时间
  chrome.storage.local.get("punchTimes", function (data) {
    if (data.punchTimes) {
      // 将打卡时间字符串分割为数组
      let punchTimesArray = data.punchTimes.split("\n");
      let triggerCount = 0;
      let latetimes = extractLatestTimeOnly(punchTimesArray);
      // 遍历打卡时间数组，计算需要触发按钮的次数
      for (let i = 0; i < latetimes.length; i++) {
        let endTime = latetimes[i];
        // 检查是否晚于19:00，若是则增加触发计数
        if (endTime.localeCompare("19:00") > 0) {
          triggerCount++;
        }
      }
      // 由于循环开始前自动计数1，最后需要减去1以修正触发次数
      --triggerCount;
      // 根据计数触发按钮点击
      for (let i = 0; i < triggerCount; i++) {
        let button = document.querySelector(
          ".weapp-form-detail-table__action-btn"
        );
        if (button) {
          button.click();
        }
      }
    } else {
      // 未找到打卡时间，默认触发三次按钮点击
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
/**
 * 异步执行一系列操作。
 * 先执行 fillTimeCells 函数，等待其完成后再依次对一组特定的 DOM 元素进行点击和焦点切换操作。
 */
async function executeSequentially() {
  // 等待 fillTimeCells 函数完成
  await fillTimeCells();
  console.log("fillTimeCells 完全执行完成，现在执行下一个操作");

  // 获取需要进行操作的 DOM 元素集合
  const cells = document.querySelectorAll(
    ".ui-input.ui-date-time-picker-rangeWrap-input"
  );

  // 创建鼠标点击事件
  const event = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  // 对每个 DOM 元素进行操作，通过 setTimeout 依次延迟执行
  for (let index = 0; index < cells.length / 2; index++) {
    //setTimeout(() => {
    // 对每对元素进行点击和焦点切换
    console.log(`Processing index: ${index}`);
    //cells[index * 2].dispatchEvent(event);
    // cells[index * 2].focus();
    // // cells[index * 2 + 1].dispatchEvent(event);
    // cells[index * 2 + 1].focus();
    if (cells[index * 2] && cells[index * 2].offsetParent !== null) {
      cells[index * 2].focus();
    }
    if (cells[index * 2 + 1] && cells[index * 2 + 1].offsetParent !== null) {
      cells[index * 2 + 1].focus();
    }
    // }, 100 * index + 1); // 延迟时间逐渐增加，以实现顺序操作
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "fillTimeCells") {
    executeSequentially();
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
  return new Promise((resolve, reject) => {
    try {
      triggerWebpageButton(); // 先触发 triggerWebpageButton 函数

      // 设置一个 2 秒的延时，然后继续执行填充时间的逻辑
      setTimeout(() => {
        chrome.storage.local.get("punchTimes", function (data) {
          if (!data.punchTimes) {
            console.log("No punch times data available.");
            resolve(); // 如果没有数据，直接解决 Promise
            return;
          }

          const punchTimesArray = data.punchTimes.split("\n");
          const cells = document.querySelectorAll(
            ".ui-input.ui-date-time-picker-rangeWrap-input"
          );
          let fillIndex = 0; // 用于跟踪实际填充的序号

          punchTimesArray.forEach((timeEntry, index, array) => {
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
            if (index == array.length - 1) {
              resolve();
            }
          });
        });
      }, 200); // 等待 2 秒后执行
    } catch (error) {
      console.error("An error occurred while processing punch times:", error);
      reject(error); // 在出错的情况下拒绝 Promise
    }
  });
}
// 辅助函数，用于安全地设置值并分派点击事件
function safeSetAttributeAndDispatch(element, value, eventType) {
  if (element) {
    element.setAttribute("value", value);
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  } else {
    console.error(`Element not found for value: ${value}`);
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
  console.log(`processTimeEntry index: ${fillIndex}`);
  // 为最早和最晚时间创建点击事件并设置值
  const clickEvent = "click";
  if (cells[fillIndex * 2]) {
    safeSetAttributeAndDispatch(cells[fillIndex * 2], times[0], clickEvent);
  }
  if (cells[fillIndex * 2 + 1]) {
    safeSetAttributeAndDispatch(cells[fillIndex * 2 + 1], times[1], clickEvent);
  }

  // 为日期输入框设置值
  const dateInputs = document.querySelectorAll(".ui-input.dateInput");
  if (dateInputs[fillIndex * 2]) {
    dateInputs[fillIndex * 2].setAttribute("value", matches[0]);
  }
  if (dateInputs[fillIndex * 2 + 1]) {
    dateInputs[fillIndex * 2 + 1].setAttribute("value", matches[1]);
  }
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "handleinqbuttonClick") {
    // 使用 setTimeout 模拟异步获取考勤时间的过程
    setTimeout(function () {
      var punchTimes = extractAndProcessPunchTimes("eteam"); // 提取并处理考勤时间
      sendResponse({ data: punchTimes }); // 异步发送处理后的考勤时间数据
    }, 0);

    return true; // 表明响应将异步发送
  }
  return false; // 如果不处理该消息，则不需要返回 true
});
