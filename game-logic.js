import { showNotification } from './app.js';

// 游戏逻辑类 - 处理核心游戏规则和状态
export function setupGameLogic(dataService, aiEngine) {
    // 游戏状态
    const gameState = {
        currentMode: 'single', // 'single', 'multi', 'story', 'team', 'daily'
        difficulty: 0.5,
        score: 0,
        questionIndex: 0,
        questions: [],
        answers: [],
        startTime: null,
        questionStartTime: null,
        timeLeft: 30,
        timer: null,
        isGameActive: false,
        isAnswered: false,
        selectedAnswer: null,
        correctAnswer: null,
        streakCount: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        responseTimes: []
    };
    
    // 题型定义
    const questionTypes = {
        deduction: {
            name: '演绎推理',
            description: '从一般原则推导出特殊结论的能力',
            difficulty: [0.3, 0.9], // 难度范围
            generate: generateDeductionQuestion
        },
        induction: {
            name: '归纳推理',
            description: '从特殊案例推导出一般规律的能力',
            difficulty: [0.4, 0.9],
            generate: generateInductionQuestion
        },
        pattern: {
            name: '模式识别',
            description: '识别并预测重复结构或序列的能力',
            difficulty: [0.2, 0.9],
            generate: generatePatternQuestion
        },
        analogy: {
            name: '类比推理',
            description: '基于相似关系进行推理的能力',
            difficulty: [0.3, 0.8],
            generate: generateAnalogyQuestion
        },
        conditional: {
            name: '条件推理',
            description: '基于前提和条件进行判断的能力',
            difficulty: [0.5, 1.0],
            generate: generateConditionalQuestion
        },
        fallacy: {
            name: '谬误识别',
            description: '识别逻辑论证中的错误的能力',
            difficulty: [0.6, 1.0],
            generate: generateFallacyQuestion
        },
        categorical: {
            name: '范畴推理',
            description: '处理分类和集合关系的能力',
            difficulty: [0.4, 0.9],
            generate: generateCategoricalQuestion
        },
        sequence: {
            name: '序列推理',
            description: '预测数字或符号序列的下一个元素的能力',
            difficulty: [0.3, 1.0],
            generate: generateSequenceQuestion
        }
    };
    
    // 主游戏逻辑接口
    const gameLogic = {
        // 开始新游戏
        startGame: (mode = 'single', questionCount = 10) => {
            // 重置游戏状态
            resetGameState();
            
            gameState.currentMode = mode;
            gameState.totalQuestions = questionCount;
            gameState.isGameActive = true;
            gameState.startTime = Date.now();
            
            // 获取用户数据以计算适当难度
            const userData = dataService.getUserData();
            
            // 使用AI计算动态难度
            if (userData) {
                const userStats = {
                    averageResponseTime: userData.averageResponseTime || 5,
                    accuracyRate: userData.accuracyRate || 0.7,
                    historyPerformance: userData.historyPerformance || 60,
                    domainStrengths: userData.domainStrengths || { current: 70 }
                };
                
                gameState.difficulty = aiEngine.calculateDynamicDifficulty(userStats);
                console.log(`Dynamic difficulty set to: ${gameState.difficulty}`);
            }
            
            // 根据选择的模式生成问题
            generateQuestions(questionCount);
            
            // 切换到游戏界面
            showGameScreen();
            
            // 开始展示第一个问题
            showQuestion(0);
        },
        
        // 提交答案
        submitAnswer: (answerIndex) => {
            if (!gameState.isGameActive || gameState.isAnswered) {
                return false;
            }
            
            // 记录回答
            const currentQuestion = gameState.questions[gameState.questionIndex];
            const correctAnswerIndex = currentQuestion.correctAnswer;
            const isCorrect = answerIndex === correctAnswerIndex;
            
            // 停止计时
            const endTime = Date.now();
            const responseTime = (endTime - gameState.questionStartTime) / 1000;
            
            // 更新游戏状态
            gameState.isAnswered = true;
            gameState.selectedAnswer = answerIndex;
            gameState.correctAnswer = correctAnswerIndex;
            gameState.responseTimes.push(responseTime);
            
            // 记录答案
            gameState.answers.push({
                questionIndex: gameState.questionIndex,
                questionType: currentQuestion.type,
                difficulty: currentQuestion.difficulty,
                userAnswer: answerIndex,
                correctAnswer: correctAnswerIndex,
                isCorrect: isCorrect,
                responseTime: responseTime
            });
            
            // 更新分数
            if (isCorrect) {
                gameState.totalCorrect++;
                gameState.streakCount++;
                
                // 计算分数加成
                const baseScore = Math.round(100 * currentQuestion.difficulty);
                const timeBonus = Math.max(0, Math.round(30 - responseTime) * 2);
                const streakBonus = Math.min(gameState.streakCount * 10, 50);
                
                const questionScore = baseScore + timeBonus + streakBonus;
                gameState.score += questionScore;
                
                // 显示分数动画
                showScoreAnimation(questionScore, timeBonus, streakBonus);
            } else {
                gameState.streakCount = 0;
            }
            
            // 显示反馈
            showAnswerFeedback(isCorrect, correctAnswerIndex);
            
            // 如果是最后一题，结束游戏
            if (gameState.questionIndex === gameState.questions.length - 1) {
                // 延迟一段时间后显示结果
                setTimeout(() => {
                    endGame();
                }, 2000);
            } else {
                // 延迟一段时间后显示下一题
                setTimeout(() => {
                    showQuestion(gameState.questionIndex + 1);
                }, 2000);
            }
            
            return true;
        },
        
        // 跳过当前问题
        skipQuestion: () => {
            if (!gameState.isGameActive || gameState.isAnswered) {
                return false;
            }
            
            // 记录为跳过
            const currentQuestion = gameState.questions[gameState.questionIndex];
            
            gameState.answers.push({
                questionIndex: gameState.questionIndex,
                questionType: currentQuestion.type,
                difficulty: currentQuestion.difficulty,
                userAnswer: -1, // -1 表示跳过
                correctAnswer: currentQuestion.correctAnswer,
                isCorrect: false,
                responseTime: 0
            });
            
            gameState.streakCount = 0;
            
            // 如果是最后一题，结束游戏
            if (gameState.questionIndex === gameState.questions.length - 1) {
                endGame();
            } else {
                // 显示下一题
                showQuestion(gameState.questionIndex + 1);
            }
            
            return true;
        },
        
        // 请求提示
        requestHint: () => {
            if (!gameState.isGameActive || gameState.isAnswered) {
                return null;
            }
            
            const currentQuestion = gameState.questions[gameState.questionIndex];
            
            // 扣除硬币
            if (dataService.deductCoins(50)) {
                // 返回提示信息
                return currentQuestion.hint || "分析问题中的关键信息，排除明显不合理的选项。";
            } else {
                showNotification("逻辑币不足，无法使用提示", "error");
                return null;
            }
        },
        
        // 获取当前游戏状态
        getGameState: () => {
            return { ...gameState };
        },
        
        // 特殊游戏模式
        startDailyChallenge: () => {
            // 获取每日挑战题目
            dataService.getDailyChallenge()
                .then(challenge => {
                    resetGameState();
                    gameState.currentMode = 'daily';
                    gameState.questions = challenge.questions;
                    gameState.totalQuestions = challenge.questions.length;
                    gameState.isGameActive = true;
                    gameState.startTime = Date.now();
                    
                    showGameScreen();
                    showQuestion(0);
                })
                .catch(err => {
                    console.error('Failed to load daily challenge:', err);
                    showNotification('无法加载每日挑战，请稍后再试', 'error');
                });
        },
        
        startStoryMode: () => {
            // 显示故事模式界面
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            document.getElementById('story-screen').classList.add('active');
        },
        
        startTeamChallenge: () => {
            // 显示团队挑战界面
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            document.getElementById('team-screen').classList.add('active');
        }
    };
    
    // 内部辅助函数
    function resetGameState() {
        // 停止任何正在运行的计时器
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        // 重置游戏状态
        gameState.difficulty = 0.5;
        gameState.score = 0;
        gameState.questionIndex = 0;
        gameState.questions = [];
        gameState.answers = [];
        gameState.startTime = null;
        gameState.questionStartTime = null;
        gameState.timeLeft = 30;
        gameState.timer = null;
        gameState.isGameActive = false;
        gameState.isAnswered = false;
        gameState.selectedAnswer = null;
        gameState.correctAnswer = null;
        gameState.streakCount = 0;
        gameState.totalCorrect = 0;
        gameState.totalQuestions = 0;
        gameState.responseTimes = [];
    }
    
    function generateQuestions(count) {
        const questions = [];
        
        // 获取用户数据以个性化问题类型
        const userData = dataService.getUserData();
        let targetTypes;
        
        if (userData) {
            // 使用AI引擎推荐个性化题目类型
            const userProfile = {
                strengths: userData.strengths || [],
                weaknesses: userData.weaknesses || [],
                preferences: userData.preferences || [],
                learningGoals: userData.learningGoals || []
            };
            
            targetTypes = aiEngine.getPersonalizedRecommendations(userProfile);
        } else {
            // 默认使用混合题型
            targetTypes = Object.keys(questionTypes);
        }
        
        // 根据难度和类型生成问题
        for (let i = 0; i < count; i++) {
            // 循环使用推荐的题型
            const typeKey = targetTypes[i % targetTypes.length];
            const type = questionTypes[typeKey] || questionTypes.deduction;
            
            // 根据当前进度稍微增加难度
            const progressDifficulty = gameState.difficulty * (1 + (i / (count * 2)));
            const actualDifficulty = Math.min(
                Math.max(progressDifficulty, type.difficulty[0]), 
                type.difficulty[1]
            );
            
            // 生成问题
            const question = type.generate(actualDifficulty);
            question.type = typeKey;
            question.difficulty = actualDifficulty;
            
            questions.push(question);
        }
        
        gameState.questions = questions;
    }
    
    function showGameScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('game-screen').classList.add('active');
    }
    
    function showQuestion(index) {
        if (index >= gameState.questions.length) {
            endGame();
            return;
        }
        
        // 更新游戏状态
        gameState.questionIndex = index;
        gameState.isAnswered = false;
        gameState.selectedAnswer = null;
        gameState.correctAnswer = null;
        gameState.questionStartTime = Date.now();
        
        const question = gameState.questions[index];
        
        // 更新界面
        const questionText = document.querySelector('.question-text h3');
        const questionDesc = document.querySelector('.question-text p');
        const optionsContainer = document.querySelector('.options-container');
        const difficultyFill = document.querySelector('.difficulty-fill');
        
        questionText.textContent = question.question;
        questionDesc.textContent = question.description || "";
        
        // 更新难度指示器
        difficultyFill.style.width = `${question.difficulty * 100}%`;
        
        // 更新选项
        optionsContainer.innerHTML = '';
        question.options.forEach((option, idx) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-btn';
            optionBtn.textContent = option;
            optionBtn.dataset.index = idx;
            
            optionBtn.addEventListener('click', () => {
                gameLogic.submitAnswer(idx);
            });
            
            optionsContainer.appendChild(optionBtn);
        });
        
        // 如果是计时模式，设置计时器
        if (gameState.currentMode === 'single' || gameState.currentMode === 'daily') {
            gameState.timeLeft = 30;
            updateTimerDisplay();
            
            if (gameState.timer) {
                clearInterval(gameState.timer);
            }
            
            gameState.timer = setInterval(() => {
                gameState.timeLeft--;
                updateTimerDisplay();
                
                if (gameState.timeLeft <= 0) {
                    clearInterval(gameState.timer);
                    gameLogic.skipQuestion();
                }
            }, 1000);
        }
    }
    
    function updateTimerDisplay() {
        const timerValue = document.querySelector('.timer-value');
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
    
    function showAnswerFeedback(isCorrect, correctIndex) {
        // 停止计时器
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        // 更新选项样式
        const options = document.querySelectorAll('.option-btn');
        
        options.forEach((option, index) => {
            if (index === correctIndex) {
                option.classList.add('correct');
            } else if (index === gameState.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
        });
        
        // 显示反馈消息
        if (isCorrect) {
            showNotification('答案正确！', 'success');
        } else {
            showNotification('答案错误！', 'error');
        }
    }
    
    function showScoreAnimation(score, timeBonus, streakBonus) {
        // 更新分数显示
        const scoreValue = document.querySelector('.score-value');
        scoreValue.textContent = gameState.score;
        
        // 创建分数动画元素
        const scoreAnimation = document.createElement('div');
        scoreAnimation.className = 'score-animation';
        scoreAnimation.innerHTML = `
            +${score} 分
            ${timeBonus > 0 ? `<span class="bonus">时间奖励: +${timeBonus}</span>` : ''}
            ${streakBonus > 0 ? `<span class="bonus">连击奖励: +${streakBonus}</span>` : ''}
        `;
        
        document.querySelector('.question-container').appendChild(scoreAnimation);
        
        // 添加动画效果
        setTimeout(() => {
            scoreAnimation.classList.add('animate');
        }, 100);
        
        // 移除动画元素
        setTimeout(() => {
            scoreAnimation.remove();
        }, 2000);
    }
    
    function endGame() {
        // 停止计时器
        if (gameState.timer) {
            clearInterval(gameState.timer);
        }
        
        // 计算结果
        const totalTime = (Date.now() - gameState.startTime) / 1000;
        const accuracy = gameState.totalCorrect / gameState.totalQuestions;
        const avgResponseTime = gameState.responseTimes.length > 0 
            ? gameState.responseTimes.reduce((sum, time) => sum + time, 0) / gameState.responseTimes.length 
            : 0;
        
        // 获取类型掌握度
        const typeMastery = {};
        gameState.answers.forEach(answer => {
            if (!typeMastery[answer.questionType]) {
                typeMastery[answer.questionType] = {
                    correct: 0,
                    total: 0
                };
            }
            
            typeMastery[answer.questionType].total++;
            if (answer.isCorrect) {
                typeMastery[answer.questionType].correct++;
            }
        });
        
        // 计算每种类型的掌握度百分比
        Object.keys(typeMastery).forEach(type => {
            typeMastery[type].mastery = Math.round((typeMastery[type].correct / typeMastery[type].total) * 100);
        });
        
        // 计算奖励
        const baseCoins = Math.round(gameState.score / 10);
        const accuracyBonus = Math.round(accuracy * 100);
        const totalCoins = baseCoins + accuracyBonus;
        
        const baseXp = Math.round(gameState.score / 5);
        const timeBonus = Math.max(0, Math.round(300 - totalTime) * 0.1);
        const totalXp = Math.round(baseXp + timeBonus);
        
        // 保存游戏结果
        const gameResults = {
            mode: gameState.currentMode,
            score: gameState.score,
            accuracy: accuracy,
            avgResponseTime: avgResponseTime,
            totalTime: totalTime,
            typeMastery: typeMastery,
            coins: totalCoins,
            xp: totalXp,
            date: new Date().toISOString(),
            answers: gameState.answers
        };
        
        dataService.saveGameResults(gameResults);
        
        // 更新用户货币和经验
        dataService.addCoins(totalCoins);
        dataService.addExperience(totalXp);
        
        // 显示结果屏幕
        showResultsScreen(gameResults);
    }
    
    function showResultsScreen(results) {
        // 更新界面
        document.getElementById('final-score').textContent = results.score;
        document.getElementById('accuracy').textContent = `${Math.round(results.accuracy * 100)}%`;
        document.getElementById('avg-time').textContent = `${results.avgResponseTime.toFixed(2)}s`;
        document.getElementById('coins-earned').textContent = `+${results.coins}`;
        document.getElementById('xp-earned').textContent = `+${results.xp} XP`;
        
        // 显示能力雷达图
        drawSkillsRadar(results.typeMastery);
        
        // 显示知识图谱
        drawKnowledgeGraph(results.answers);
        
        // 显示结果屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('results-screen').classList.add('active');
        
        // 重置游戏状态
        gameState.isGameActive = false;
    }
    
    // 绘制能力雷达图
    function drawSkillsRadar(typeMastery) {
        const ctx = document.getElementById('skills-radar').getContext('2d');
        
        // 准备雷达图数据
        const labels = [];
        const data = [];
        
        Object.keys(typeMastery).forEach(type => {
            labels.push(questionTypes[type] ? questionTypes[type].name : type);
            data.push(typeMastery[type].mastery);
        });
        
        // 创建雷达图
        if (window.radarChart) {
            window.radarChart.destroy();
        }
        
        window.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: '能力掌握度',
                    data: data,
                    backgroundColor: 'rgba(74, 134, 232, 0.2)',
                    borderColor: 'rgba(74, 134, 232, 1)',
                    pointBackgroundColor: 'rgba(74, 134, 232, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(74, 134, 232, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }
    
    // 绘制知识图谱
    function drawKnowledgeGraph(answers) {
        // 获取用户认知图谱数据
        const userCognitiveMap = aiEngine.getUserCognitiveMap(answers);
        
        // 初始化图谱
        const cy = cytoscape({
            container: document.getElementById('knowledge-graph'),
            elements: [
                ...userCognitiveMap.nodes.map(node => ({
                    data: { 
                        id: node.id, 
                        label: node.label, 
                        strength: node.strength,
                        size: node.size,
                        parent: node.parent
                    }
                })),
                ...userCognitiveMap.edges.map(edge => ({
                    data: { 
                        source: edge.source, 
                        target: edge.target,
                        weight: edge.weight
                    }
                }))
            ],
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': (ele) => {
                            const strength = ele.data('strength');
                            if (strength >= 80) return '#4CAF50';
                            if (strength >= 70) return '#8BC34A';
                            if (strength >= 60) return '#FFEB3B';
                            if (strength >= 50) return '#FFC107';
                            return '#FF5722';
                        },
                        'width': 'data(size)',
                        'height': 'data(size)',
                        'label': 'data(label)',
                        'color': '#fff',
                        'text-outline-width': 2,
                        'text-outline-color': '#555',
                        'font-size': '12px',
                        'text-valign': 'center',
                        'text-halign': 'center'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': (ele) => ele.data('weight') * 5,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier'
                    }
                }
            ],
            layout: {
                name: 'cose',
                padding: 10
            }
        });
    }
    
    // 以下是题目生成器函数
    function generateDeductionQuestion(difficulty) {
        // 演绎推理题
        const questions = [
            {
                question: "所有哺乳动物都有肺。所有鲸鱼都是哺乳动物。根据以上前提，以下哪个结论是正确的？",
                options: [
                    "所有有肺的动物都是哺乳动物",
                    "所有鲸鱼都有肺",
                    "有些有肺的动物不是鲸鱼",
                    "有些哺乳动物不是鲸鱼"
                ],
                correctAnswer: 1,
                explanation: "这是一个三段论推理。从"所有哺乳动物都有肺"和"所有鲸鱼都是哺乳动物"，我们可以推导出"所有鲸鱼都有肺"。",
                hint: "使用三段论的规则，将两个前提中的共同项连接起来"
            },
            {
                question: "如果下雨，地面会湿。地面是干的。根据这些信息，你能推断出什么？",
                options: [
                    "一定没下雨",
                    "可能下雨了",
                    "一定下雨了",
                    "无法确定是否下雨"
                ],
                correctAnswer: 0,
                explanation: "这是一个反证法的应用。前提是：如果P（下雨），那么Q（地面湿）。我们观察到非Q（地面不湿），所以可以推断非P（没下雨）。",
                hint: "运用逻辑中的'否定后件'规则"
            },
            {
                question: "所有的狗都是动物。有些动物是宠物。根据这些信息，以下哪个陈述一定为真？",
                options: [
                    "所有的宠物都是狗",
                    "所有的狗都是宠物",
                    "有些狗可能是宠物",
                    "有些宠物一定不是狗"
                ],
                correctAnswer: 2,
                explanation: "从"所有的狗都是动物"和"有些动物是宠物"，我们不能确定所有狗是否是宠物，也不能确定所有宠物是否是狗，但我们可以推断出"有些狗可能是宠物"。",
                hint: "仔细分析集合之间的关系，思考哪些关系是确定的，哪些只是可能的"
            }
        ];
        
        // 根据难度选择问题，这里简化处理
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generateInductionQuestion(difficulty) {
        // 归纳推理题
        const questions = [
            {
                question: "观察以下数列：3, 6, 9, 12, 15, _____。根据规律，空缺处应填入什么数字？",
                options: ["17", "18", "21", "24"],
                correctAnswer: 1,
                explanation: "这个数列是等差数列，每项比前一项增加3。所以下一项是15 + 3 = 18。",
                hint: "观察每两个相邻数字之间的关系"
            },
            {
                question: "研究表明，在A城市的100个受访者中，95人每天刷牙两次。根据这一信息，以下哪项推断最合理？",
                options: [
                    "A城市的居民比其他城市的居民更注重口腔健康",
                    "A城市约95%的居民每天刷牙两次",
                    "不刷牙的人更容易得牙病",
                    "A城市的牙医数量少于其他城市"
                ],
                correctAnswer: 1,
                explanation: "这是一个从样本到总体的归纳推理。从100个人的样本中，我们可以合理推断城市人口中有大约95%的人每天刷牙两次。",
                hint: "从样本数据推断总体特征，但不要过度解读数据"
            },
            {
                question: "科学家发现，在实验的10000次试验中，某种药物对99.7%的患者有效。然而，在另一个实验中，这种药物仅对70%的患者有效。以下哪项是最合理的解释？",
                options: [
                    "第二个实验一定有设计缺陷",
                    "药物本身在两次实验间发生了变化",
                    "两个实验可能针对不同类型的患者或使用条件",
                    "第一个实验的结果是伪造的"
                ],
                correctAnswer: 2,
                explanation: "当看到两个实验结果有显著差异时，最合理的解释是两个实验的条件可能不同，例如患者群体、剂量或其他因素可能有差异。",
                hint: "考虑可能导致实验结果差异的合理因素"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generatePatternQuestion(difficulty) {
        // 模式识别题
        const questions = [
            {
                question: "下列形状序列的下一个应该是什么？○, □, △, ○, □, △, ○, ？",
                options: ["○", "□", "△", "◇"],
                correctAnswer: 1,
                explanation: "这是一个循环模式：○, □, △, ○, □, △,...。每三个形状为一个循环，所以下一个是□。",
                hint: "尝试找出重复出现的模式"
            },
            {
                question: "字母序列：A, C, F, J, ？。下一个字母是什么？",
                options: ["M", "N", "O", "P"],
                correctAnswer: 3,
                explanation: "这个序列的规律是字母间隔逐渐增加：A到C间隔2，C到F间隔3，F到J间隔4，所以J到下一个字母应该间隔5，即J+5=O。",
                hint: "分析序列中每对相邻元素之间的关系是否存在变化"
            },
            {
                question: "数列：1, 4, 9, 16, 25, ？。下一个数字是什么？",
                options: ["30", "36", "42", "49"],
                correctAnswer: 1,
                explanation: "这个数列是自然数的平方：1=1², 4=2², 9=3², 16=4², 25=5²。所以下一个数字是6²=36。",
                hint: "思考这些数字是否可以表示为某个函数的值"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generateAnalogyQuestion(difficulty) {
        // 类比推理题
        const questions = [
            {
                question: "书籍之于阅读，如同食物之于：",
                options: ["厨师", "餐厅", "食谱", "进食"],
                correctAnswer: 3,
                explanation: "书籍是被阅读的对象，类似地，食物是被进食的对象。",
                hint: "思考两对事物之间的关系是否相同"
            },
            {
                question: "医生之于病人，如同教师之于：",
                options: ["学校", "教育", "学生", "课本"],
                correctAnswer: 2,
                explanation: "医生为病人提供医疗服务，类似地，教师为学生提供教育服务。",
                hint: "这是一个角色关系的类比"
            },
            {
                question: "水之于鱼，如同空气之于：",
                options: ["飞机", "鸟", "云", "风"],
                correctAnswer: 1,
                explanation: "水是鱼生存的环境，类似地，空气是鸟生存的环境。",
                hint: "考虑生物与其生存环境的关系"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generateConditionalQuestion(difficulty) {
        // 条件推理题
        const questions = [
            {
                question: "如果今天是星期二，那么明天是星期三。今天不是星期二。那么：",
                options: [
                    "明天一定是星期三",
                    "明天一定不是星期三",
                    "明天可能是星期三",
                    "无法确定明天是什么日子"
                ],
                correctAnswer: 2,
                explanation: "这道题目使用了条件语句"如果P，那么Q"。当P为假时（今天不是星期二），Q的真假无法确定。因此，明天可能是星期三，也可能不是。",
                hint: "当条件不满足时，结论的真假是不确定的"
            },
            {
                question: "在某个游戏规则中：如果掷得是偶数，则玩家获胜。小明没有获胜。以下哪个陈述一定为真？",
                options: [
                    "小明掷得不是偶数",
                    "小明掷得是奇数",
                    "如果小明掷得是偶数，他就会获胜",
                    "小明掷得可能是偶数"
                ],
                correctAnswer: 0,
                explanation: "根据条件，如果掷得是偶数，则获胜。小明没有获胜，所以他掷得不是偶数。这是一个应用了逻辑中的否定后件规则（modus tollens）。",
                hint: "这是一个否定后件推理，形式为：如果P则Q，非Q，所以非P"
            },
            {
                question: "如果她学习努力，她就会通过考试。如果她通过考试，她就会得到奖学金。她没有得到奖学金。以下哪项是正确的推断？",
                options: [
                    "她没有学习努力",
                    "她通过了考试",
                    "她没有通过考试",
                    "她学习不够努力或没有通过考试"
                ],
                correctAnswer: 2,
                explanation: "根据条件：P→Q（如果学习努力，则通过考试），Q→R（如果通过考试，则得到奖学金）。已知非R（没有得到奖学金），应用否定后件规则可得非Q（没有通过考试）。",
                hint: "这涉及到条件语句的链式推理和否定后件规则"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generateFallacyQuestion(difficulty) {
        // 谬误识别题
        const questions = [
            {
                question: "以下哪一项是错误的归因推理？",
                options: [
                    "小明努力学习，所以他考试得了高分",
                    "全班同学都笑了，所以小红讲的笑话一定很好笑",
                    "下雨了，所以地面湿了",
                    "我今天戴了这条幸运手链，所以我赢了比赛"
                ],
                correctAnswer: 3,
                explanation: "这是一个"错误归因"谬误的例子。戴幸运手链和赢得比赛之间没有因果关系，但推理者错误地将比赛的胜利归因于手链。",
                hint: "寻找其中哪一项将结果错误地归因于某个因素，而这个因素实际上与结果无明显因果关系"
            },
            {
                question: "下面哪个是典型的"滑坡谬误"（认为一旦采取某行动，将导致一系列不可控的负面后果）？",
                options: [
                    "如果我们不减少碳排放，全球气温将会上升",
                    "如果我们允许学生上课使用手机，他们就会整天玩游戏，学习成绩会下降，将来找不到工作，最终会导致社会问题",
                    "研究表明，吸烟会增加患肺癌的风险",
                    "如果下雨，我们就不能在户外野餐"
                ],
                correctAnswer: 1,
                explanation: "滑坡谬误是将一个小事件夸大为一系列不合理的极端后果。选项B中，从允许使用手机到最终导致社会问题，是一个典型的滑坡谬误。",
                hint: "寻找那个推理过程中包含了一系列不必然相连的消极后果"
            },
            {
                question: "下列哪个是"人身攻击谬误"（Ad Hominem）的例子？",
                options: [
                    "他的理论有严重缺陷，因为它忽略了最新的实验数据",
                    "我们不能接受他的气候变化论点，因为他本人开的是高耗油的SUV",
                    "这栋建筑不安全，因为它的结构存在设计缺陷",
                    "疫苗是有效的，因为大量临床试验证明了这一点"
                ],
                correctAnswer: 1,
                explanation: "人身攻击谬误是针对论证者的个人特点而非论点本身进行批评。选项B攻击的是提出气候变化论点的人开高耗油的车，而不是评价论点本身的有效性。",
                hint: "找出哪个选项在反驳时针对的是说话人的个人特征，而不是他的论点"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generateCategoricalQuestion(difficulty) {
        // 范畴推理题
        const questions = [
            {
                question: "所有A都是B，所有B都是C。根据这些信息，以下哪个陈述一定为真？",
                options: [
                    "所有C都是A",
                    "所有A都是C",
                    "有些C不是A",
                    "有些A不是C"
                ],
                correctAnswer: 1,
                explanation: "根据传递性，如果所有A都是B，而所有B都是C，那么所有A都是C。",
                hint: "思考集合间的包含关系"
            },
            {
                question: "某大学有100名学生，其中60人学习数学，70人学习物理。以下哪一项一定为真？",
                options: [
                    "至少30人既学习数学又学习物理",
                    "恰好30人既学习数学又学习物理",
                    "至少10人既不学习数学也不学习物理",
                    "所有学习数学的人都学习物理"
                ],
                correctAnswer: 0,
                explanation: "根据集合论，如果集合A有60个元素，集合B有70个元素，且总共有100个元素，那么A∩B（两集合的交集）至少有60+70-100=30个元素。",
                hint: "使用集合论中的公式：|A∪B| = |A| + |B| - |A∩B|"
            },
            {
                question: "没有诚实的人是骗子。有些政治家是诚实的。根据这些信息，以下哪项为真？",
                options: [
                    "所有政治家都是骗子",
                    "有些政治家不是骗子",
                    "有些骗子是政治家",
                    "所有骗子都是政治家"
                ],
                correctAnswer: 1,
                explanation: "根据第一个前提，诚实的人和骗子是互斥的集合。第二个前提说有些政治家是诚实的，那么这些政治家就不是骗子，即有些政治家不是骗子。",
                hint: "首先理解"没有诚实的人是骗子"意味着诚实的人和骗子是两个不相交的集合"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    function generateSequenceQuestion(difficulty) {
        // 序列推理题
        const questions = [
            {
                question: "数列：2, 4, 8, 16, 32, ？。下一个数字是什么？",
                options: ["36", "48", "64", "128"],
                correctAnswer: 2,
                explanation: "这是一个等比数列，每项是前一项的2倍。所以下一项是32 × 2 = 64。",
                hint: "观察每个数字与前一个数字之间的关系"
            },
            {
                question: "数列：1, 3, 6, 10, 15, ？。下一个数字是什么？",
                options: ["21", "18", "25", "30"],
                correctAnswer: 0,
                explanation: "这是一个特殊的数列，每项是自然数的三角形数：1, 1+2=3, 1+2+3=6, 1+2+3+4=10, 1+2+3+4+5=15。所以下一项是1+2+3+4+5+6=21。",
                hint: "考虑这个数列是否可以表示为某种数学公式的值"
            },
            {
                question: "数列：0, 1, 1, 2, 3, 5, 8, ？。下一个数字是什么？",
                options: ["12", "13", "15", "21"],
                correctAnswer: 1,
                explanation: "这是著名的斐波那契数列，每一项都是前两项之和。所以下一项是5+8=13。",
                hint: "尝试找出数列中当前项与前面几项之间的关系"
            }
        ];
        
        const index = Math.min(Math.floor(difficulty * questions.length), questions.length - 1);
        return questions[index];
    }
    
    return gameLogic;
}

