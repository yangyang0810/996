chrome.runtime.onInstalled.addListener(function() {
    console.log("打卡时间阅读器已安装。");

    // 在此处可以添加更多的生命周期管理代码，例如设置默认值等
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        // 这里可以监听来自内容脚本或弹出窗口的消息
        if (request.action === "processTimes") {
            // 处理从内容脚本接收的数据
            console.log("处理打卡时间数据：", request.data);
            // 根据需要添加更多逻辑
        }
    }
);

// 其他可能需要的事件监听器也可以在这里添加
