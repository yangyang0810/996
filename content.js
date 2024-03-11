chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
   if (request.action === "getPunchTimes") {
       // 异步操作
       setTimeout(function() { // 使用 setTimeout 模拟异步操作
           var punchTimes = extractAndProcessPunchTimes();
           sendResponse({data: punchTimes});
       }, 0);

       return true; // 表明响应将异步发送
   }
   return false; // 如果不处理该消息，则不需要返回 true
});

function extractAndProcessPunchTimes() {
   // 省略了时间提取逻辑的细节，这部分取决于您的页面结构
   let timeElements = document.querySelectorAll('span.unit');
   let dailyTimes = {};

   timeElements.forEach(element => {
       let dateTime = element.textContent.trim();
       let [date, time] = dateTime.split(' ');

       let earliestTime = calculateEarliestTime(time);

       if (!dailyTimes[date]) {
           dailyTimes[date] = { earliest: earliestTime , latest: time };
       } else {
           if (time < dailyTimes[date].earliest) {
               dailyTimes[date].earliest = earliestTime ;
           }
           if (time > dailyTimes[date].latest) {
               dailyTimes[date].latest = time;
           }
       }
   });

   return formatPunchTimes(dailyTimes);
}

function calculateEarliestTime(time) {
   let [hours, minutes] = time.split(':').map(Number);
   let earliestTime = "18:00"; // 默认值

   // 如果时间在8:30到9:00之间
   if (hours === 8 && minutes >= 30 || hours === 9 && minutes === 0) {
       // 计算超过8:30的分钟数
       let extraMinutes = (hours - 8) * 60 + (minutes - 30);
       earliestTime = `18:${extraMinutes.toString().padStart(2, '0')}`;
   }

   return earliestTime;
}
function formatPunchTimes(times) {
   return Object.keys(times).map(date => {
       // 将日期格式从 '2024/03/08' 转换为 '2024-03-08'
       let formattedDate = date.replace(/\//g, '-');
       return `最早：${formattedDate} ${times[date].earliest}    最晚：${formattedDate} ${times[date].latest}`;
   }).join('\n');
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
   if (request.action === "triggerWebpageButton") {
       triggerWebpageButton();
   }
});

function triggerWebpageButton() {
   chrome.storage.local.get('punchTimes', function(data) {
       if (data.punchTimes) {
           let punchTimesArray = data.punchTimes.split('\n'); // 假设打卡时间以换行符分隔
           let triggerCount = punchTimesArray.length - 1;

           for (let i = 0; i < triggerCount; i++) {
               // 触发网页上的按钮
               let button = document.querySelector('.weapp-form-detail-table__action-btn');
               if (button) {
                   button.click(); // 触发按钮点击
               }
           }
       }
   });
}