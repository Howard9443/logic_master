// UI控制器 - 处理用户界面交互和更新
export function initializeUI(gameLogic, dataService) {
    // 初始化屏幕切换
    initializeNavigation();
    
    // 初始化游戏相关UI
    initializeGameUI();
    
    // 初始化个人资料屏幕
    initializeProfileUI();
    
    // 初始化商店屏幕
    initializeShopUI();
    
    // 初始化排行榜屏幕
    initializeLeaderboardUI();
    
    // 初始化故事模式屏幕
    initializeStoryUI();
    
    // 初始化团队屏幕
    initializeTeamUI();
    
    // 更新用户状态显示
    updateUserStats();
    
    // 导航功能
    function initializeNavigation() {
        // 主导航按钮
        document.getElementById('play-btn').addEventListener('click', () => switchScreen('welcome-screen'));
        document.getElementById('profile-btn').addEventListener('click', () => switchScreen('profile-screen'));
        document.getElementById('shop-btn').addEventListener('click', () => switchScreen('shop-screen'));
        document.getElementById('leaderboard-btn').addEventListener('click', () => switchScreen('leaderboard-screen'));
        
        // 切换当前活跃导航按钮样式
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // 欢迎屏幕模式选择
        document.getElementById('single-mode').addEventListener('click', () => gameLogic.startGame('single'));
        document.getElementById('multi-mode').addEventListener('click', () => gameLogic.startGame('multi'));
        document.getElementById('story-mode').addEventListener('click', () => gameLogic.startStoryMode());
        document.getElementById('daily-challenge-btn').addEventListener('click', () => gameLogic.startDailyChallenge());
        
        // 结果屏幕按钮
        document.getElementById('play-again-btn').addEventListener('click', () => gameLogic.startGame(gameLogic.getGameState().currentMode));
        document.getElementById('share-results-btn').addEventListener('click', shareResults);
        document.getElementById('back-to-menu-btn').addEventListener('click', () => switchScreen('welcome-screen'));
        
        // 标签切换通用处理
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabGroup = btn.closest('.stats-tabs, .shop-tabs, .leaderboard-tabs');
                const tabContent = tabGroup.nextElementSibling;
                const targetTab = btn.dataset.tab;
                
                // 更新活跃标签按钮
                tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新显示的面板
                tabContent.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                tabContent.querySelector(`#${targetTab}-tab`) && tabContent.querySelector(`#${targetTab}-tab`).classList.add('active');
            });
        });
    }
    
    function initializeGameUI() {
        // 游戏控制按钮
        document.getElementById('hint-btn').addEventListener('click', requestHint);
        document.getElementById('skip-btn').addEventListener('click', () => gameLogic.skipQuestion());
        
        // 初始化计时器显示
        updateTimerDisplay();
    }
    
    function initializeProfileUI() {
        // 加载用户数据
        const userData = dataService.getUserData();
        if (!userData) return;
        
        // 更新用户信息
        document.querySelector('.username').textContent = userData.username || '玩家123456';
        document.querySelector('.rank-value').textContent = userData.rank || '逻辑学徒';
        
        // 更新进度条
        const progress = userData.experience || 0;
        const nextLevel = (userData.level || 1) * 500;
        const progressPercent = (progress / nextLevel) * 100;
        document.querySelector('.progress-fill').style.width = `${progressPercent}%`;
        document.querySelector('.progress-text').textContent = `${progress}/${nextLevel} XP`;
        
        // 加载成就
        loadAchievements();
        
        // 加载历史记录
        loadHistoryData();
    }
    
    function initializeShopUI() {
        // 更新商店余额显示
        updateShopBalance();
        
        // 订阅按钮点击事件
        document.querySelectorAll('.plan-btn').forEach(btn => {
            btn.addEventListener('click', () => handleSubscription(btn));
        });
        
        // 商品购买按钮
        document.querySelectorAll('.item-btn').forEach(btn => {
            btn.addEventListener('click', () => handleItemPurchase(btn));
        });
        
        // NFT徽章购买按钮
        document.querySelectorAll('.badge-btn').forEach(btn => {
            btn.addEventListener('click', () => handleBadgePurchase(btn));
        });
    }
    
    function initializeLeaderboardUI() {
        // 加载排行榜数据
        loadLeaderboardData();
        
        // 挑战按钮
        document.getElementById('challenge-top-btn').addEventListener('click', challengeTopPlayers);
        document.getElementById('team-ranking-btn').addEventListener('click', viewTeamRankings);
    }
    
    function initializeStoryUI() {
        // 故事模式按钮
        document.getElementById('continue-story-btn').addEventListener('click', continueStory);
        document.getElementById('exit-story-btn').addEventListener('click', () => switchScreen('welcome-screen'));
    }
    
    function initializeTeamUI() {
        // 团队操作按钮
        document.getElementById('start-team-challenge').addEventListener('click', startTeamChallenge);
        document.getElementById('invite-member-btn').addEventListener('click', inviteTeamMember);
        document.getElementById('leave-team-btn').addEventListener('click', leaveTeam);
    }
    
    // 切换屏幕
    function switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    // 更新用户状态显示
    function updateUserStats() {
        const userData = dataService.getUserData();
        if (!userData) return;
        
        // 更新级别显示
        document.querySelector('.level-number').textContent = `Lv.${userData.level || 1}`;
        
        // 更新货币显示
        document.querySelector('.coin-amount').textContent = userData.coins || 0;
    }
    
    // 更新计时器显示
    function updateTimerDisplay() {
        const gameState = gameLogic.getGameState();
        const timerValue = document.querySelector('.timer-value');
        
        if (!gameState.isGameActive) {
            timerValue.textContent = '00:30';
            return;
        }
        
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 时间少于10秒时添加视觉提示
        if (gameState.timeLeft <= 10) {
            timerValue.classList.add('warning');
        } else {
            timerValue.classList.remove('warning');
        }
    }
    
    // 请求提示
    function requestHint() {
        const hint = gameLogic.requestHint();
        if (hint) {
            // 创建提示框
            const hintBox = document.createElement('div');
            hintBox.className = 'hint-box';
            hintBox.innerHTML = `
                <div class="hint-header">
                    <h4>提示</h4>
                    <span class="hint-close">&times;</span>
                </div>
                <p>${hint}</p>
            `;
            
            document.querySelector('.question-container').appendChild(hintBox);
            
            // 添加关闭按钮功能
            hintBox.querySelector('.hint-close').addEventListener('click', () => {
                hintBox.remove();
            });
            
            // 自动关闭
            setTimeout(() => {
                hintBox.classList.add('fade-out');
                setTimeout(() => hintBox.remove(), 500);
            }, 10000);
        }
    }
    
    // 分享结果
    function shareResults() {
        const gameState = gameLogic.getGameState();
        
        // 构建分享文本
        const shareText = `我在逻辑大师中获得了${gameState.score}分，正确率${Math.round((gameState.totalCorrect / gameState.totalQuestions) * 100)}%！来挑战我吧！ #逻辑大师#`;
        
        // 模拟分享功能
        if (navigator.share) {
            navigator.share({
                title: '逻辑大师挑战结果',
                text: shareText,
                url: window.location.href
            })
            .then(() => console.log('成功分享'))
            .catch(err => console.error('分享失败:', err));
        } else {
            // 复制到剪贴板
            const textarea = document.createElement('textarea');
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            alert('结果已复制到剪贴板，可以分享给好友了！');
        }
    }
    
    // 加载成就
    function loadAchievements() {
        const userData = dataService.getUserData();
        if (!userData || !userData.achievements) return;
        
        const achievementsGrid = document.querySelector('.achievements-grid');
        achievementsGrid.innerHTML = '';
        
        userData.achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = 'achievement-card';
            
            const iconSvg = getAchievementIcon(achievement.type);
            
            achievementCard.innerHTML = `
                <div class="achievement-icon">
                    ${iconSvg}
                </div>
                <h4 class="achievement-name">${achievement.name}</h4>
                <p class="achievement-desc">${achievement.description}</p>
                <div class="achievement-progress">
                    <div class="achievement-fill" style="width: ${achievement.progress || 0}%"></div>
                </div>
                <span class="achievement-progress-text">${achievement.progress || 0}/${achievement.target}</span>
            `;
            
            achievementsGrid.appendChild(achievementCard);
        });
        
        // 如果没有成就，显示提示
        if (userData.achievements.length === 0) {
            achievementsGrid.innerHTML = '<p class="empty-message">暂无成就，开始挑战解锁更多成就吧！</p>';
        }
    }
    
    // 成就图标生成
    function getAchievementIcon(type) {
        const icons = {
            streak: `<svg width="50" height="50" viewBox="0 0 50 50">
                <path d="M10,40 L40,40 L25,10 Z" fill="#ff7f50"/>
                <circle cx="25" cy="25" r="5" fill="#fff"/>
            </svg>`,
            accuracy: `<svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#4caf50" stroke-width="3"/>
                <path d="M15,25 L22,32 L35,18" stroke="#4caf50" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`,
            speed: `<svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#2196f3" stroke-width="3"/>
                <path d="M25,25 L25,10" stroke="#2196f3" stroke-width="3" stroke-linecap="round"/>
                <path d="M25,25 L35,30" stroke="#2196f3" stroke-width="3" stroke-linecap="round"/>
                <circle cx="25" cy="25" r="3" fill="#2196f3"/>
            </svg>`,
            mastery: `<svg width="50" height="50" viewBox="0 0 50 50">
                <path d="M25,5 L30,20 L45,20 L35,30 L40,45 L25,35 L10,45 L15,30 L5,20 L20,20 Z" fill="#ffc107"/>
            </svg>`,
            social: `<svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="15" cy="20" r="8" fill="#9c27b0"/>
                <circle cx="35" cy="20" r="8" fill="#9c27b0"/>
                <circle cx="25" cy="35" r="8" fill="#9c27b0"/>
                <path d="M15,20 L35,20 M15,20 L25,35 M35,20 L25,35" stroke="#9c27b0" stroke-width="2"/>
            </svg>`
        };
        
        return icons[type] || icons.mastery;
    }
    
    // 加载历史数据
    function loadHistoryData() {
        const userData = dataService.getUserData();
        if (!userData || !userData.gameHistory) return;
        
        const historyRecords = document.querySelector('.history-records');
        historyRecords.innerHTML = '';
        
        // 按日期排序，最近的在前
        const sortedHistory = [...userData.gameHistory].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        // 显示最近10条记录
        sortedHistory.slice(0, 10).forEach(game => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(game.date);
            const formattedDate = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            historyItem.innerHTML = `
                <div class="history-info">
                    <div class="history-mode">${getModeName(game.mode)}</div>
                    <div class="history-date">${formattedDate}</div>
                </div>
                <div class="history-result">${game.score}分</div>
            `;
            
            historyRecords.appendChild(historyItem);
        });
        
        // 如果没有历史记录，显示提示
        if (sortedHistory.length === 0) {
            historyRecords.innerHTML = '<p class="empty-message">暂无游戏记录，开始你的第一场游戏吧！</p>';
        }
        
        // 准备历史图表数据
        if (sortedHistory.length > 0) {
            drawHistoryChart(sortedHistory);
        }
    }
    
    // 绘制历史数据图表
    function drawHistoryChart(historyData) {
        const ctx = document.getElementById('history-chart').getContext('2d');
        
        // 准备图表数据，最多显示最近15条记录
        const recentData = historyData.slice(0, 15).reverse();
        
        const labels = recentData.map(game => {
            const date = new Date(game.date);
            return `${(date.getMonth()+1)}/${date.getDate()}`;
        });
        
        const scores = recentData.map(game => game.score);
        const accuracies = recentData.map(game => Math.round(game.accuracy * 100));
        
        // 创建图表
        if (window.historyChart) {
            window.historyChart.destroy();
        }
        
        window.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '得分',
                        data: scores,
                        borderColor: 'rgba(74, 134, 232, 1)',
                        backgroundColor: 'rgba(74, 134, 232, 0.1)',
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: '正确率(%)',
                        data: accuracies,
                        borderColor: 'rgba(46, 204, 113, 1)',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '得分'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: '正确率(%)'
                        },
                        min: 0,
                        max: 100,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }
    
    // 更新商店余额显示
    function updateShopBalance() {
        const userData = dataService.getUserData();
        if (!userData) return;
        
        document.querySelector('.shop-balance .coin-amount').textContent = userData.coins || 0;
    }
    
    // 处理订阅购买
    function handleSubscription(btn) {
        const planName = btn.closest('.plan-card').querySelector('h3').textContent;
        
        // 模拟支付流程
        if (confirm(`确认订阅${planName}？将跳转到支付页面。`)) {
            alert('支付功能演示：假设支付成功！');
            
            // 更新用户数据
            const userData = dataService.getUserData();
            if (userData) {
                userData.subscription = {
                    plan: planName,
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后
                };
                
                dataService.updateUserData(userData);
                
                alert(`恭喜！你已成功订阅${planName}，有效期30天。`);
            }
        }
    }
    
    // 处理道具购买
    function handleItemPurchase(btn) {
        const itemCard = btn.closest('.item-card');
        const itemName = itemCard.querySelector('h4').textContent;
        const itemPrice = parseInt(itemCard.querySelector('.item-price span').textContent);
        
        if (dataService.deductCoins(itemPrice)) {
            // 更新物品库存
            const userData = dataService.getUserData();
            if (!userData.inventory) userData.inventory = {};
            if (!userData.inventory.items) userData.inventory.items = [];
            
            userData.inventory.items.push({
                name: itemName,
                purchaseDate: new Date().toISOString(),
                used: false
            });
            
            dataService.updateUserData(userData);
            
            // 更新余额显示
            updateShopBalance();
            updateUserStats();
            
            alert(`购买成功！${itemName}已添加到你的物品库。`);
        } else {
            alert('逻辑币不足，无法购买！');
        }
    }
    
    // 处理徽章购买
    function handleBadgePurchase(btn) {
        const badgeCard = btn.closest('.badge-card');
        const badgeName = badgeCard.querySelector('h4').textContent;
        const badgePrice = parseInt(badgeCard.querySelector('.badge-price span').textContent);
        
        if (dataService.deductCoins(badgePrice)) {
            // 更新徽章收藏
            const userData = dataService.getUserData();
            if (!userData.inventory) userData.inventory = {};
            if (!userData.inventory.badges) userData.inventory.badges = [];
            
            userData.inventory.badges.push({
                name: badgeName,
                purchaseDate: new Date().toISOString(),
                tokenId: `NFT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
            });
            
            dataService.updateUserData(userData);
            
            // 更新余额显示
            updateShopBalance();
            updateUserStats();
            
            alert(`恭喜！你已成功获得NFT徽章：${badgeName}`);
        } else {
            alert('逻辑币不足，无法购买！');
        }
    }
    
    // 加载排行榜数据
    function loadLeaderboardData() {
        // 在实际应用中，这将从服务器获取
        // 这里使用模拟数据
        const leaderboardData = [
            { rank: 1, name: '逻辑破解者', score: 10250, accuracy: 0.97 },
            { rank: 2, name: '思维风暴', score: 9850, accuracy: 0.95 },
            { rank: 3, name: '推理专家', score: 9720, accuracy: 0.94 },
            { rank: 4, name: '数学猫', score: 9650, accuracy: 0.93 },
            { rank: 5, name: '阿尔法思维', score: 9400, accuracy: 0.91 },
            { rank: 6, name: '理性光芒', score: 9350, accuracy: 0.89 },
            { rank: 7, name: '决策树', score: 9100, accuracy: 0.88 },
            { rank: 8, name: '逻辑天使', score: 8950, accuracy: 0.87 }
        ];
        
        // 模拟当前用户排名
        const currentUserRank = {
            rank: 128,
            name: '玩家123456',
            score: 5430,
            accuracy: 0.78
        };
        
        // 更新排行榜表格
        updateLeaderboardTable(leaderboardData, currentUserRank);
    }
    
    // 更新排行榜表格
    function updateLeaderboardTable(leaderboardData, currentUserRank) {
        const tableBody = document.querySelector('.table-body');
        
        // 清空现有数据
        tableBody.innerHTML = '';
        
        // 添加排行榜数据
        leaderboardData.forEach(player => {
            if (player.rank <= 3) return; // 前三名已在顶部显示
            
            const row = document.createElement('div');
            row.className = 'table-row';
            
            row.innerHTML = `
                <div class="rank-col">${player.rank}</div>
                <div class="player-col">${player.name}</div>
                <div class="score-col">${player.score}</div>
                <div class="accuracy-col">${Math.round(player.accuracy * 100)}%</div>
            `;
            
            tableBody.appendChild(row);
        });
        
        // 添加当前用户行
        const currentUserRow = document.createElement('div');
        currentUserRow.className = 'table-row current-user';
        
        currentUserRow.innerHTML = `
            <div class="rank-col">${currentUserRank.rank}</div>
            <div class="player-col">${currentUserRank.name}</div>
            <div class="score-col">${currentUserRank.score}</div>
            <div class="accuracy-col">${Math.round(currentUserRank.accuracy * 100)}%</div>
        `;
        
        tableBody.appendChild(currentUserRow);
    }
    
    // 挑战顶级玩家
    function challengeTopPlayers() {
        alert('即将开始与排行榜前三名的历史战绩对战！');
        gameLogic.startGame('multi', 15);
    }
    
    // 查看战队排行
    function viewTeamRankings() {
        gameLogic.startTeamChallenge();
    }
    
    // 继续故事
    function continueStory() {
        // 在实际应用中，这将加载下一个故事阶段
        alert('下一章节即将解锁...');
    }
    
    // 开始团队挑战
    function startTeamChallenge() {
        // 检查团队成员是否足够
        alert('需要3名成员才能开始挑战！请先邀请更多成员。');
    }
    
    // 邀请团队成员
    function inviteTeamMember() {
        const inviteCode = 'TEAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        alert(`邀请码已生成：${inviteCode}\n请将此代码分享给好友，他们可以通过此代码加入你的战队。`);
    }
    
    // 离开团队
    function leaveTeam() {
        if (confirm('确定要离开当前战队吗？')) {
            alert('你已成功离开战队"逻辑猎人"。');
            switchScreen('welcome-screen');
        }
    }
    
    // 辅助函数：获取游戏模式名称
    function getModeName(mode) {
        const modeNames = {
            'single': '单人模式',
            'multi': '多人对战',
            'story': '剧情模式',
            'daily': '每日挑战',
            'team': '团队挑战'
        };
        
        return modeNames[mode] || '未知模式';
    }
}

