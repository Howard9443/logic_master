import { initializeAI } from './ai-engine.js';
import { setupGameLogic } from './game-logic.js';
import { initializeUI } from './ui-controller.js';
import { initializeDataService } from './data-service.js';
import { setupAnalytics } from './analytics.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Logic Master initializing...');
    
    try {
        // 初始化数据服务
        const dataService = await initializeDataService();
        
        // 初始化AI引擎
        const aiEngine = await initializeAI();
        
        // 设置游戏逻辑
        const gameLogic = setupGameLogic(dataService, aiEngine);
        
        // 初始化UI控制器
        initializeUI(gameLogic, dataService);
        
        // 设置分析工具
        setupAnalytics(dataService);
        
        console.log('Logic Master successfully initialized!');
        
        // 显示欢迎通知
        showNotification('欢迎来到逻辑大师训练营！', 'info');
    } catch (error) {
        console.error('Failed to initialize Logic Master:', error);
        showNotification('初始化失败，请刷新页面重试', 'error');
    }
});

// 显示通知的辅助函数
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const notificationMessage = document.createElement('div');
    notificationMessage.className = 'notification-message';
    notificationMessage.textContent = message;
    
    const closeButton = document.createElement('span');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    });
    
    notification.appendChild(notificationMessage);
    notification.appendChild(closeButton);
    
    notificationContainer.appendChild(notification);
    
    // 5秒后自动关闭
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

// 导出公共函数
export { showNotification };

