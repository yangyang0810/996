// popup.js
chrome.runtime.onMessage.addListener(
   function(request, sender, sendResponse) {
       if (request.action === "displayTimes") {
           document.getElementById('timeDisplay').textContent = request.data;
       }
   }
);


document.addEventListener('DOMContentLoaded', function() {
   var saveButton = document.getElementById('saveButton');
   var checkTimeButton = document.getElementById('checkTimeButton');
   var timeDisplay = document.getElementById('timeDisplay'); // 获取显示时间的元素
   var triggerButton = document.getElementById('triggerButton');


   if (checkTimeButton) {
       checkTimeButton.addEventListener('click', function() {
           chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
               chrome.tabs.sendMessage(tabs[0].id, {action: "getPunchTimes"}, function(response) {
                   if (chrome.runtime.lastError) {
                       // 处理消息发送中可能出现的错误
                       timeDisplay.textContent = "发生错误：" + chrome.runtime.lastError.message;
                       return;
                   }

                   if (response && response.data) {
                       timeDisplay.textContent = response.data; // 显示时间数据
                   } else {
                       timeDisplay.textContent = "没找到打卡时间。"; // 没有找到时间时的显示
                   }
               });
           });
       });
   }

   if (saveButton) {
      saveButton.addEventListener('click', function() {
          // 将打卡时间保存到扩展的存储中
          chrome.storage.local.set({ 'punchTimes': timeDisplay.textContent }, function() {
              console.log('打卡时间已保存');
          });
      });
  }

  if (triggerButton) {
   triggerButton.addEventListener('click', function() {
       chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
           chrome.tabs.sendMessage(tabs[0].id, {action: "triggerWebpageButton"});
       });
   });
}
});