// 数据服务 - 管理用户数据、游戏数据和持久化
export function initializeDataService() {
    // 用户数据变量
    let userData = null;
    
    // 初始化数据服务
    const initialize = async () => {
        try {
            // 从localStorage加载用户数据
            const savedData = localStorage.getItem('logicMasterUserData');
            
            if (savedData) {
                userData = JSON.parse(savedData);
                console.log('User data loaded from storage');
            } else {
                // 创建新用户数据
                userData = createDefaultUserData();
                saveUserData();
                console.log('Created new user data');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize data service:', error);
            return false;
        }
    };
    
    // 创建默认用户数据
    const createDefaultUserData = () => {
        return {
            id: generateUserId(),
            username: `玩家${Math.floor(Math.random() * 1000000)}`,
            level: 1,
            experience: 0,
            coins: 1000,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            gameHistory: [],
            achievements: [
                {
                    id: 'streak-10',
                    name: '连胜之星',
                    description: '在一局游戏中连续答对10题',
                    type: 'streak',
                    progress: 0,
                    target: 10,
                    completed: false
                },
                {
                    id: 'accuracy-90',
                    name: '精准思考者',
                    description: '达到90%的答题正确率',
                    type: 'accuracy',
                    progress: 0,
                    target: 90,
                    completed: false
                },
                {
                    id: 'speed-5',
                    name: '闪电思维',
                    description: '平均回答时间低于5秒',
                    type: 'speed',
                    progress: 0,
                    target: 5,
                    completed: false
                },
                {
                    id: 'games-50',
                    name: '逻辑成瘾者',
                    description: '完成50局游戏',
                    type: 'mastery',
                    progress: 0,
                    target: 50,
                    completed: false
                }
            ],
            inventory: {
                items: [],
                badges: []
            },
            settings: {
                sound: true,
                notifications: true,
                theme: 'light'
            },
            stats: {
                totalGames: 0,
                totalCorrect: 0,
                totalQuestions: 0,
                totalScore: 0,
                bestScore: 0,
                averageAccuracy: 0,
                averageResponseTime: 0,
                historicalPerformance: []
            },
            learningProfile: {
                strengths: [],
                weaknesses: [],
                preferences: [],
                learningGoals: []
            }
        };
    };
    
    // 生成用户ID
    const generateUserId = () => {
        return 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    };
    
    // 保存用户数据到localStorage
    const saveUserData = () => {
        try {
            localStorage.setItem('logicMasterUserData', JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Failed to save user data:', error);
            return false;
        }
    };
    
    // 获取用户数据
    const getUserData = () => {
        return userData;
    };
    
    // 更新用户数据
    const updateUserData = (newData) => {
        userData = { ...userData, ...newData };
        return saveUserData();
    };
    
    // 保存游戏结果
    const saveGameResults = (results) => {
        if (!userData) return false;
        
        // 更新游戏历史
        userData.gameHistory.push(results);
        
        // 更新统计信息
        updateUserStats(results);
        
        // 检查成就
        checkAchievements(results);
        
        // 更新学习档案
        updateLearningProfile(results);
        
        // 保存更新后的用户数据
        return saveUserData();
    };
    
    // 更新用户统计信息
    const updateUserStats = (gameResults) => {
        if (!userData.stats) userData.stats = {};
        
        // 增加游戏总数
        userData.stats.totalGames = (userData.stats.totalGames || 0) + 1;
        
        // 更新总分和最高分
        userData.stats.totalScore = (userData.stats.totalScore || 0) + gameResults.score;
        userData.stats.bestScore = Math.max(userData.stats.bestScore || 0, gameResults.score);
        
        // 更新答题数据
        const correctAnswers = gameResults.answers.filter(a => a.isCorrect).length;
        const totalQuestions = gameResults.answers.length;
        
        userData.stats.totalCorrect = (userData.stats.totalCorrect || 0) + correctAnswers;
        userData.stats.totalQuestions = (userData.stats.totalQuestions || 0) + totalQuestions;
        
        // 计算平均正确率
        userData.stats.averageAccuracy = userData.stats.totalCorrect / userData.stats.totalQuestions;
        
        // 计算平均响应时间
        const responseTimes = gameResults.answers.map(a => a.responseTime).filter(t => t > 0);
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        
        // 使用加权平均更新总体平均响应时间
        if (userData.stats.averageResponseTime) {
            const oldWeight = (userData.stats.totalGames - 1) / userData.stats.totalGames;
            const newWeight = 1 / userData.stats.totalGames;
            userData.stats.averageResponseTime = 
                userData.stats.averageResponseTime * oldWeight + avgResponseTime * newWeight;
        } else {
            userData.stats.averageResponseTime = avgResponseTime;
        }
        
        // 添加到历史表现记录
        if (!userData.stats.historicalPerformance) userData.stats.historicalPerformance = [];
        
        userData.stats.historicalPerformance.push({
            date: new Date().toISOString(),
            score: gameResults.score,
            accuracy: gameResults.accuracy,
            avgResponseTime: gameResults.avgResponseTime
        });
        
        // 只保留最近50条记录
        if (userData.stats.historicalPerformance.length > 50) {
            userData.stats.historicalPerformance = userData.stats.historicalPerformance.slice(-50);
        }
    };
    
    // 检查成就完成情况
    const checkAchievements = (gameResults) => {
        if (!userData.achievements) userData.achievements = [];
        
        // 获取游戏中的最长连胜
        const streakAchievement = userData.achievements.find(a => a.id === 'streak-10');
        if (streakAchievement) {
            // 计算本局游戏的最大连胜
            let currentStreak = 0;
            let maxStreak = 0;
            
            gameResults.answers.forEach(answer => {
                if (answer.isCorrect) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 0;
                }
            });
            
            // 更新成就进度
            streakAchievement.progress = Math.max(streakAchievement.progress, maxStreak);
            streakAchievement.completed = streakAchievement.progress >= streakAchievement.target;
        }
        
        // 检查准确率成就
        const accuracyAchievement = userData.achievements.find(a => a.id === 'accuracy-90');
        if (accuracyAchievement) {
            const accuracy = gameResults.accuracy * 100;
            accuracyAchievement.progress = Math.max(accuracyAchievement.progress, Math.round(accuracy));
            accuracyAchievement.completed = accuracyAchievement.progress >= accuracyAchievement.target;
        }
        
        // 检查速度成就
        const speedAchievement = userData.achievements.find(a => a.id === 'speed-5');
        if (speedAchievement) {
            // 使用反向进度：越接近目标值越好
            const avgTime = gameResults.avgResponseTime;
            const progress = 5 / Math.max(avgTime, 1) * 100;
            speedAchievement.progress = Math.min(100, Math.max(speedAchievement.progress, Math.round(progress)));
            speedAchievement.completed = avgTime <= 5;
        }
        
        // 检查游戏总数成就
        const gamesAchievement = userData.achievements.find(a => a.id === 'games-50');
        if (gamesAchievement) {
            gamesAchievement.progress = Math.min(userData.stats.totalGames, gamesAchievement.target);
            gamesAchievement.completed = gamesAchievement.progress >= gamesAchievement.target;
        }
    };
    
    // 更新学习档案
    const updateLearningProfile = (gameResults) => {
        if (!userData.learningProfile) userData.learningProfile = {};
        
        // 按题型分析表现
        const typePerformance = {};
        
        gameResults.answers.forEach(answer => {
            if (!typePerformance[answer.questionType]) {
                typePerformance[answer.questionType] = {
                    correct: 0,
                    total: 0,
                    times: []
                };
            }
            
            typePerformance[answer.questionType].total++;
            if (answer.isCorrect) {
                typePerformance[answer.questionType].correct++;
            }
            
            if (answer.responseTime > 0) {
                typePerformance[answer.questionType].times.push(answer.responseTime);
            }
        });
        
        // 计算每种类型的掌握度和平均响应时间
        const strengths = [];
        const weaknesses = [];
        
        Object.keys(typePerformance).forEach(type => {
            const perf = typePerformance[type];
            
            const accuracy = perf.correct / perf.total;
            const avgTime = perf.times.reduce((sum, t) => sum + t, 0) / perf.times.length;
            
            // 85%以上正确率视为强项
            if (accuracy >= 0.85) {
                strengths.push({
                    type: type,
                    accuracy: accuracy,
                    avgTime: avgTime
                });
            }
            
            // 70%以下正确率视为弱项
            if (accuracy < 0.7) {
                weaknesses.push({
                    type: type,
                    accuracy: accuracy,
                    avgTime: avgTime
                });
            }
        });
        
        // 更新学习档案
        if (!userData.learningProfile.strengths) userData.learningProfile.strengths = [];
        if (!userData.learningProfile.weaknesses) userData.learningProfile.weaknesses = [];
        
        // 合并新旧数据，保留最近的5个强项和弱项
        userData.learningProfile.strengths = [
            ...strengths,
            ...userData.learningProfile.strengths.filter(s => 
                !strengths.some(ns => ns.type === s.type)
            )
        ].slice(0, 5);
        
        userData.learningProfile.weaknesses = [
            ...weaknesses,
            ...userData.learningProfile.weaknesses.filter(w => 
                !weaknesses.some(nw => nw.type === w.type)
            )
        ].slice(0, 5);
    };
    
    // 添加货币
    const addCoins = (amount) => {
        if (!userData) return false;
        
        userData.coins = (userData.coins || 0) + amount;
        return saveUserData();
    };
    
    // 扣除货币
    const deductCoins = (amount) => {
        if (!userData || (userData.coins || 0) < amount) return false;
        
        userData.coins -= amount;
        saveUserData();
        return true;
    };
    
    // 添加经验值
    const addExperience = (amount) => {
        if (!userData) return false;
        
        userData.experience = (userData.experience || 0) + amount;
        
        // 检查是否升级
        checkLevelUp();
        
        return saveUserData();
    };
    
    // 检查升级
    const checkLevelUp = () => {
        if (!userData) return false;
        
        const currentLevel = userData.level || 1;
        const currentExp = userData.experience || 0;
        
        // 计算升级所需经验
        const expNeeded = currentLevel * 500;
        
        if (currentExp >= expNeeded) {
            // 升级
            userData.level = currentLevel + 1;
            userData.experience -= expNeeded;
            
            // 升级奖励
            userData.coins = (userData.coins || 0) + (currentLevel * 100);
            
            // 递归检查是否继续升级
            checkLevelUp();
            
            return true;
        }
        
        return false;
    };
    
    // 获取每日挑战
    const getDailyChallenge = async () => {
        // 在实际应用中，这将从服务器获取
        // 这里使用本地生成的模拟数据
        
        // 检查是否已经有今天的挑战缓存
        const today = new Date().toISOString().split('T')[0];
        const cachedChallenge = localStorage.getItem(`dailyChallenge_${today}`);
        
        if (cachedChallenge) {
            return JSON.parse(cachedChallenge);
        }
        
        // 生成新的每日挑战
        const challenge = generateDailyChallenge();
        
        // 缓存挑战
        localStorage.setItem(`dailyChallenge_${today}`, JSON.stringify(challenge));
        
        return challenge;
    };
    
    // 生成每日挑战
    const generateDailyChallenge = () => {
        // 简单模拟，真实情况下会有更多变化
        return {
            date: new Date().toISOString(),
            title: '每日思维挑战',
            description: '挑战你的逻辑极限！',
            questions: [
                {
                    type: 'deduction',
                    difficulty: 0.7,
                    question: "所有的A都是B。所有的B都是C。小明是A。根据这些信息，以下哪个陈述一定为真？",
                    options: [
                        "小明可能是C",
                        "小明一定是C",
                        "小明可能不是C",
                        "小明一定不是C"
                    ],
                    correctAnswer: 1,
                    explanation: "根据三段论推理，如果所有A都是B，所有B都是C，那么所有A都是C。小明是A，所以小明一定是C。"
                },
                {
                    type: 'pattern',
                    difficulty: 0.6,
                    question: "找出下列数字序列的规律，并确定下一个数字：2, 6, 12, 20, 30, ?",
                    options: ["42", "40", "38", "36"],
                    correctAnswer: 0,
                    explanation: "这个序列的规律是：每个数字比前一个数字多的差值依次增加4：2+4=6, 6+6=12, 12+8=20, 20+10=30, 所以下一个数字是30+12=42。"
                },
                {
                    type: 'fallacy',
                    difficulty: 0.8,
                    question: "以下哪个论证属于'诉诸权威'谬误？",
                    options: [
                        "爱因斯坦是物理学家，所以他关于物理学的观点值得考虑",
                        "这种治疗方法必定有效，因为名人A说它有效",
                        "大多数医学研究表明，定期锻炼有益健康",
                        "这个理论有很多科学证据支持，所以它可能是正确的"
                    ],
                    correctAnswer: 1,
                    explanation: "诉诸权威谬误是指仅仅因为某个权威人士说了某事就认为它是真的，而不考虑该人是否在相关领域有专业知识。名人A不一定是医学专家，所以他对治疗方法的评价不应被视为权威。"
                }
                // 实际挑战中会有更多题目
            ]
        };
    };
    
    // 初始化数据服务
    return initialize()
        .then(() => {
            // 返回数据服务接口
            return {
                getUserData,
                updateUserData,
                saveGameResults,
                addCoins,
                deductCoins,
                addExperience,
                getDailyChallenge
            };
        });
}

