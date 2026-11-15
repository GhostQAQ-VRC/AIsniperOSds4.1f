/* ==========================================================================
   AISniperOS — Steam client, store, library and VR companions
   A local Steam-like shell for CS2, VRChat and eight downloadable Canvas demos.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  const GAMES = [
    {
      id: 'cs2',
      app: 'cs2',
      title: 'Counter-Strike 2',
      cn: '反恐精英 2',
      type: 'game',
      installed: true,
      owned: true,
      previewOnly: false,
      art: 'art-cs2',
      coverKicker: 'VALVE',
      coverWord: 'CS2',
      coverSub: 'COUNTER-STRIKE 2',
      tags: ['第一人称射击', '竞技', '战术'],
      developer: 'Valve',
      publisher: 'Valve',
      release: '2023 年 9 月 27 日',
      rating: '特别好评',
      reviews: '8,421,994',
      price: '免费开玩',
      size: '32.8 GB',
      playtime: '126 小时',
      lastPlayed: '今天 21:12',
      launchLabel: '开始游戏',
      description: '《反恐精英 2》是 Counter-Strike 系列的下一代作品，基于 Source 2 引擎重构了地图、烟雾、光照与网络同步。',
      about: [
        '这是 AISniperOS 内置的低模训练靶场，保留了 CS2 的竞技节奏：移动、瞄准、射击、换弹与波次推进。',
        '点击开始后鼠标会被捕获。你可以使用 WASD 移动，左键射击，R 装填；如果鼠标锁定不可用，也可以用 Q/E 转向、方向键瞄准、空格射击。',
        '敌方为低模训练单位，不包含真实多人服务器。所有数据留在本机。'
      ],
      features: ['低模训练靶场', '波次敌人', '生命与弹药系统', '鼠标锁定与键盘回退'],
      requirements: ['AISniper M1 · 8 核', '24 GB 统一内存', 'WebGL 2', '支持鼠标锁定']
    },
    {
      id: 'vrchat',
      app: 'vrchat',
      title: 'VRChat',
      cn: '虚拟社交世界',
      type: 'game',
      installed: true,
      owned: true,
      previewOnly: false,
      vr: true,
      art: 'art-vrchat',
      coverKicker: 'VRChat',
      coverWord: 'VRChat',
      coverSub: 'SOCIAL VR',
      tags: ['VR', '社交', '沙盒'],
      developer: 'VRChat Inc.',
      publisher: 'VRChat Inc.',
      release: '2017 年 2 月 1 日',
      rating: '特别好评',
      reviews: '1,204,356',
      price: '免费开玩',
      size: '1.9 GB',
      playtime: '38 小时',
      lastPlayed: '今天 20:48',
      launchLabel: '进入 VRChat',
      description: '在 VRChat 中探索由社区创造的世界，换上喜欢的低模化身，和来自各地的人聊天、跳舞或只是安静地待着。',
      about: [
        '这个本地版本包含一个可完整行走的 Midnight Lounge 社交房间，以及另外两个可以即时切换氛围的世界。',
        '走近其他玩家后按 E 或点击交谈，可以打开本地聊天面板；选择快捷回复或输入消息，NPC 会继续和你对话。',
        '你可以更换化身颜色、切换世界、开启或静音麦克风，也可以让角色跳舞。这里没有云端服务器，社交对象均为本地模拟。'
      ],
      features: ['3 个可切换世界', '6 位可交谈玩家', '临时聊天面板', '化身颜色与手势'],
      requirements: ['AISniper M1 · 8 核', '24 GB 统一内存', 'WebGL 2', '推荐使用耳机']
    },
    {
      id: 'steamvr',
      app: 'steamvr',
      title: 'SteamVR',
      cn: 'VR 运行时',
      type: 'tool',
      installed: true,
      owned: true,
      previewOnly: false,
      vr: true,
      art: 'art-steamvr',
      coverKicker: 'VALVE',
      coverWord: 'STEAMVR',
      coverSub: 'VR RUNTIME',
      tags: ['VR', '工具', '运行时'],
      developer: 'Valve',
      publisher: 'Valve',
      release: '2016 年 4 月 5 日',
      rating: '特别好评',
      reviews: '38,460',
      price: '已拥有',
      size: '4.6 GB',
      playtime: '212 小时',
      lastPlayed: '今天 20:36',
      launchLabel: '打开运行时',
      description: 'SteamVR 是 Valve 的 PC VR 运行时，负责连接头显、基站、控制器与房间边界。',
      about: [
        'AISniperOS 内置的 SteamVR 控制台会模拟头显、两个 2.0 基站、Index 控制器与追踪器状态。',
        '你可以切换刷新率、调整房间规模、开启音频镜像或修改超级采样；这些设置只会影响本地界面与预览。'
      ],
      features: ['头显与基站状态', '90 / 120 / 144 Hz', '房间边界', '超级采样'],
      requirements: ['Valve Index 或兼容头显', '2 × 2.0 基站', 'AISniper M1 · 24 GB']
    },
    {
      id: 'ovrtk',
      app: 'ovrtk',
      title: 'OVR Toolkit',
      cn: 'VR 叠加层工具',
      type: 'tool',
      installed: true,
      owned: true,
      previewOnly: false,
      vr: true,
      art: 'art-ovrtk',
      coverKicker: 'OVR',
      coverWord: 'OVR',
      coverSub: 'TOOLKIT',
      tags: ['VR', '工具', '叠加层'],
      developer: 'OVR Toolkit',
      publisher: 'OVR Toolkit',
      release: '2021 年 11 月 17 日',
      rating: '好评如潮',
      reviews: '9,812',
      price: '已拥有',
      size: '186 MB',
      playtime: '74 小时',
      lastPlayed: '今天 20:14',
      launchLabel: '打开叠加层',
      description: '在 VR 中查看桌面、手腕时钟、通知与小窗口。OVR Toolkit 会把你的桌面变成一块可以随身携带的曲面屏幕。',
      about: [
        '这个本地模拟提供桌面叠加层、腕部叠加层、窗口抓取、位置与曲率调节。',
        '拖动滑块可以实时预览屏幕大小、曲率和透明度。所有控件都只影响当前本地场景。'
      ],
      features: ['曲面桌面叠加层', '腕部信息', '窗口抓取', '位置与曲率调节'],
      requirements: ['SteamVR', '任意兼容头显', 'AISniperOS 本地桌面']
    },
    {
      id: 'slimevr',
      app: 'slimevr',
      title: 'SlimeVR',
      cn: '全身追踪',
      type: 'tool',
      installed: true,
      owned: true,
      previewOnly: false,
      vr: true,
      art: 'art-slimevr',
      coverKicker: 'SLIMEVR',
      coverWord: 'SLIME',
      coverSub: 'FULL BODY',
      tags: ['VR', '工具', '追踪'],
      developer: 'SlimeVR',
      publisher: 'SlimeVR',
      release: '2022 年 7 月 9 日',
      rating: '特别好评',
      reviews: '12,744',
      price: '已拥有',
      size: '94 MB',
      playtime: '96 小时',
      lastPlayed: '今天 19:52',
      launchLabel: '打开追踪器',
      description: '用六个惯性追踪器把真实身体带进 VR。SlimeVR 支持全身姿态、漂移校正和自建追踪器。',
      about: [
        '这个本地模拟展示六个追踪器、骨骼预览、自动检测与校准进度。',
        '点击“开始校准”会播放完整的本地校准流程，完成后会显示姿态已锁定。'
      ],
      features: ['6 点全身追踪', '自动检测', '骨骼预览', '校准进度'],
      requirements: ['SteamVR', '6 × SlimeVR 追踪器', '2.4 GHz 无线接收器']
    },
    {
      id: 'alyx',
      app: 'steamdemo',
      demo: true,
      title: 'Half-Life: Alyx',
      cn: '半衰期：爱莉克斯',
      type: 'game',
      installed: false,
      owned: true,
      previewOnly: false,
      vr: true,
      art: 'art-alyx',
      coverKicker: 'VALVE',
      coverWord: 'HALF-LIFE',
      coverSub: 'ALYX',
      tags: ['VR', '冒险', '剧情'],
      developer: 'Valve',
      publisher: 'Valve',
      release: '2020 年 3 月 23 日',
      rating: '好评如潮',
      reviews: '108,321',
      price: '¥ 198',
      size: '67.4 GB',
      playtime: '尚未启动',
      lastPlayed: '',
      launchLabel: '开始游戏',
      description: '在 City 17 的故事缝隙里，Alyx Vance 与父亲一起对抗联合军。为 VR 设计的完整冒险。',
      about: [
        '这是 AISniperOS 内置的《半衰期：爱莉克斯》重力手套靶场演示。你会在 City 17 的联合军训练舱里，用重力手套击落漂浮的侦察无人机。',
        '鼠标瞄准，左键释放引力脉冲，R 换弹。按空格可以发动一次范围重力爆发，把周围的无人机全部拉向准星。',
        '命中会累积连击与分数；在 60 秒内击落 20 架无人机即可完成训练。下载安装后即可从游戏库直接进入。'
      ],
      features: ['重力手套射击', '60 秒靶场挑战', '连击计分', '可下载的本地演示'],
      requirements: ['VR 头显', 'SteamVR', 'Windows / Linux']
    },
    {
      id: 'dota2',
      app: 'steamdemo',
      demo: true,
      title: 'Dota 2',
      cn: '刀塔 2',
      type: 'game',
      installed: false,
      owned: true,
      previewOnly: false,
      art: 'art-dota2',
      coverKicker: 'VALVE',
      coverWord: 'DOTA 2',
      coverSub: 'DEFENSE OF THE ANCIENTS',
      tags: ['MOBA', '策略', '多人'],
      developer: 'Valve',
      publisher: 'Valve',
      release: '2013 年 7 月 9 日',
      rating: '特别好评',
      reviews: '2,091,772',
      price: '免费开玩',
      size: '54.8 GB',
      playtime: '尚未启动',
      lastPlayed: '',
      launchLabel: '开始游戏',
      description: '两个队伍，五条路线，一座远古遗迹。Dota 2 是深度与变化兼具的团队竞技游戏。',
      about: [
        '这是 AISniperOS 内置的 Dota 2 中路攻防演示。你会操控一名英雄，与己方小兵一起沿中路推进，摧毁敌方的远古遗迹。',
        'WASD 移动，左键攻击最近的敌人，Q 对光标位置释放范围法术，E 使用回春恢复生命。敌方防御塔和兵线都会反击。',
        '己方远古遗迹也有生命值。若它被摧毁，或者英雄阵亡后基地告急，这局就结束了。下载安装后即可游玩。'
      ],
      features: ['中路兵线攻防', '英雄技能与回城', '防御塔与远古遗迹', '可下载的本地演示'],
      requirements: ['AISniper M1 · 8 核', '16 GB 内存', '60 GB 可用空间']
    },
    {
      id: 'deadlock',
      app: 'steamdemo',
      demo: true,
      title: 'Deadlock',
      cn: '死锁',
      type: 'game',
      installed: false,
      owned: true,
      previewOnly: false,
      art: 'art-deadlock',
      coverKicker: 'VALVE',
      coverWord: 'DEADLOCK',
      coverSub: 'THIRD-PERSON HERO SHOOTER',
      tags: ['射击', 'MOBA', '早期测试'],
      developer: 'Valve',
      publisher: 'Valve',
      release: '即将推出',
      rating: '特别好评',
      reviews: '72,118',
      price: '免费开玩',
      size: '36.7 GB',
      playtime: '尚未启动',
      lastPlayed: '',
      launchLabel: '开始游戏',
      description: '在蒸汽朋克都市的街道上，六对六的英雄射击与兵线推进正在同时发生。',
      about: [
        '这是 AISniperOS 内置的 Deadlock 巷道遭遇战演示。你在一座蒸汽朋克街区的封锁区里迎战三波敌人。',
        'WASD 移动，鼠标瞄准，按住左键射击，Shift 冲刺，E 释放脉冲冲击。掩体会挡住子弹，也会挡住敌人的射界。',
        '清空三波敌人即可完成演示。生命归零时可以立即重新开始。下载安装后即可游玩。'
      ],
      features: ['俯视角英雄射击', '冲刺与脉冲技能', '掩体与敌人弹道', '可下载的本地演示'],
      requirements: ['AISniper M1 · 8 核', '16 GB 内存', '40 GB 可用空间']
    },
    {
      id: 'rust',
      app: 'steamdemo',
      demo: true,
      title: 'Rust',
      cn: '腐蚀',
      type: 'game',
      installed: false,
      owned: true,
      previewOnly: false,
      art: 'art-rust',
      coverKicker: 'FACE PUNCH',
      coverWord: 'RUST',
      coverSub: 'SURVIVE THE NIGHT',
      tags: ['生存', '建造', '多人'],
      developer: 'Facepunch Studios',
      publisher: 'Facepunch Studios',
      release: '2018 年 2 月 8 日',
      rating: '特别好评',
      reviews: '912,480',
      price: '¥ 116',
      size: '41.6 GB',
      playtime: '尚未启动',
      lastPlayed: '',
      launchLabel: '开始游戏',
      description: '醒来时只有一块石头和一把火把。采集、建造、结盟，然后在夜晚活下来。',
      about: [
        '这是 AISniperOS 内置的 Rust 第一夜生存演示。你在一块狭长的荒岛上采集木材与石料，并在入夜前点亮篝火。',
        'WASD 移动，靠近资源节点按 E 采集，F 在脚下放置篝火（需要 10 木材和 5 石料），左键挥动石斧攻击。',
        '白天会逐渐变成夜晚，野狼会从黑暗中出现。篝火会持续灼烧靠近的野兽，并在半径内缓慢恢复你的生命。撑到黎明即可生存。'
      ],
      features: ['资源采集与建造', '昼夜循环', '野兽围攻', '篝火生存机制', '可下载的本地演示'],
      requirements: ['AISniper M1 · 8 核', '16 GB 内存', '45 GB 可用空间']
    },
    {
      id: 'eldenring',
      app: 'steamdemo',
      demo: true,
      title: 'ELDEN RING',
      cn: '艾尔登法环',
      type: 'game',
      installed: false,
      owned: true,
      previewOnly: false,
      art: 'art-elden',
      coverKicker: 'FROMSOFTWARE',
      coverWord: 'ELDEN',
      coverSub: 'RING',
      tags: ['动作角色扮演', '开放世界', '暗黑幻想'],
      developer: 'FromSoftware',
      publisher: 'Bandai Namco',
      release: '2022 年 2 月 25 日',
      rating: '好评如潮',
      reviews: '841,970',
      price: '¥ 298',
      size: '60.3 GB',
      playtime: '尚未启动',
      lastPlayed: '',
      launchLabel: '开始游戏',
      description: '在黄金律法破碎后的交界地，成为褪色者，寻找艾尔登法环。',
      about: [
        '这是 AISniperOS 内置的 ELDEN RING 首领决斗演示。褪色者将在黄金雾门前挑战“恶兆守卫”。',
        'WASD 移动，鼠标决定朝向，左键挥剑，Shift 翻滚闪避（有无敌帧），E 饮用红露滴圣杯瓶回复生命。',
        '观察首领抬手与地面预警，在攻击落点之外翻滚。击败恶兆守卫即可完成试炼，死亡可以立即重试。'
      ],
      features: ['首领战与阶段变化', '翻滚无敌帧', '圣杯瓶回复', '黄金雾门场景', '可下载的本地演示'],
      requirements: ['AISniper M1 · 8 核', '16 GB 内存', '60 GB 可用空间'],
      dlc: [
        { id: 'shadow-of-the-erdtree', mode: 'dlc', title: 'Shadow of the Erdtree', cn: '黄金树幽影', date: '2024-06-21', release: '2024 年 6 月 21 日', size: '16.2 GB', installed: false, owned: true, accent: '#e2c277', description: '追随米凯拉的足迹，进入被黄金树阴影覆盖的幽影地。新的地图、新的首领与另一条通往神之门的路。' }
      ]
    },
    {
      id: 'cyberpunk',
      app: 'steamdemo',
      demo: true,
      title: 'Cyberpunk 2077',
      cn: '赛博朋克 2077',
      type: 'game',
      installed: false,
      owned: true,
      previewOnly: false,
      art: 'art-cyberpunk',
      coverKicker: 'CD PROJEKT RED',
      coverWord: 'CYBERPUNK',
      coverSub: '2077',
      tags: ['角色扮演', '开放世界', '科幻'],
      developer: 'CD Projekt Red',
      publisher: 'CD Projekt',
      release: '2020 年 12 月 10 日',
      rating: '特别好评',
      reviews: '764,214',
      price: '¥ 298',
      size: '76.8 GB',
      playtime: '尚未启动',
      lastPlayed: '',
      launchLabel: '开始游戏',
      description: '在夜之城，你决定自己成为谁。义体、街头、公司与自由，全都混在霓虹雨里。',
      about: [
        '这是 AISniperOS 内置的 Cyberpunk 2077 破解协议演示。你正在远程接入荒坂的本地子网，用代码矩阵撬开三层 ICE。',
        '点击代码格写入缓冲区。第一次可以从任意列选择；之后必须在同一列或同一行交替选择，和桌面的破解小游戏一致。',
        '让右侧的目标序列按顺序出现在缓冲区中即可解锁。注意信号缓冲只有 8 格，超时或写满都会导致连接断开。'
      ],
      features: ['ICE 代码矩阵', '多组序列破解', '缓冲区管理', '霓虹夜之城界面', '可下载的本地演示'],
      requirements: ['AISniper M1 · 8 核', '16 GB 内存', '80 GB 可用空间'],
      dlc: [
        { id: 'phantom-liberty', mode: 'dlc', title: 'Phantom Liberty', cn: '往日之影', date: '2023-09-26', release: '2023 年 9 月 26 日', size: '18.7 GB', installed: false, owned: true, accent: '#f0d24d', description: '狗镇的天空从不安静。接受新美国总统的委托，进入一个由谎言、间谍与义体交易组成的禁区。' }
      ]
    },
    {
      id: 'destiny2',
      app: 'steamdemo',
      demo: true,
      title: 'Destiny 2',
      cn: '命运 2 · 猩红战争',
      type: 'game',
      installed: true,
      owned: true,
      previewOnly: false,
      art: 'art-destiny2',
      coverKicker: 'BUNGIE',
      coverWord: 'DESTINY 2',
      coverSub: 'THE RED WAR',
      tags: ['科幻射击', '战役', '在线合作'],
      developer: 'Bungie',
      publisher: 'Bungie',
      release: '2017 年 10 月 24 日',
      rating: '特别好评',
      reviews: '612,480',
      price: '免费开玩',
      size: '118.4 GB',
      playtime: '42 小时',
      lastPlayed: '今天 19:20',
      launchLabel: '开始战役',
      description: '红色军团夺走了最后的城市与光能。作为一名失去光能的守护者，你要穿过猩红战争的四道战线，最终在 Ghaul 面前夺回属于自己的力量。',
      about: [
        '这是 AISniperOS 内置的《命运 2》目的地演示。启动后先进入 Director 星图：点击地球、水星、火星、纷争海岸、月球、木卫二、王座世界、海王星或苍白之心，即可打开对应剧情线。',
        '启动后先播放命运 2 式加载页，然后选择猎人 / 术士 / 泰坦；三个职业的六条副职业分支拥有各自独立的超能、手雷、近战和职业技能，猎人的 V 是闪避，术士是治愈裂痕，泰坦是集结路障；C 近战也会按职业与元素生成飞刀、烟雾弹、拳击、冰矛、虚空投射或冰法杖冻结；超能同样按职业与元素区分，沉默狂啸会留下持续 30 秒的冷冻冰风暴。棱镜可点击技能节点选择槽位，再从下方来源芯片自由组合其他分支。猩红战争以“归乡、火花、1AU、选择、猩红终局”五章展开；10 个 DLC 目的地包含 4—9 个连续剧情节点。进入战斗后使用命运 2 式 HUD；1/2/3 号位可掉落多种武器，2/3 号位带烈日/电弧/虚空/冰影/缚丝元素并改变弹丸颜色，榴弹/火箭/线性融合拥有独立弹道；武器有 3 条词条，护甲只有属性没有词条。按 E 拾取，按 F1 打开角色/技能/背包界面；初始光等 0，新装备按当前光等 +10 生成。Q 手雷、C 近战、V 职业技能、F 超能；六条分支会实际改变手雷与超能效果。每个星球主线完成后解锁对应突袭；突袭包含 3—5 个连续关卡，开门关无首领，后续每关都有专属机制与首领，必须先完成机制解除护盾才能输出，击败当前首领后才会推进到下一关。职业、副职业、棱镜配置、战役/DLC 进度、突袭通关和装备光等会自动保存到浏览器 localStorage，刷新或重开页面后恢复；在 Director 按 C 可重新选择职业。金星「伊什塔尔深谷」与黑洞「终末视界」也已加入：黑洞目的地使用 SVG 吸积盘、光子环和引力透镜弧，并叠加旋转吸积流、轨道粒子与空间扭曲特效。武器带 AA 瞄准吸附值，但只有准星靠近敌人时才会触发；范围手雷、榴弹、火箭与 AOE 超能不吸附、严格落在准星位置。战斗 HUD 恢复瞄准准星，靠近敌人时准星变金并显示 AA 反馈；冰影超能会全屏追踪敌人移动。主角使用按职业与副职业区分的 SVG 立绘，衣服与护甲边缘会按当前分支发光；游戏使用本地 Web Audio 合成音效，按 M 开关。棱镜职业拥有独立的光能/暗影双端超凡条，满格后长按 V 进入超凡，技能冷却大幅加速，手雷与近战变成同时造成光暗伤害的超凡形态。Director 星图加入会被黑洞吸走的多层动态星尘，地球与所有行星都会自转。PvE 关卡会随机生成弹药补给箱，敌人全部使用按种族区分的 SVG 矢量美术。',
        'WASD 移动，鼠标瞄准，按住左键射击，按 1/2/3 切换动能、能量与威能武器，R 换弹，Q 投掷手雷，C 近战，V 使用职业技能，F 在充能完成后释放超能，E 拾取装备。HUD 右下会显示三把武器槽、当前武器弹药与后备弹药，以及方形技能图标和充能条。击杀会累积光能。每个目的地都有独立的天空、地貌、敌对种族和首领。',
        '这是本地 Canvas 2D 低模战役，不包含《命运 2》官方素材、地图资产或联网服务。所有内容都在本机运行。'
      ],
      features: ['Director 星球剧情星图', '猎人 / 术士 / 泰坦', '15 个目的地 · 10 个 DLC', '23 种武器 · 元素弹药 · 三武器槽', '棱镜自由组合 · 武器词条', '本地自动存档 · 多关卡突袭 · 全屏游戏模式 · 先锋打击'],
      requirements: ['AISniper M1 · 8 核', '24 GB 统一内存', '120 GB 可用空间'],
      dlc: [
        {
          id: 'curse-of-osiris',
          mode: 'curse',
          title: 'Curse of Osiris',
          cn: '冥王诅咒',
          date: '2017-12-05',
          release: '2017 年 12 月 5 日',
          size: '6.2 GB',
          installed: true,
          owned: true,
          accent: '#e0b96b',
          description: '水星的玻璃旷野与无尽森林再次打开。追随奥西里斯的足迹，穿过 Vex 模拟出的过去与未来，关闭失控的预言机。'
        },
        {
          id: 'warmind',
          mode: 'warmind',
          title: 'Warmind',
          cn: '战争智能',
          date: '2018-05-08',
          release: '2018 年 5 月 8 日',
          size: '7.1 GB',
          installed: true,
          owned: true,
          accent: '#79c7e8',
          description: '火星·赫拉斯盆地的冰原下，沉睡的战争智能拉斯普廷苏醒。Hive 虫群正在挖掘它的核心，守住极地武库。'
        },
        {
          id: 'forsaken',
          mode: 'forsaken',
          title: 'Forsaken',
          cn: '遗落之族',
          date: '2018-09-04',
          release: '2018 年 9 月 4 日',
          size: '14.6 GB',
          installed: true,
          owned: true,
          accent: '#d5a276',
          description: '纷争海岸的长老监狱越狱带走了 Cayde-6。踏入纷争海岸，追踪八位男爵，最后在觉醒者女王面前作出选择。'
        },
        {
          id: 'shadowkeep',
          mode: 'shadowkeep',
          title: 'Shadowkeep',
          cn: '暗影要塞',
          date: '2019-10-01',
          release: '2019 年 10 月 1 日',
          size: '11.4 GB',
          installed: false,
          owned: true,
          accent: '#b8a7c8',
          description: '月球·风暴之洋上出现了来自过去的幽灵。回到血色战争旧址，在噩梦与记忆之间追查金字塔的阴影。'
        },
        {
          id: 'beyond-light',
          mode: 'beyond-light',
          title: 'Beyond Light',
          cn: '凌光之刻',
          date: '2020-11-10',
          release: '2020 年 11 月 10 日',
          size: '12.8 GB',
          installed: false,
          owned: true,
          accent: '#a9c8e8',
          description: '木卫二·拉斯摩尔的混沌，冰层下封存着一种不属于光的力量。直面埃拉米斯，掌握停滞，或者被它吞没。'
        },
        {
          id: 'witch-queen',
          mode: 'witch-queen',
          title: 'The Witch Queen',
          cn: '邪姬魅影',
          date: '2022-02-22',
          release: '2022 年 2 月 22 日',
          size: '15.2 GB',
          installed: false,
          owned: true,
          accent: '#b9e38e',
          description: '萨瓦图恩用光能编织了谎言。进入她的王座世界，在真相与恐惧之间寻找那把不存在于任何地方的剑。'
        },
        {
          id: 'lightfall',
          mode: 'lightfall',
          title: 'Lightfall',
          cn: '光陨之秋',
          date: '2023-02-28',
          release: '2023 年 2 月 28 日',
          size: '16.7 GB',
          installed: false,
          owned: true,
          accent: '#e7a5ce',
          description: '内欧姆那的城市正在被见证者抹去。穿过霓虹街区，与云层中的暗影正面交锋。'
        },
        {
          id: 'final-shape',
          mode: 'final-shape',
          title: 'The Final Shape',
          cn: '终焉之形',
          date: '2024-06-04',
          release: '2024 年 6 月 4 日',
          size: '18.1 GB',
          installed: false,
          owned: true,
          accent: '#f0d78f',
          description: '苍白之心裂开一条通往终点的路。与队友一起进入苍白之心，结束光与暗的长久战争。'
        },
        {
          id: 'edge-of-fate',
          mode: 'edge-of-fate',
          title: 'The Edge of Fate',
          cn: '宿命边缘',
          date: '2025-07-15',
          release: '2025 年 7 月 15 日',
          size: '22.4 GB',
          installed: true,
          owned: true,
          accent: '#c79cff',
          description: '开普勒被暗物质与奇异点笼罩。前往中央学院，追踪那束来自太阳系边缘的信号，面对 House of Exile、Vex 与 Hive 的争夺。'
        },
        {
          id: 'renegades',
          mode: 'renegades',
          title: 'Renegades',
          cn: '反叛',
          date: '2025-12-02',
          release: '2025 年 12 月 2 日',
          size: '19.8 GB',
          installed: true,
          owned: true,
          accent: '#e2a35f',
          description: '塔尔西斯阔域成为火星边疆。Barant Imperium、Pikers 与 Vex 争夺废土，穿过巴扎、堡垒与帝国火线，夺回属于自己的荣耀。'
        }
      ]
    },
    {
      id: 'division',
      app: 'steamdemo',
      demo: true,
      title: "Tom Clancy's The Division",
      cn: '全境封锁',
      type: 'game',
      installed: true,
      owned: true,
      previewOnly: false,
      art: 'art-division',
      coverKicker: 'UBISOFT',
      coverWord: 'THE DIVISION',
      coverSub: 'AGENT ORIGINS',
      tags: ['第三人称射击', '合作', '装备驱动'],
      developer: 'Massive Entertainment',
      publisher: 'Ubisoft',
      release: '2016 年 3 月 8 日',
      rating: '特别好评',
      reviews: '386,240',
      price: '¥ 148',
      size: '74.6 GB',
      playtime: '18 小时',
      lastPlayed: '今天 18:05',
      launchLabel: '开始行动',
      description: '一场黑色星期五的生化袭击让纽约陷入瘫痪。作为国土战略局特工，你被唤醒去恢复秩序，或者至少让街道重新属于活着的人。',
      about: [
        '这是 AISniperOS 内置的《全境封锁》曼哈顿封锁区演示。你将被投放到麦迪逊广场附近，清理三波暴徒并击败一名叛变特工。',
        'WASD 移动，鼠标瞄准，按住左键射击，R 换弹。靠近车辆、路障和沙袋可以获得掩体减伤；F 使用医疗包，E 部署自动炮塔，Q 使用脉冲标记敌人。',
        '这是一段本地 Canvas 2D 低模行动，不连接育碧服务器，也没有真实装备掉落。所有敌人都由本机模拟。'
      ],
      features: ['雪夜曼哈顿街区', '掩体射击与换弹', '自动炮塔与脉冲', '叛变特工首领战', '可下载的本地演示'],
      requirements: ['AISniper M1 · 8 核', '16 GB 内存', '80 GB 可用空间'],
      dlc: [
        { id: 'underground', mode: 'dlc', title: 'Underground', cn: '地下世界', date: '2016-06-28', release: '2016 年 6 月 28 日', size: '8.2 GB', installed: true, owned: true, accent: '#e0a259', description: '进入纽约地下废弃的隧道与维护通道，在随机生成的行动中清理暴徒与净化者。' },
        { id: 'survival', mode: 'dlc', title: 'Survival', cn: '生存', date: '2016-11-22', release: '2016 年 11 月 22 日', size: '7.4 GB', installed: true, owned: true, accent: '#93c6e4', description: '暴风雪切断了城市。没有装备、没有地图，只有寒冷、感染和另一名特工。' },
        { id: 'last-stand', mode: 'dlc', title: 'Last Stand', cn: '背水一战', date: '2017-02-28', release: '2017 年 2 月 28 日', size: '5.6 GB', installed: false, owned: true, accent: '#e56f5b', description: '在暗区中争夺数据核心，守住最后的传输节点。' },
        { id: 'warlords', mode: 'dlc', title: 'Warlords of New York', cn: '纽约军阀', date: '2020-03-03', release: '2020 年 3 月 3 日', size: '26.8 GB', installed: false, owned: true, accent: '#e4b167', description: '追踪叛变特工亚伦·基纳，前往曼哈顿下城，面对四名军阀与一场仍未结束的战争。' }
      ]
    }
  ];

  const FRIENDS = [
    { id: 'mira', name: 'Mira Chen', status: '游戏中 · VRChat', color: '#f3a35c', game: 'VRChat' },
    { id: 'kai', name: 'Kai', status: '在线', color: '#8d7dff', game: 'Counter-Strike 2' },
    { id: 'nova', name: 'Nova', status: '在 VRChat 中', color: '#63d9c4', game: 'VRChat' },
    { id: 'iris', name: 'Iris', status: '在线', color: '#a8c2ff', game: 'SlimeVR' },
    { id: 'rowan', name: 'Rowan', status: '离线 · 3 小时前', color: '#bbbbbb', game: '' },
    { id: 'pixel', name: 'Pixel', status: '在线', color: '#ff93b6', game: 'SteamVR' }
  ];

  const INITIAL_DOWNLOADS = [
    { id: 'vrchat-update', app: 'vrchat', title: 'VRChat 内容更新', kind: '更新', progress: 64, status: 'paused', size: '1.4 GB / 2.1 GB', speed: '—' },
    { id: 'cs2', app: 'cs2', title: 'Counter-Strike 2', kind: '游戏', progress: 100, status: 'complete', size: '32.8 GB', speed: '已完成' },
    { id: 'steamvr', app: 'steamvr', title: 'SteamVR 运行时', kind: '工具', progress: 100, status: 'complete', size: '4.6 GB', speed: '已完成' }
  ];

  const STEAM_SAVE_KEY = 'aisniper.steam.library.v1';

  function loadSteamLibraryState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STEAM_SAVE_KEY) || 'null');
      if (!saved || saved.version !== 1) return;
      if (Array.isArray(saved.games)) {
        saved.games.forEach((entry) => {
          const game = GAMES.find((item) => item.id === entry?.id);
          if (!game) return;
          if (entry.installed) game.installed = true;
          if (entry.owned) game.owned = true;
        });
      }
      if (Array.isArray(saved.dlc)) {
        saved.dlc.forEach((entry) => {
          const game = GAMES.find((item) => item.id === entry?.gameId);
          const dlc = game?.dlc?.find((item) => item.id === entry?.id);
          if (dlc && entry.installed) dlc.installed = true;
        });
      }
    } catch (error) {
      /* Local storage can be unavailable for file:// origins. */
    }
  }

  function saveSteamLibraryState() {
    try {
      localStorage.setItem(STEAM_SAVE_KEY, JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        games: GAMES.map((game) => ({ id: game.id, installed: Boolean(game.installed), owned: Boolean(game.owned) })),
        dlc: GAMES.flatMap((game) => (game.dlc || []).map((dlc) => ({
          gameId: game.id, id: dlc.id, installed: Boolean(dlc.installed)
        })))
      }));
    } catch (error) {
      /* Ignore unavailable local storage. */
    }
  }

  function gameById(idOrApp) {
    return GAMES.find((game) => game.id === idOrApp || game.app === idOrApp) || null;
  }

  function init(host = {}) {
    const root = document.getElementById('steamRoot');
    if (!root) return null;
    loadSteamLibraryState();
    const state = {
      page: 'store',
      query: '',
      libraryFilter: 'all',
      detailFrom: 'store',
      selectedId: null,
      wishlist: new Set(),
      downloads: INITIAL_DOWNLOADS.map((download) => ({ ...download })),
      activeGameId: null
    };
    let downloadTimer = null;
    let cs2Game = null;
    let vrchatGame = null;
    let steamMiniGame = null;
    let steamVRUI = null;
    let ovrUI = null;
    let slimeUI = null;

    const account = () => host.getAccount?.() || { name: 'Sniper', level: 42, status: '在线', wallet: '¥ 248.00' };
    const selectedGame = () => gameById(state.selectedId);
    const installedGames = () => GAMES.filter((game) => game.installed);
    const wishlistGames = () => GAMES.filter((game) => state.wishlist.has(game.id));
    const activeDownloads = () => state.downloads.filter((download) => download.status !== 'complete');
    const downloadFor = (game) => state.downloads.find((download) => download.gameId === game?.id && !download.dlcId);
    const dlcDownloadFor = (game, dlc) => state.downloads.find((download) => download.gameId === game?.id && download.dlcId === dlc?.id);
    const findDlc = (gameId, dlcId) => gameById(gameId)?.dlc?.find((item) => item.id === dlcId) || null;
    const isRunning = (game) => {
      if (!game?.app) return false;
      const win = document.getElementById(`window-${game.app}`);
      const open = Boolean(win && win.classList.contains('is-open') && !win.classList.contains('is-minimizing'));
      if (!open) return false;
      if (game.app === 'steamdemo') return state.activeGameId === game.id;
      return true;
    };

    function gameStatus(game) {
      if (game.installed) return '已安装';
      const download = downloadFor(game);
      if (download) {
        if (download.status === 'downloading') return `下载 ${Math.round(download.progress)}%`;
        if (download.status === 'queued') return '排队中';
        if (download.status === 'paused') return '下载已暂停';
      }
      return game.demo ? '可下载' : '未安装';
    }

    function cover(game, extra = '') {
      return `<div class="steam-cover ${game.art} ${extra}">
        <span class="steam-cover-kicker">${escapeHTML(game.coverKicker || 'STEAM')}</span>
        <b>${escapeHTML(game.coverWord || game.title)}</b>
        <i>${escapeHTML(game.coverSub || game.cn)}</i>
        <em></em>
      </div>`;
    }

    function tags(game) {
      return game.tags.slice(0, 3).map((tag) => `<span>${escapeHTML(tag)}</span>`).join('');
    }

    function navItem(page, label, icon = '') {
      const active = page === 'detail' ? state.page === 'detail' : state.page === page;
      return `<button class="steam-tab${active ? ' is-active' : ''}" data-steam-nav="${page}">${icon}<span>${label}</span></button>`;
    }

    function shell(content) {
      const user = account();
      const activePage = state.page === 'detail' ? state.detailFrom : state.page;
      const downloadCount = activeDownloads().length;
      return `<div class="steam-shell">
        <header class="steam-topbar">
          <button class="steam-brand" data-steam-nav="store" aria-label="Steam 商店">
            <span class="steam-brand-mark"><svg viewBox="0 0 64 64"><use href="#app-steam"></use></svg></span>
            <span class="steam-brand-copy"><b>STEAM</b><small>LOCAL CLIENT</small></span>
          </button>
          <nav class="steam-tabs" aria-label="Steam 导航">
            ${navItem('store', '商店')}
            ${navItem('library', '库')}
            ${navItem('dlc', 'DLC')}
            ${navItem('vr', 'VR')}
            ${navItem('community', '社区')}
            ${navItem('downloads', '下载')}
          </nav>
          <div class="steam-top-actions">
            <form class="steam-search" data-steam-search-form>
              <svg viewBox="0 0 24 24"><use href="#i-search"></use></svg>
              <input type="search" value="${escapeHTML(state.query)}" placeholder="搜索 Steam" autocomplete="off" aria-label="搜索 Steam">
            </form>
            <button class="steam-icon-btn steam-wishlist-btn" data-steam-nav="wishlist" aria-label="愿望单">
              <svg viewBox="0 0 24 24"><use href="#i-star"></use></svg>${state.wishlist.size ? `<i>${state.wishlist.size}</i>` : ''}
            </button>
            <button class="steam-icon-btn steam-downloads-btn" data-steam-nav="downloads" aria-label="下载管理器">
              <svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>${downloadCount ? `<i data-steam-download-badge>${downloadCount}</i>` : ''}
            </button>
            <button class="steam-user-button" data-steam-nav="profile">
              <span class="steam-avatar">S</span><span><b>${escapeHTML(user.name)}</b><small><i></i>${escapeHTML(user.status || '在线')}</small></span>
            </button>
          </div>
        </header>
        <div class="steam-body" data-steam-page="${activePage}">${content}</div>
        <footer class="steam-footer">
          <span class="steam-footer-user"><i></i>${escapeHTML(user.name)} 在线</span>
          <span><svg viewBox="0 0 24 24"><use href="#i-user"></use></svg> 8 位好友在线</span>
          <span><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg> <b data-steam-download-count>${activeDownloads().length}</b> 项下载</span>
          <span class="steam-footer-version">Steam · AISniperOS 26.1.4</span>
        </footer>
      </div>`;
    }

    function render() {
      const content = state.page === 'store' ? storePage()
        : state.page === 'library' ? libraryPage()
          : state.page === 'dlc' ? dlcPage()
            : state.page === 'vr' ? vrPage()
              : state.page === 'community' ? communityPage()
                : state.page === 'downloads' ? downloadsPage()
                  : state.page === 'wishlist' ? wishlistPage()
                    : state.page === 'profile' ? profilePage()
                      : state.page === 'search' ? searchPage()
                        : state.page === 'detail' ? detailPage()
                          : storePage();
      root.innerHTML = shell(content);
      updateDownloadBadge();
    }

    function navigate(page) {
      if (!['store', 'library', 'dlc', 'vr', 'community', 'downloads', 'wishlist', 'profile', 'search', 'detail'].includes(page)) return;
      if (page === 'search') page = 'store';
      state.page = page;
      if (page !== 'search' && page !== 'detail') state.query = '';
      if (page === 'store') state.detailFrom = 'store';
      render();
      const main = $('.steam-body', root);
      if (main) main.scrollTop = 0;
    }

    function openDetail(id) {
      const game = gameById(id);
      if (!game) return;
      if (state.page !== 'detail') state.detailFrom = state.page;
      state.selectedId = game.id;
      state.page = 'detail';
      render();
      const main = $('.steam-body', root);
      if (main) main.scrollTop = 0;
    }

    function wishlistButton(game, extraClass = '') {
      const active = state.wishlist.has(game.id);
      return `<button class="steam-btn secondary ${active ? 'is-wishlisted' : ''} ${extraClass}" data-steam-action="wishlist" data-game-id="${game.id}"><svg viewBox="0 0 24 24"><use href="#i-star"></use></svg>${active ? '已在愿望单' : '添加到愿望单'}</button>`;
    }

    function detailNote(game) {
      if (game.installed) return `已安装 · ${escapeHTML(game.size)} · ${game.lastPlayed ? `最近游玩 ${escapeHTML(game.lastPlayed)}` : '已完成本地安装'}`;
      const download = downloadFor(game);
      if (download) {
        if (download.status === 'downloading') return `正在下载 · ${Math.round(download.progress)}% · ${escapeHTML(download.speed || '本地镜像')}`;
        if (download.status === 'queued') return '已加入下载队列 · 等待当前任务完成';
        if (download.status === 'paused') return '下载已暂停 · 点击“继续下载”恢复';
      }
      if (game.demo) return '已入库 · 下载安装后即可游玩本地演示';
      return '尚未安装';
    }

    function primaryButton(game) {
      if (game.demo && !game.installed) {
        const download = downloadFor(game);
        if (download && (download.status === 'downloading' || download.status === 'queued')) {
          const label = download.status === 'queued' ? '排队等待下载' : `<span data-steam-install-progress="${game.id}">正在下载 ${Math.round(download.progress)}%</span>`;
          return `<button class="steam-btn primary is-downloading" data-steam-action="show-downloads" data-game-id="${game.id}"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>${label}</button>`;
        }
        if (download && download.status === 'paused') {
          return `<button class="steam-btn primary" data-steam-action="install" data-game-id="${game.id}"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>继续下载</button>`;
        }
        return `<button class="steam-btn primary" data-steam-action="install" data-game-id="${game.id}"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>下载并安装</button>`;
      }
      return `<button class="steam-btn primary" data-steam-action="launch" data-game-id="${game.id}" data-steam-running-label="${game.id}">${isRunning(game) ? '正在运行' : escapeHTML(game.launchLabel || '开始游戏')}</button>`;
    }

    function dlcStatus(game, dlc) {
      if (dlc.installed) return 'installed';
      const download = dlcDownloadFor(game, dlc);
      if (download) return download.status;
      if (!game.installed) return 'base-missing';
      return 'available';
    }

    function dlcActionButton(game, dlc, compact = false) {
      const status = dlcStatus(game, dlc);
      if (status === 'installed') {
        return `<span class="steam-dlc-installed"><svg viewBox="0 0 24 24"><use href="#i-check"></use></svg>已安装</span>`;
      }
      if (status === 'downloading') {
        return `<button class="steam-btn secondary small is-downloading" data-steam-action="show-downloads"><span data-steam-dlc-progress="${game.id}:${dlc.id}">下载中</span></button>`;
      }
      if (status === 'queued') {
        return `<button class="steam-btn secondary small" data-steam-action="show-downloads">排队中</button>`;
      }
      if (status === 'paused') {
        return `<button class="steam-btn primary ${compact ? 'small' : ''}" data-steam-action="dlc-install" data-game-id="${game.id}" data-dlc-id="${dlc.id}">继续安装</button>`;
      }
      if (status === 'base-missing') {
        return `<button class="steam-btn secondary ${compact ? 'small' : ''}" data-steam-open="${game.id}">先安装本体</button>`;
      }
      return `<button class="steam-btn primary ${compact ? 'small' : ''}" data-steam-action="dlc-install" data-game-id="${game.id}" data-dlc-id="${dlc.id}"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>安装扩展</button>`;
    }

    function dlcInlineCard(game, dlc) {
      return `<article class="steam-dlc-inline-card" style="--dlc-accent:${escapeHTML(dlc.accent || '#e7b464')}">
        <div class="steam-dlc-inline-head"><span>${escapeHTML(dlc.release)}</span><b>${escapeHTML(dlc.title)}</b><small>${escapeHTML(dlc.cn)}</small></div>
        <p>${escapeHTML(dlc.description)}</p>
        <div class="steam-dlc-inline-foot"><span>扩展包 · ${escapeHTML(dlc.size)}</span>${dlcActionButton(game, dlc, true)}</div>
      </article>`;
    }

    function dlcSection(game) {
      if (!game.dlc?.length) return '';
      const installed = game.dlc.filter((dlc) => dlc.installed).length;
      return `<section class="steam-dlc-section">
        <div class="steam-section-title"><h2>DLC 与扩展</h2><span>${installed} / ${game.dlc.length} 已安装 · 按发行时间排列</span></div>
        <div class="steam-dlc-inline-list">${game.dlc.map((dlc) => dlcInlineCard(game, dlc)).join('')}</div>
      </section>`;
    }

    function dlcPage() {
      const entries = GAMES
        .flatMap((game) => (game.dlc || []).map((dlc) => ({ game, dlc })))
        .sort((a, b) => String(a.dlc.date).localeCompare(String(b.dlc.date)));
      const installed = entries.filter(({ dlc }) => dlc.installed).length;
      return `<div class="steam-dlc-page">
        <div class="steam-page-head"><div><span class="steam-eyebrow"><i></i>EXPANSION ARCHIVE</span><h1>DLC 与扩展</h1><p>按发行时间排列的扩展内容 · ${entries.length} 个条目 · ${installed} 个已安装</p></div><button class="steam-btn secondary" data-steam-nav="library"><svg viewBox="0 0 24 24"><use href="#i-grid"></use></svg>打开游戏库</button></div>
        <section class="steam-dlc-hero">
          <div><span class="steam-eyebrow"><i></i>THE LONG JOURNEY</span><h2>一段游戏，<em>不止一次抵达。</em></h2><p>从《全境封锁》的地下世界到《命运 2》的宿命边缘与反叛，按时序浏览所有已收录的扩展包。安装完成后，扩展会出现在对应游戏的 DLC 档案与游戏大厅中。</p></div>
          <div class="steam-dlc-hero-stats"><div><b>${entries.length}</b><span>扩展条目</span></div><div><b>${installed}</b><span>已安装</span></div><div><b>2016—2025</b><span>时间跨度</span></div></div>
        </section>
        <div class="steam-dlc-timeline">
          ${entries.map(({ game, dlc }, index) => `<article class="steam-dlc-timeline-card" data-steam-open="${game.id}" style="--dlc-accent:${escapeHTML(dlc.accent || '#e7b464')}">
            <div class="steam-dlc-year"><span>${escapeHTML(String(dlc.date).slice(0, 4))}</span><i></i><small>${String(index + 1).padStart(2, '0')}</small></div>
            <div class="steam-dlc-game-cover">${cover(game, 'cover-dlc')}</div>
            <div class="steam-dlc-copy"><span class="steam-dlc-game-name">${escapeHTML(game.title)}</span><h3>${escapeHTML(dlc.title)}<small>${escapeHTML(dlc.cn)}</small></h3><p>${escapeHTML(dlc.description)}</p><div class="steam-dlc-meta"><span>${escapeHTML(dlc.release)}</span><span>${escapeHTML(dlc.size)}</span><span>${escapeHTML(dlc.mode === 'dlc' ? '额外内容' : '剧情扩展')}</span></div></div>
            <div class="steam-dlc-action">${dlcActionButton(game, dlc)}</div>
          </article>`).join('')}
        </div>
      </div>`;
    }

    function storeCard(game) {
      const wish = state.wishlist.has(game.id);
      return `<article class="steam-store-card" data-steam-open="${game.id}" role="button" tabindex="0">
        <div class="steam-store-art">${cover(game, 'cover-card')}${wish ? '<span class="steam-wish-mark"><svg viewBox="0 0 24 24"><use href="#i-star"></use></svg></span>' : ''}</div>
        <div class="steam-store-meta"><b>${escapeHTML(game.title)}</b><span>${escapeHTML(game.tags[0])} · ${escapeHTML(game.tags[1] || (game.type === 'tool' ? '工具' : '游戏'))}</span><div><em>${escapeHTML(game.price)}</em><i data-steam-store-status="${game.id}">${escapeHTML(gameStatus(game))}</i></div></div>
      </article>`;
    }

    function storeShelf(title, subtitle, games, linkPage = null) {
      return `<section class="steam-shelf">
        <div class="steam-shelf-head"><div><h2>${title}</h2><span>${subtitle}</span></div>${linkPage ? `<button class="steam-text-link" data-steam-nav="${linkPage}">查看全部 <svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button>` : ''}</div>
        <div class="steam-card-row">${games.map(storeCard).join('')}</div>
      </section>`;
    }

    function storePage() {
      const featured = gameById('cs2');
      const installed = installedGames().slice(0, 4);
      const vrGames = GAMES.filter((game) => game.vr).slice(0, 5);
      const mainstream = GAMES.filter((game) => game.demo);
      return `<div class="steam-store-page">
        <section class="steam-hero">
          <div class="steam-hero-art">${cover(featured, 'cover-hero')}<div class="steam-hero-scan"></div></div>
          <div class="steam-hero-copy">
            <span class="steam-eyebrow"><i></i>本周焦点 · 免费开玩</span>
            <h1>COUNTER-STRIKE <b>2</b></h1>
            <p>下一代的竞技靶场已经上线。低模敌人正在穿越中路，准备好你的准星。</p>
            <div class="steam-hero-actions"><button class="steam-btn primary" data-steam-action="launch" data-game-id="cs2">开始游戏</button><button class="steam-btn ghost" data-steam-open="cs2">商店页面</button></div>
            <div class="steam-hero-stats"><span><b>特别好评</b> 8,421,994 条评测</span><span><b>32.8 GB</b> 已安装</span><span><b>今天</b> 最近游玩</span></div>
          </div>
        </section>
        <div class="steam-store-layout">
          <div class="steam-store-main">
            ${storeShelf('最近游玩', '继续上次的进度', installed, 'library')}
            ${storeShelf('VR 精选', '戴上头显，或者先把浏览器里的低模世界逛一圈', vrGames, 'vr')}
            ${storeShelf('热门游戏', '八款主流游戏均已开放本地下载与游玩', mainstream)}
            <div class="steam-wide-banner"><span class="steam-wide-mark"><svg viewBox="0 0 64 64"><use href="#app-steam"></use></svg></span><div><span>STEAM LAB</span><b>下载、安装，然后直接开玩。</b><p>商店里的每一款游戏都能进入下载队列；安装完成后会加入游戏库。</p></div><button class="steam-btn ghost" data-steam-nav="downloads">查看下载队列</button></div>
          </div>
          <aside class="steam-store-aside">
            <div class="steam-side-card steam-friends-card">
              <div class="steam-side-head"><span>好友动态</span><b>8 在线</b></div>
              ${FRIENDS.slice(0, 5).map((friend) => `<button class="steam-friend-row" data-steam-friend="${friend.id}"><span class="steam-avatar" style="--avatar:${friend.color}">${escapeHTML(friend.name[0])}</span><div><b>${escapeHTML(friend.name)}</b><small>${escapeHTML(friend.status)}</small></div><i class="${friend.status.includes('离线') ? 'offline' : ''}"></i></button>`).join('')}
              <button class="steam-side-link" data-steam-nav="community">查看社区 <svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button>
            </div>
            <div class="steam-side-card steam-wishlist-mini">
              <div class="steam-side-head"><span>愿望单</span><b>${state.wishlist.size}</b></div>
              ${wishlistGames().slice(0, 3).map((game) => `<button class="steam-mini-game" data-steam-open="${game.id}">${cover(game, 'cover-mini')}<div><b>${escapeHTML(game.title)}</b><small>${escapeHTML(game.price)}</small></div></button>`).join('') || '<p class="steam-empty-inline">愿望单是空的。</p>'}
              <button class="steam-side-link" data-steam-nav="wishlist">管理愿望单 <svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button>
            </div>
            <div class="steam-side-card steam-vr-mini">
              <div class="steam-side-head"><span>VR 状态</span><b>就绪</b></div>
              <div class="steam-headset-line"><span class="steam-headset-orb"><svg viewBox="0 0 24 24"><use href="#i-headset"></use></svg></span><div><b>Valve Index</b><small>120 Hz · 基站 2/2</small></div><i></i></div>
              <button class="steam-side-link" data-steam-action="launch" data-game-id="steamvr">打开 SteamVR <svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button>
            </div>
          </aside>
        </div>
      </div>`;
    }

    function libraryFilterCount(filter) {
      return installedGames().filter((game) => filter === 'all' || (filter === 'vr' ? game.vr : filter === 'tool' ? game.type === 'tool' : game.type === 'game')).length;
    }

    function libraryPage() {
      const filtered = installedGames().filter((game) => state.libraryFilter === 'all' || (state.libraryFilter === 'vr' ? game.vr : state.libraryFilter === 'tool' ? game.type === 'tool' : game.type === 'game'));
      const recent = gameById('cs2');
      return `<div class="steam-library-page">
        <div class="steam-page-head"><div><span class="steam-eyebrow"><i></i>YOUR LIBRARY</span><h1>游戏库</h1><p>已安装 ${installedGames().length} 项 · 最近启动 ${escapeHTML(recent?.lastPlayed || '今天')}</p></div><button class="steam-btn secondary" data-steam-nav="downloads"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg>下载管理</button></div>
        <section class="steam-library-hero"><div class="steam-library-hero-art">${cover(recent, 'cover-hero')}</div><div class="steam-library-hero-copy"><span class="steam-eyebrow"><i></i>继续游戏</span><h2>${escapeHTML(recent.title)}</h2><p>${escapeHTML(recent.description)}</p><div class="steam-library-hero-meta"><span>最近游玩 · ${escapeHTML(recent.lastPlayed)}</span><span>${escapeHTML(recent.playtime)}</span></div><div><button class="steam-btn primary" data-steam-action="launch" data-game-id="cs2" data-steam-running-label="cs2">${isRunning(recent) ? '正在运行' : '开始游戏'}</button><button class="steam-btn ghost" data-steam-open="cs2">查看详情</button></div></div></section>
        <div class="steam-library-tabs">${[['all', '全部'], ['game', '游戏'], ['vr', 'VR'], ['tool', '工具']].map(([key, label]) => `<button class="${state.libraryFilter === key ? 'is-active' : ''}" data-steam-filter="${key}">${label}<i>${libraryFilterCount(key)}</i></button>`).join('')}</div>
        <div class="steam-library-grid">${filtered.map((game) => libraryCard(game)).join('')}</div>
        ${filtered.length === 0 ? '<div class="steam-empty-state"><svg viewBox="0 0 24 24"><use href="#i-grid"></use></svg><b>这里还没有项目。</b><span>切换筛选器，或前往商店看看。</span></div>' : ''}
      </div>`;
    }

    function libraryCard(game) {
      const running = isRunning(game);
      return `<article class="steam-library-card${running ? ' is-running' : ''}" data-steam-open="${game.id}">
        <button class="steam-library-art" data-steam-open="${game.id}" aria-label="查看 ${game.title} 详情">${cover(game, 'cover-library')}<span class="steam-library-type">${game.type === 'tool' ? '工具' : game.vr ? 'VR' : '游戏'}</span>${running ? '<span class="steam-running-pill"><i></i>运行中</span>' : ''}</button>
        <div class="steam-library-info"><div><b>${escapeHTML(game.title)}</b><span>${escapeHTML(game.lastPlayed || '未启动')}</span></div><button class="steam-play-mini" data-steam-action="launch" data-game-id="${game.id}" data-steam-running-label="${game.id}">${running ? '运行中' : escapeHTML(game.launchLabel || '开始')}</button></div>
        <div class="steam-library-foot">${tags(game)}<span>${escapeHTML(game.size)}</span></div>
      </article>`;
    }

    function detailPage() {
      const game = selectedGame();
      if (!game) return storePage();
      const back = ['wishlist', 'library', 'dlc', 'vr', 'community', 'profile'].includes(state.detailFrom) ? state.detailFrom : 'store';
      const backLabels = { wishlist: '返回愿望单', library: '返回游戏库', dlc: '返回 DLC', vr: '返回 VR 中心', community: '返回社区', profile: '返回个人资料', store: '返回商店' };
      return `<div class="steam-detail-page">
        <button class="steam-back-btn" data-steam-nav="${back}"><svg viewBox="0 0 24 24"><use href="#i-chevron-left"></use></svg>${backLabels[back]}</button>
        <section class="steam-detail-hero ${game.art}">
          <div class="steam-detail-cover">${cover(game, 'cover-detail')}</div>
          <div class="steam-detail-copy"><div class="steam-detail-tags">${tags(game)}</div><h1>${escapeHTML(game.title)}<small>${escapeHTML(game.cn)}</small></h1><p>${escapeHTML(game.description)}</p><div class="steam-detail-review"><b>${escapeHTML(game.rating)}</b><span>${escapeHTML(game.reviews)} 条用户评测</span></div><div class="steam-detail-actions">${primaryButton(game)}${wishlistButton(game)}</div><div class="steam-detail-note" data-steam-install-note="${game.id}">${detailNote(game)}</div></div>
        </section>
        <div class="steam-detail-layout">
          <div class="steam-detail-main">
            <section class="steam-screenshots"><div class="steam-section-title"><h2>游戏画面</h2><span>4 张截图 · 本地预览</span></div><div class="steam-shot-row">${['行动开始', '低模街区', '霓虹与准星', '训练结束'].map((label, index) => `<button class="steam-shot ${game.art} shot-${index + 1}" data-steam-action="shot"><span>${escapeHTML(label)}</span><i></i><b>${String(index + 1).padStart(2, '0')}</b></button>`).join('')}</div></section>
            ${dlcSection(game)}
            <section class="steam-about-card"><div class="steam-section-title"><h2>关于这款${game.type === 'tool' ? '软件' : '游戏'}</h2><span>${escapeHTML(game.coverKicker)}</span></div>${game.about.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join('')}<div class="steam-feature-list">${game.features.map((feature) => `<span><svg viewBox="0 0 24 24"><use href="#i-check"></use></svg>${escapeHTML(feature)}</span>`).join('')}</div></section>
            <section class="steam-req-card"><div class="steam-section-title"><h2>系统需求</h2><span>本机演示</span></div><div class="steam-req-grid"><div><b>最低配置</b>${game.requirements.map((req) => `<span>${escapeHTML(req)}</span>`).join('')}</div><div><b>推荐配置</b><span>AISniper M1 · 神经核心</span><span>24 GB 统一内存</span><span>WebGL 2 / 本地存储</span></div></div></section>
          </div>
          <aside class="steam-purchase-card">
            <div class="steam-purchase-art">${cover(game, 'cover-side')}</div>
            <div class="steam-purchase-head"><div><span>${game.installed ? '已在库中' : game.demo ? '已入库 · 本地演示' : '商店页面'}</span><b>${escapeHTML(game.demo && !game.installed ? '可下载' : game.price)}</b></div>${game.owned || game.installed ? '<i class="steam-owned-pill">已拥有</i>' : ''}</div>
            ${primaryButton(game)}
            ${wishlistButton(game)}
            <div class="steam-purchase-meta"><div><span>开发商</span><b>${escapeHTML(game.developer)}</b></div><div><span>发行商</span><b>${escapeHTML(game.publisher)}</b></div><div><span>发行日期</span><b>${escapeHTML(game.release)}</b></div><div><span>类型</span><b>${game.type === 'tool' ? '软件 / VR' : game.vr ? '游戏 / VR' : '游戏'}</b></div>${game.demo ? `<div><span>下载大小</span><b>${escapeHTML(game.size)}</b></div>` : ''}</div>
            <div class="steam-purchase-platforms"><span><svg viewBox="0 0 24 24"><use href="#i-display"></use></svg>AISniperOS</span><span><svg viewBox="0 0 24 24"><use href="#i-headset"></use></svg>SteamVR</span><span><svg viewBox="0 0 24 24"><use href="#i-shield"></use></svg>本地</span></div>
          </aside>
        </div>
      </div>`;
    }

    function vrPage() {
      return `<div class="steam-vr-page">
        <div class="steam-page-head"><div><span class="steam-eyebrow"><i></i>VR WORKSPACE</span><h1>VR 中心</h1><p>头显、追踪器与叠加层工具，都在这里。</p></div><button class="steam-btn secondary" data-steam-action="launch" data-game-id="steamvr"><svg viewBox="0 0 24 24"><use href="#i-headset"></use></svg>启动 SteamVR</button></div>
        <section class="steam-vr-hero">
          <div class="steam-vr-room-art"><div class="steam-vr-horizon"></div><div class="steam-vr-grid"></div><div class="steam-vr-controller left"></div><div class="steam-vr-controller right"></div><span class="steam-vr-headset"><svg viewBox="0 0 24 24"><use href="#i-headset"></use></svg></span><div class="steam-vr-home-ui"><span>STEAMVR HOME</span><b>山脊大厅</b><small>准备好进入。</small></div></div>
          <div class="steam-vr-hero-copy"><span class="steam-eyebrow"><i></i>VALVE INDEX · 已连接</span><h2>把山脊装进头显。</h2><p>SteamVR 运行时在线，两个基站和 Index 控制器都已就绪。你可以启动 VR 首页，或者打开叠加层工具。</p><div class="steam-vr-actions"><button class="steam-btn primary" data-steam-action="launch" data-game-id="steamvr">启动 SteamVR</button><button class="steam-btn ghost" data-steam-action="launch" data-game-id="vrchat">进入 VRChat</button></div><div class="steam-vr-stat-row"><span>刷新率 <b>120 Hz</b></span><span>基站 <b>2 / 2</b></span><span>追踪器 <b>6 / 6</b></span><span>延迟 <b>8 ms</b></span></div></div>
        </section>
        <div class="steam-vr-tools">${[gameById('steamvr'), gameById('ovrtk'), gameById('slimevr')].map((game) => `<article class="steam-vr-tool-card"><div class="steam-vr-tool-art">${cover(game, 'cover-tool')}</div><div><span>${escapeHTML(game.coverSub)}</span><b>${escapeHTML(game.title)}</b><small>${escapeHTML(game.description)}</small><button class="steam-btn primary small" data-steam-action="launch" data-game-id="${game.id}">${escapeHTML(game.launchLabel)}</button></div></article>`).join('')}</div>
        <div class="steam-section-title steam-vr-games-title"><h2>VR 游戏</h2><span>已安装与可下载演示</span></div>
        <div class="steam-card-row steam-vr-game-row">${GAMES.filter((game) => game.vr && game.type === 'game').map(storeCard).join('')}</div>
      </div>`;
    }

    function communityPage() {
      const user = account();
      return `<div class="steam-community-page">
        <section class="steam-profile-hero"><div class="steam-profile-avatar">S<i></i></div><div class="steam-profile-copy"><span class="steam-eyebrow"><i></i>STEAM 个人资料</span><h1>${escapeHTML(user.name)}</h1><p>等级 ${user.level} · ${escapeHTML(user.status)} · 正在 Steam 中浏览</p><div class="steam-profile-badges"><span>轨道先锋</span><span>2026 夏季徽章</span><span>低模收藏家</span></div></div><div class="steam-profile-stats"><div><b>${installedGames().length}</b><span>游戏</span></div><div><b>158</b><span>成就</span></div><div><b>9</b><span>好友</span></div></div></section>
        <div class="steam-community-layout">
          <div>
            <div class="steam-section-title"><h2>好友</h2><span>8 位在线</span></div>
            <div class="steam-friend-grid">${FRIENDS.map((friend) => `<button class="steam-friend-card" data-steam-friend="${friend.id}"><span class="steam-avatar" style="--avatar:${friend.color}">${escapeHTML(friend.name[0])}</span><div><b>${escapeHTML(friend.name)}</b><span>${escapeHTML(friend.status)}</span><small>${escapeHTML(friend.game || '未在游戏中')}</small></div><i class="${friend.status.includes('离线') ? 'offline' : ''}"></i></button>`).join('')}</div>
            <div class="steam-section-title"><h2>最近动态</h2><span>好友活动</span></div>
            <div class="steam-activity-list">
              <div><span class="steam-avatar" style="--avatar:#f3a35c">M</span><p><b>Mira</b> 进入了 VRChat · Midnight Lounge<small>12 分钟前</small></p><span class="steam-activity-game">VRChat</span></div>
              <div><span class="steam-avatar" style="--avatar:#8d7dff">K</span><p><b>Kai</b> 在 Counter-Strike 2 中获得 18 次淘汰<small>38 分钟前</small></p><span class="steam-activity-game">CS2</span></div>
              <div><span class="steam-avatar" style="--avatar:#63d9c4">N</span><p><b>Nova</b> 完成了 SlimeVR 全身校准<small>1 小时前</small></p><span class="steam-activity-game">SlimeVR</span></div>
            </div>
          </div>
          <aside class="steam-community-side"><div class="steam-side-card"><div class="steam-side-head"><span>Steam 等级</span><b>42</b></div><div class="steam-level-bar"><i></i></div><p>再获得 180 XP 即可升级。</p><button class="steam-side-link" data-steam-nav="profile">查看个人资料 <svg viewBox="0 0 24 24"><use href="#i-chevron-right"></use></svg></button></div><div class="steam-side-card"><div class="steam-side-head"><span>当前游戏</span><b>2</b></div><div class="steam-current-games"><button data-steam-open="cs2"><span>CS2</span><b>竞技靶场</b></button><button data-steam-open="vrchat"><span>VRC</span><b>Midnight Lounge</b></button></div></div><div class="steam-side-card"><div class="steam-side-head"><span>最近解锁</span><b>3</b></div><div class="steam-achievement-mini"><span><svg viewBox="0 0 24 24"><use href="#i-trophy"></use></svg></span><div><b>第一滴血</b><small>Counter-Strike 2</small></div></div><div class="steam-achievement-mini"><span><svg viewBox="0 0 24 24"><use href="#i-trophy"></use></svg></span><div><b>新朋友</b><small>VRChat</small></div></div></div></aside>
        </div>
      </div>`;
    }

    function downloadsPage() {
      const active = state.downloads.filter((download) => download.status === 'downloading');
      const queued = state.downloads.filter((download) => download.status === 'queued');
      const paused = state.downloads.filter((download) => download.status === 'paused');
      const complete = state.downloads.filter((download) => download.status === 'complete');
      return `<div class="steam-downloads-page">
        <div class="steam-page-head"><div><span class="steam-eyebrow"><i></i>DOWNLOAD MANAGER</span><h1>下载</h1><p>${active.length} 项正在下载 · ${queued.length} 项排队 · ${paused.length} 项暂停</p></div><button class="steam-btn secondary" data-steam-action="check-updates"><svg viewBox="0 0 24 24"><use href="#i-reload"></use></svg>检查更新</button></div>
        <section class="steam-download-hero"><span class="steam-download-orb"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg></span><div><span>存储通道</span><b>本地 Steam 缓存 · 多线程解包</b><small>下载、安装与启动都在本机完成，不占用真实带宽。</small></div><div class="steam-download-speed"><b>6.5</b><span>GB/s</span><small>本地镜像</small></div></section>
        <div class="steam-section-title"><h2>队列</h2><button class="steam-text-link" data-steam-action="clear-finished">清除已完成</button></div>
        <div class="steam-download-list">${state.downloads.map((download) => downloadRow(download)).join('')}</div>
        ${complete.length ? '<p class="steam-download-footnote">安装完成的游戏会出现在游戏库中，可直接启动。</p>' : ''}
      </div>`;
    }

    function downloadRow(download) {
      const game = download.gameId ? gameById(download.gameId) : gameById(download.app);
      const isActive = download.status === 'downloading';
      const isQueued = download.status === 'queued';
      const isComplete = download.status === 'complete';
      const canLaunch = isComplete && !download.dlcId && Boolean(game?.installed);
      const stateLabel = isComplete ? (canLaunch ? '已安装 · 可启动' : '已完成') : isActive ? (download.speed || '本地镜像') : isQueued ? '排队中 · 等待当前下载' : '已暂停';
      return `<article class="steam-download-row${isActive ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}${isQueued ? ' is-queued' : ''}" data-steam-download-row="${download.id}">
        <span class="steam-download-art">${game ? cover(game, 'cover-download') : '<span class="steam-download-generic"><svg viewBox="0 0 24 24"><use href="#i-download"></use></svg></span>'}</span>
        <div class="steam-download-copy"><div><b>${escapeHTML(download.title)}</b><span>${escapeHTML(download.kind)} · ${escapeHTML(download.size)}</span></div><div class="steam-download-track"><i style="width:${download.progress}%" data-steam-download-bar></i></div><small><span data-steam-download-percent>${Math.round(download.progress)}%</span> · ${stateLabel}</small></div>
        <div class="steam-download-actions">${canLaunch ? `<button class="steam-btn primary small" data-steam-action="download-launch" data-game-id="${game.id}" data-download-id="${download.id}">启动</button><button class="steam-download-remove" data-steam-action="download-clear" data-download-id="${download.id}" aria-label="移除 ${escapeHTML(download.title)}">移除</button>` : `<button class="steam-btn ghost small" data-steam-action="${isComplete || isQueued ? 'download-clear' : 'download-toggle'}" data-download-id="${download.id}">${isComplete ? '移除' : isQueued ? '取消' : isActive ? '暂停' : '继续'}</button>${isComplete ? '<svg class="steam-download-done" viewBox="0 0 24 24"><use href="#i-check"></use></svg>' : ''}`}</div>
      </article>`;
    }

    function wishlistPage() {
      const games = wishlistGames();
      return `<div class="steam-wishlist-page"><div class="steam-page-head"><div><span class="steam-eyebrow"><i></i>YOUR WISHLIST</span><h1>愿望单</h1><p>${games.length} 个条目 · 心动收藏</p></div><button class="steam-btn secondary" data-steam-nav="store">继续浏览商店</button></div><div class="steam-wishlist-grid">${games.map((game) => `<article class="steam-wishlist-card"><button class="steam-wishlist-art" data-steam-open="${game.id}">${cover(game, 'cover-wishlist')}</button><div class="steam-wishlist-copy"><div><b>${escapeHTML(game.title)}</b><span>${escapeHTML(game.price)} · ${escapeHTML(game.tags[0])}</span></div><button class="steam-wish-remove" data-steam-action="wishlist" data-game-id="${game.id}" aria-label="移除 ${game.title}"><svg viewBox="0 0 24 24"><use href="#i-close"></use></svg></button></div><button class="steam-btn ghost small" data-steam-open="${game.id}">查看商店页面</button></article>`).join('')}</div>${games.length ? '' : '<div class="steam-empty-state"><svg viewBox="0 0 24 24"><use href="#i-star"></use></svg><b>愿望单还是空的。</b><span>在商店页面把感兴趣的游戏加入愿望单。</span></div>'}</div>`;
    }

    function profilePage() {
      const user = account();
      return `<div class="steam-profile-page">
        <section class="steam-profile-banner"><div class="steam-profile-bg"></div><div class="steam-profile-avatar">S<i></i></div><div class="steam-profile-copy"><span class="steam-eyebrow"><i></i>PROFILE</span><h1>${escapeHTML(user.name)}</h1><p>等级 ${user.level} · ${escapeHTML(user.status)}</p><div class="steam-profile-badges"><span>轨道先锋</span><span>2026 夏季徽章</span><span>低模收藏家</span><span>VR 常驻</span></div></div><div class="steam-wallet"><span>Steam 钱包</span><b>${escapeHTML(user.wallet)}</b><small>最近充值：今天 18:42</small></div></section>
        <div class="steam-profile-content">
          <section class="steam-profile-recent"><div class="steam-section-title"><h2>最近游玩</h2><span>126 小时</span></div><div class="steam-card-row">${installedGames().slice(0, 3).map(storeCard).join('')}</div></section>
          <aside class="steam-profile-aside"><div class="steam-side-card"><div class="steam-side-head"><span>统计</span><b>2026</b></div><div class="steam-profile-metrics"><div><b>${installedGames().length}</b><span>游戏</span></div><div><b>158</b><span>成就</span></div><div><b>9</b><span>好友</span></div><div><b>42</b><span>等级</span></div></div><button class="steam-side-link" data-steam-action="profile-edit">编辑个人资料 <svg viewBox="0 0 24 24"><use href="#i-pen"></use></svg></button></div><div class="steam-side-card"><div class="steam-side-head"><span>展示徽章</span><b>4</b></div><div class="steam-badge-grid"><span><svg viewBox="0 0 24 24"><use href="#i-trophy"></use></svg></span><span><svg viewBox="0 0 24 24"><use href="#i-star"></use></svg></span><span><svg viewBox="0 0 24 24"><use href="#i-headset"></use></svg></span><span><svg viewBox="0 0 24 24"><use href="#i-spark"></use></svg></span></div></div></aside>
        </div>
        <button class="steam-back-btn" data-steam-nav="community"><svg viewBox="0 0 24 24"><use href="#i-chevron-left"></use></svg>返回社区</button>
      </div>`;
    }

    function searchPage() {
      const query = state.query.trim();
      const results = query ? GAMES.filter((game) => `${game.title} ${game.cn} ${game.tags.join(' ')} ${game.developer}`.toLowerCase().includes(query.toLowerCase())) : [];
      return `<div class="steam-search-page"><div class="steam-page-head"><div><span class="steam-eyebrow"><i></i>SEARCH</span><h1>“${escapeHTML(query)}”</h1><p>${results.length} 个相关结果</p></div><button class="steam-btn secondary" data-steam-nav="store">返回商店</button></div>${results.length ? `<div class="steam-search-grid">${results.map(storeCard).join('')}</div>` : '<div class="steam-empty-state"><svg viewBox="0 0 24 24"><use href="#i-search"></use></svg><b>没有找到相关条目。</b><span>试试“VRChat”、“CS2”或“VR”。</span></div>'}</div>`;
    }

    function updateDownloadBadge() {
      const count = activeDownloads().length;
      $$('[data-steam-download-badge]', root).forEach((badge) => {
        badge.textContent = String(count);
        badge.hidden = count === 0;
      });
      $$('[data-steam-download-count]', root).forEach((label) => { label.textContent = String(count); });
    }

    function updateDownloadDom(download) {
      const row = $(`[data-steam-download-row="${download.id}"]`, root);
      if (row) {
        const bar = $('[data-steam-download-bar]', row);
        if (bar) bar.style.width = `${download.progress}%`;
        const percent = $('[data-steam-download-percent]', row);
        if (percent) percent.textContent = `${Math.round(download.progress)}%`;
      }
      if (download.gameId) {
        $$(`[data-steam-install-progress="${download.gameId}"]`, root).forEach((label) => {
          label.textContent = `正在下载 ${Math.round(download.progress)}%`;
        });
        const note = $(`[data-steam-install-note="${download.gameId}"]`, root);
        if (note) note.textContent = `正在下载 · ${Math.round(download.progress)}% · ${download.speed || '本地镜像'}`;
        $$(`[data-steam-store-status="${download.gameId}"]`, root).forEach((label) => {
          label.textContent = `下载 ${Math.round(download.progress)}%`;
        });
        if (download.dlcId) {
          $$(`[data-steam-dlc-progress="${download.gameId}:${download.dlcId}"]`, root).forEach((label) => {
            label.textContent = `下载中 ${Math.round(download.progress)}%`;
          });
        }
      }
    }

    function completeDownload(download) {
      download.progress = 100;
      download.status = 'complete';
      download.speed = '已完成';
      const game = download.gameId ? gameById(download.gameId) : null;
      const dlc = game && download.dlcId ? game.dlc?.find((item) => item.id === download.dlcId) : null;
      if (dlc) {
        dlc.installed = true;
        host.showToast?.({ title: '扩展安装完成', message: `${game.title} · ${dlc.cn} 已可用于游戏大厅。`, icon: 'app-steam', duration: 2800 });
      } else if (game) {
        game.installed = true;
        game.owned = true;
        game.lastPlayed = '刚刚安装';
        host.showToast?.({ title: '安装完成', message: `${game.title} 已加入游戏库，可以直接启动。`, icon: 'app-steam', duration: 2800 });
      } else {
        host.showToast?.({ title: '下载完成', message: `${download.title} 已准备就绪。`, icon: 'app-steam' });
      }
      saveSteamLibraryState();
      if (['store', 'library', 'dlc', 'detail', 'downloads', 'wishlist', 'vr', 'profile', 'search', 'community'].includes(state.page)) render();
      else updateDownloadBadge();
    }

    function startNextDownload() {
      if (state.downloads.some((download) => download.status === 'downloading')) return false;
      const next = state.downloads.find((download) => download.status === 'queued');
      if (!next) return false;
      next.status = 'downloading';
      next.speed = '6.5 GB/s';
      return true;
    }

    function ensureDownloadTicker() {
      if (downloadTimer) return;
      startNextDownload();
      if (!state.downloads.some((download) => download.status === 'downloading')) return;
      downloadTimer = setInterval(() => {
        const download = state.downloads.find((item) => item.status === 'downloading');
        if (!download) {
          const started = startNextDownload();
          if (!started) {
            clearInterval(downloadTimer);
            downloadTimer = null;
          } else if (state.page === 'downloads') {
            render();
          }
          return;
        }
        download.progress = Math.min(100, download.progress + (() => {
          const sizeText = String(download.size || '5 GB');
          const numericSize = parseFloat(sizeText) || 5;
          const sizeGb = /MB/i.test(sizeText) ? numericSize / 1024 : numericSize;
          const targetSeconds = Math.min(22, Math.max(5.5, sizeGb / 6.5));
          return (100 / (targetSeconds / 0.46)) * (0.86 + Math.random() * 0.32);
        })());
        if (download.progress >= 100) {
          completeDownload(download);
          if (!startNextDownload()) {
            clearInterval(downloadTimer);
            downloadTimer = null;
          } else if (state.page === 'downloads') {
            render();
          }
        } else {
          updateDownloadDom(download);
        }
      }, 460);
    }

    function installGame(game) {
      if (!game) return;
      if (game.installed) { launchGame(game); return; }
      const existing = downloadFor(game);
      if (existing) {
        if (existing.status === 'paused') toggleDownload(existing.id);
        else {
          navigate('downloads');
          host.showToast?.({ title: existing.status === 'queued' ? '已加入下载队列' : '正在下载', message: `${game.title} · ${Math.round(existing.progress)}%`, icon: 'app-steam' });
        }
        return;
      }
      const busy = state.downloads.some((download) => download.status === 'downloading' || download.status === 'queued');
      state.downloads.unshift({
        id: `install-${game.id}`,
        app: game.app,
        gameId: game.id,
        title: game.title,
        kind: '游戏',
        progress: 0,
        status: busy ? 'queued' : 'downloading',
        size: game.size || '4.0 GB',
        speed: busy ? '等待下载' : '6.5 GB/s'
      });
      if (game.demo) game.owned = true;
      ensureDownloadTicker();
      render();
      host.showToast?.({ title: busy ? '已加入下载队列' : '开始下载', message: `${game.title} · ${game.size || '本地演示'}`, icon: 'i-download' });
    }

    function installDlc(game, dlc) {
      if (!game || !dlc) return;
      if (!game.installed) {
        openDetail(game.id);
        host.showToast?.({ title: '需要先安装本体', message: `请先安装 ${game.title}，然后安装 ${dlc.cn}。`, icon: 'i-info' });
        return;
      }
      if (dlc.installed) {
        host.showToast?.({ title: '扩展已安装', message: `${game.title} · ${dlc.cn}`, icon: 'i-check' });
        return;
      }
      const existing = dlcDownloadFor(game, dlc);
      if (existing) {
        if (existing.status === 'paused') toggleDownload(existing.id);
        else navigate('downloads');
        return;
      }
      const busy = state.downloads.some((download) => download.status === 'downloading' || download.status === 'queued');
      state.downloads.unshift({
        id: `dlc-${game.id}-${dlc.id}`,
        app: game.app,
        gameId: game.id,
        dlcId: dlc.id,
        title: `${game.title} · ${dlc.cn}`,
        kind: '扩展包',
        progress: 0,
        status: busy ? 'queued' : 'downloading',
        size: dlc.size || '4.0 GB',
        speed: busy ? '等待下载' : '6.5 GB/s'
      });
      ensureDownloadTicker();
      render();
      host.showToast?.({ title: busy ? '扩展已加入下载队列' : '正在安装扩展', message: `${game.title} · ${dlc.cn} · ${dlc.size}`, icon: 'i-download' });
    }

    function launchGame(game) {
      if (!game) return;
      if (game.demo && !game.installed) {
        installGame(game);
        return;
      }
      if (!game.app) {
        host.showToast?.({ title: '无法启动', message: '这个条目没有可运行的游戏内容。', icon: 'i-info' });
        return;
      }
      state.activeGameId = game.id;
      host.showToast?.({ title: '正在启动', message: `${game.title} · Steam 本地客户端`, icon: 'app-steam', duration: 1800 });
      host.openApp?.(game.app, game.app === 'steamdemo' ? { gameId: game.id } : {});
    }

    function toggleWishlist(id) {
      const game = gameById(id);
      if (!game) return;
      if (state.wishlist.has(id)) {
        state.wishlist.delete(id);
        host.showToast?.({ title: '已从愿望单移除', message: game.title, icon: 'i-star' });
      } else {
        state.wishlist.add(id);
        host.showToast?.({ title: '已加入愿望单', message: `${game.title} · ${game.price}`, icon: 'i-star' });
      }
      render();
    }

    function toggleDownload(id) {
      const download = state.downloads.find((item) => item.id === id);
      if (!download || download.status === 'complete') return;
      if (download.status === 'downloading') {
        download.status = 'paused';
        download.speed = '—';
      } else if (download.status === 'queued') {
        download.status = 'paused';
        download.speed = '—';
      } else {
        const active = state.downloads.find((item) => item.id !== id && item.status === 'downloading');
        if (active) {
          active.status = 'queued';
          active.speed = '等待下载';
        }
        download.status = 'downloading';
        download.speed = '6.5 GB/s';
      }
      ensureDownloadTicker();
      render();
    }

    function removeDownload(id) {
      const index = state.downloads.findIndex((item) => item.id === id);
      if (index < 0) return;
      const wasActive = state.downloads[index].status === 'downloading';
      state.downloads.splice(index, 1);
      if (wasActive) startNextDownload();
      ensureDownloadTicker();
      render();
    }

    function checkUpdates() {
      if (state.downloads.some((download) => download.status === 'downloading' || download.status === 'queued')) {
        host.showToast?.({ title: '下载队列忙碌', message: '请等待当前下载完成。', icon: 'app-steam' });
        return;
      }
      if (state.downloads.some((download) => download.id === 'client-update')) {
        host.showToast?.({ title: 'Steam 已是最新版本', message: '当前没有新的客户端更新。', icon: 'i-check' });
        return;
      }
      state.downloads.unshift({ id: 'client-update', app: null, title: 'Steam 客户端更新', kind: '客户端', progress: 3, status: 'downloading', size: '48 MB / 92 MB', speed: '6.5 GB/s' });
      ensureDownloadTicker();
      render();
      host.showToast?.({ title: '发现 Steam 客户端更新', message: '正在后台下载 · 92 MB', icon: 'app-steam' });
    }

    function handleClick(event) {
      const friend = event.target.closest('[data-steam-friend]');
      if (friend) {
        const person = FRIENDS.find((entry) => entry.id === friend.dataset.steamFriend);
        if (person) host.showToast?.({ title: person.name, message: `${person.status} · ${person.game || '最近未启动游戏'}`, icon: 'i-user' });
        return;
      }
      const filter = event.target.closest('[data-steam-filter]');
      if (filter) {
        state.libraryFilter = filter.dataset.steamFilter;
        render();
        return;
      }
      const action = event.target.closest('[data-steam-action]');
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        const name = action.dataset.steamAction;
        const game = gameById(action.dataset.gameId);
        if (name === 'launch') launchGame(game);
        else if (name === 'install') installGame(game);
        else if (name === 'dlc-install') installDlc(gameById(action.dataset.gameId), findDlc(action.dataset.gameId, action.dataset.dlcId));
        else if (name === 'show-downloads') navigate('downloads');
        else if (name === 'wishlist') toggleWishlist(action.dataset.gameId);
        else if (name === 'shot') host.showToast?.({ title: '截图预览', message: '当前商店页面使用本地生成的低模画面。', icon: 'i-image' });
        else if (name === 'check-updates') checkUpdates();
        else if (name === 'download-toggle') toggleDownload(action.dataset.downloadId);
        else if (name === 'download-clear') removeDownload(action.dataset.downloadId);
        else if (name === 'download-launch') { const target = gameById(action.dataset.gameId); if (target) launchGame(target); }
        else if (name === 'clear-finished') { state.downloads = state.downloads.filter((download) => download.status !== 'complete'); render(); }
        else if (name === 'profile-edit') host.showToast?.({ title: '个人资料', message: '资料编辑在本地演示中已锁定。', icon: 'i-pen' });
        return;
      }
      const open = event.target.closest('[data-steam-open]');
      if (open) {
        openDetail(open.dataset.steamOpen);
        return;
      }
      const nav = event.target.closest('[data-steam-nav]');
      if (nav) {
        event.preventDefault();
        navigate(nav.dataset.steamNav);
      }
    }

    function handleSubmit(event) {
      if (!event.target.matches('[data-steam-search-form]')) return;
      event.preventDefault();
      const input = $('input', event.target);
      state.query = input?.value.trim() || '';
      if (!state.query) {
        state.page = 'store';
        render();
        return;
      }
      state.page = 'search';
      render();
    }

    function handleInput(event) {
      const range = event.target.closest('[data-steam-range]');
      if (!range) return;
      const key = range.dataset.steamRange;
      if (key === 'not-used') return;
    }

    // Build game surfaces and companion apps only once.
    if (window.AISniperSteamGames) {
      try {
        cs2Game = new window.AISniperSteamGames.CS2Game(document.getElementById('cs2Root'), { showToast: host.showToast });
        vrchatGame = new window.AISniperSteamGames.VRChatGame(document.getElementById('vrchatRoot'), { showToast: host.showToast });
      } catch (error) {
        console.error('AISniperOS：游戏界面初始化失败。', error);
      }
    }
    if (window.AISniperSteamMini) {
      try {
        steamMiniGame = new window.AISniperSteamMini.SteamMiniGame(document.getElementById('steamDemoRoot'), {
          showToast: host.showToast,
          getDlcState: (gameId) => {
            const game = gameById(gameId);
            return (game?.dlc || []).map((dlc) => ({
              id: dlc.id,
              mode: dlc.mode,
              title: dlc.title,
              cn: dlc.cn,
              date: dlc.date,
              release: dlc.release,
              size: dlc.size,
              installed: Boolean(dlc.installed),
              accent: dlc.accent,
              description: dlc.description
            }));
          },
          onExit: () => {
            host.openApp?.('steam');
            setTimeout(() => navigate('library'), 180);
          }
        });
      } catch (error) {
        console.error('AISniperOS：Steam 演示游戏启动失败。', error);
      }
    }
    steamVRUI = createSteamVR(document.getElementById('steamvrRoot'), host);
    ovrUI = createOVRToolkit(document.getElementById('ovrtkRoot'), host);
    slimeUI = createSlimeVR(document.getElementById('slimevrRoot'), host);

    render();
    root.addEventListener('click', handleClick);
    root.addEventListener('submit', handleSubmit);
    root.addEventListener('input', handleInput);
    root.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('[data-steam-open]')) {
        event.preventDefault();
        openDetail(event.target.closest('[data-steam-open]').dataset.steamOpen);
      }
    });
    setInterval(() => {
      $$('[data-steam-running-label]', root).forEach((label) => {
        const game = gameById(label.dataset.steamRunningLabel);
        if (!game) return;
        const running = isRunning(game);
        if (label.tagName === 'BUTTON') label.textContent = running ? '正在运行' : (game.launchLabel || '开始游戏');
        else label.textContent = running ? '运行中' : '开始游戏';
        label.classList.toggle('is-running-label', running);
      });
    }, 1400);

    return {
      open(options = {}) {
        if (options.page) {
          state.page = options.page;
          state.selectedId = options.game || state.selectedId;
        }
        if (options.game) openDetail(options.game);
        else render();
      },
      navigate,
      openGameDetail(appOrId) {
        const id = appOrId === 'steamdemo' ? state.activeGameId : appOrId;
        const game = gameById(id);
        if (game) openDetail(game.id);
      },
      openSurface(app, options = {}) {
        if (app === 'cs2') cs2Game?.open?.();
        else if (app === 'vrchat') vrchatGame?.open?.();
        else if (app === 'steamvr') steamVRUI?.open?.();
        else if (app === 'ovrtk') ovrUI?.open?.();
        else if (app === 'slimevr') slimeUI?.open?.();
        else if (app === 'steamdemo') {
          const gameId = options.gameId || state.activeGameId || 'alyx';
          state.activeGameId = gameId;
          steamMiniGame?.open?.(gameId);
        }
      },
      resetSurface(app) {
        if (app === 'cs2') cs2Game?.reset?.();
        else if (app === 'vrchat') vrchatGame?.reset?.();
        else if (app === 'steamvr') steamVRUI?.reset?.();
        else if (app === 'ovrtk') ovrUI?.reset?.();
        else if (app === 'slimevr') slimeUI?.reset?.();
        else if (app === 'steamdemo') steamMiniGame?.reset?.();
      },
      getActiveGameId() {
        return state.activeGameId;
      },
      getState() {
        return {
          page: state.page,
          selectedId: state.selectedId,
          activeGameId: state.activeGameId,
          wishlist: [...state.wishlist],
          downloads: state.downloads.map((item) => ({ ...item })),
          installed: installedGames().map((game) => game.id)
        };
      }
    };
  }

  /* ==========================================================================
     SteamVR companion
     ========================================================================== */

  function createSteamVR(root, host) {
    if (!root) return null;
    const state = {
      running: false,
      refresh: 120,
      audioMirror: false,
      chaperone: '房间规模',
      supersampling: 124,
      home: false
    };
    const devices = [
      { name: 'Valve Index', detail: '头显 · 已连接 · 120 Hz', icon: 'i-headset', state: 'online' },
      { name: '基站 2.0', detail: '2 个 · 追踪正常 · 6.2 m 范围', icon: 'i-display', state: 'online' },
      { name: 'Index 控制器', detail: '左右手 · 电量 84% / 87%', icon: 'i-control', state: 'online' },
      { name: 'Vive 追踪器', detail: '3 个 · SlimeVR 辅助', icon: 'i-box', state: 'online' }
    ];

    function template() {
      return `<div class="vrx-shell${state.running ? ' is-running' : ''}">
        <header class="vrx-head"><div class="vrx-brand"><span class="vrx-logo"><svg viewBox="0 0 24 24"><use href="#i-headset"></use></svg></span><div><span>VALVE</span><b>SteamVR</b></div></div><div class="vrx-head-right"><span class="vrx-status"><i></i>${state.running ? '运行中' : '待机'}</span><button class="vrx-btn primary" data-steamvr-action="toggle">${state.running ? '停止 SteamVR' : '启动 SteamVR'}</button></div></header>
        <div class="vrx-grid">
          <section class="vrx-viewport">
            <div class="vrx-room"><div class="vrx-room-sky"></div><div class="vrx-room-floor"></div><div class="vrx-room-rings"></div><div class="vrx-floating-panel panel-a"><span>VR HOME</span><b>山脊大厅</b><i></i><i></i><i></i></div><div class="vrx-floating-panel panel-b"><span>好友</span><b>Mira 在 VRChat</b><i></i><i></i><i></i></div><div class="vrx-hand left"></div><div class="vrx-hand right"></div><div class="vrx-viewport-copy"><span class="vrx-eyebrow">${state.running ? 'HEAD-MOUNTED DISPLAY ACTIVE' : 'READY TO ENTER'}</span><h2>${state.running ? '欢迎回到山脊。' : '头显已连接。'}</h2><p>${state.running ? '基站正在校准你的位置。打开 VR 首页，或直接启动一个本地世界。' : '启动运行时，进入一个低模的家。'}</p><div><button class="vrx-btn small" data-steamvr-action="home">${state.home ? '返回大厅' : '打开 VR 首页'}</button><button class="vrx-btn ghost small" data-steamvr-action="recenter">重新居中</button></div></div></div>
            <div class="vrx-preview-foot"><span><i></i>120 Hz · 双眼渲染</span><span>播放空间：${state.chaperone}</span><span>刷新率：${state.refresh} Hz</span></div>
          </section>
          <aside class="vrx-devices"><div class="vrx-side-title"><span>设备</span><b>4 在线</b></div>${devices.map((device) => `<button class="vrx-device" data-steamvr-device="${escapeHTML(device.name)}"><span class="vrx-device-icon"><svg viewBox="0 0 24 24"><use href="#${device.icon}"></use></svg></span><div><b>${escapeHTML(device.name)}</b><small>${escapeHTML(device.detail)}</small></div><i></i></button>`).join('')}<div class="vrx-battery"><span>控制器电量</span><b>84%</b><div><i style="width:84%"></i></div><span>基站范围</span><b>6.2 m</b><div><i style="width:72%"></i></div></div></aside>
        </div>
        <div class="vrx-settings">
          <div class="vrx-setting"><div><b>刷新率</b><span>头显渲染频率</span></div><div class="vrx-segment">${[90, 120, 144].map((rate) => `<button class="${state.refresh === rate ? 'is-active' : ''}" data-steamvr-refresh="${rate}">${rate} Hz</button>`).join('')}</div></div>
          <div class="vrx-setting"><div><b>房间设置</b><span>游玩空间与边界</span></div><div class="vrx-segment">${['房间规模', '仅站立', '坐姿'].map((mode) => `<button class="${state.chaperone === mode ? 'is-active' : ''}" data-steamvr-chaperone="${mode}">${mode}</button>`).join('')}</div></div>
          <div class="vrx-setting"><div><b>音频镜像</b><span>将头显声音输出到桌面</span></div><button class="vrx-toggle ${state.audioMirror ? 'is-on' : ''}" data-steamvr-action="audio"><i></i></button></div>
          <div class="vrx-setting vrx-slider"><div><b>超级采样</b><span>渲染分辨率</span></div><input type="range" min="80" max="160" value="${state.supersampling}" data-steamvr-range="supersampling" aria-label="超级采样"><em>${state.supersampling}%</em></div>
        </div>
      </div>`;
    }

    function render() { root.innerHTML = template(); }
    function open() { render(); }
    function reset() { Object.assign(state, { running: false, refresh: 120, audioMirror: false, chaperone: '房间规模', supersampling: 124, home: false }); render(); }
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-steamvr-action]');
      if (action) {
        const name = action.dataset.steamvrAction;
        if (name === 'toggle') {
          state.running = !state.running;
          host.showToast?.({ title: state.running ? 'SteamVR 已启动' : 'SteamVR 已停止', message: state.running ? 'Valve Index 正在进入虚拟空间。' : '运行时已释放头显。', icon: 'i-headset' });
          render();
        } else if (name === 'recenter') host.showToast?.({ title: '位置已重新居中', message: '面向山脊大厅的正前方。', icon: 'i-control' });
        else if (name === 'home') { state.home = !state.home; host.showToast?.({ title: state.home ? '正在返回 VR 首页' : 'VR 首页已打开', message: '山脊大厅 · 本地场景', icon: 'i-headset' }); render(); }
        else if (name === 'audio') { state.audioMirror = !state.audioMirror; render(); }
        return;
      }
      const refresh = event.target.closest('[data-steamvr-refresh]');
      if (refresh) { state.refresh = Number(refresh.dataset.steamvrRefresh); render(); return; }
      const chaperone = event.target.closest('[data-steamvr-chaperone]');
      if (chaperone) { state.chaperone = chaperone.dataset.steamvrChaperone; render(); return; }
      const device = event.target.closest('[data-steamvr-device]');
      if (device) host.showToast?.({ title: device.dataset.steamvrDevice, message: '设备状态正常 · 固件已是最新。', icon: 'i-headset' });
    });
    root.addEventListener('input', (event) => {
      const range = event.target.closest('[data-steamvr-range]');
      if (!range) return;
      state.supersampling = Number(range.value);
      const label = $('em', range.closest('.vrx-slider'));
      if (label) label.textContent = `${state.supersampling}%`;
    });
    render();
    return { open, reset };
  }

  /* ==========================================================================
     OVR Toolkit companion
     ========================================================================== */

  function createOVRToolkit(root, host) {
    if (!root) return null;
    const state = {
      wrist: true,
      desktop: true,
      window: false,
      notifications: true,
      opacity: 88,
      scale: 100,
      curve: 36,
      anchor: 'headset'
    };
    function template() {
      return `<div class="ovr-shell">
        <header class="ovr-head"><div class="ovr-brand"><span class="ovr-logo">OVR</span><div><b>OVR Toolkit</b><span>VR 叠加层 · SteamVR 已连接</span></div></div><div class="ovr-head-right"><span class="ovr-live"><i></i>已同步</span><button class="ovr-btn primary" data-ovr-action="open-desktop">打开桌面</button></div></header>
        <div class="ovr-layout">
          <section class="ovr-stage">
            <div class="ovr-room"><div class="ovr-room-glow"></div><div class="ovr-room-floor"></div><div class="ovr-overlay ${state.desktop ? '' : 'is-hidden'}" style="--ovr-opacity:${state.opacity / 100}; --ovr-scale:${state.scale / 100}; --ovr-curve:${state.curve}"><div class="ovr-overlay-bar"><i></i><span>OVR Toolkit · 桌面</span><b>88%</b></div><div class="ovr-overlay-screen"><div class="ovr-desktop-wall"><span class="ovr-desktop-mark">AISNIPER</span><div class="ovr-desktop-icons"><span>访达</span><span>浏览器</span><span>Steam</span><span>设置</span></div></div><div class="ovr-desktop-dock"><i></i><i></i><i></i><i></i></div></div></div>${state.wrist ? '<div class="ovr-wrist"><span>21:47</span><b>OVR WRIST</b><small>2 条通知</small></div>' : ''}${state.window ? '<div class="ovr-window"><span>STEAM</span><b>好友列表</b><i></i><i></i><i></i></div>' : ''}<div class="ovr-hand left"></div><div class="ovr-hand right"></div><div class="ovr-stage-label"><span>桌面叠加层预览</span><b>${state.desktop ? '可见' : '隐藏'}</b></div></div>
          </section>
          <aside class="ovr-controls"><div class="ovr-control-head"><span>叠加层</span><b>3 个</b></div>${[['desktop', '桌面屏幕', '显示完整桌面'], ['wrist', '腕部信息', '时间与通知'], ['window', '窗口抓取', '独立浮动窗口'], ['notifications', '通知提示', 'VR 内通知']].map(([key, label, copy]) => `<div class="ovr-toggle-row"><div><b>${label}</b><span>${copy}</span></div><button class="ovr-toggle ${state[key] ? 'is-on' : ''}" data-ovr-toggle="${key}"><i></i></button></div>`).join('')}<div class="ovr-control-head second"><span>位置</span><button data-ovr-action="reset" class="ovr-text-btn">恢复默认</button></div><div class="ovr-sliders">${[['scale', '尺寸', '%', 70, 140], ['curve', '曲率', '°', 0, 80], ['opacity', '透明度', '%', 40, 100]].map(([key, label, unit, min, max]) => `<label class="ovr-slider"><span>${label}</span><input type="range" min="${min}" max="${max}" value="${state[key]}" data-ovr-range="${key}" aria-label="${label}"><b>${state[key]}${unit}</b></label>`).join('')}</div><div class="ovr-anchor-row"><span>锚定</span>${[["headset","头显前方"],["wrist","左手腕"],["world","世界空间"]].map(([key,label])=>`<button class="${state.anchor===key?"is-active":""}" data-ovr-anchor="${key}">${label}</button>`).join("")}</div></aside>
        </div>
        <footer class="ovr-foot"><span><i></i>SteamVR 叠加层运行中</span><span>渲染时延 2.1 ms</span><button data-ovr-action="recenter">重新居中</button></footer>
      </div>`;
    }
    function render() { root.innerHTML = template(); }
    function bind() {
      root.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-ovr-toggle]');
        if (toggle) { state[toggle.dataset.ovrToggle] = !state[toggle.dataset.ovrToggle]; render(); return; }
        const anchor = event.target.closest('[data-ovr-anchor]');
        if (anchor) { state.anchor = anchor.dataset.ovrAnchor; render(); return; }
        const action = event.target.closest('[data-ovr-action]');
        if (!action) return;
        if (action.dataset.ovrAction === 'open-desktop') host.openApp?.('finder');
        else if (action.dataset.ovrAction === 'reset') { Object.assign(state, { opacity: 88, scale: 100, curve: 36 }); render(); }
        else if (action.dataset.ovrAction === 'recenter') host.showToast?.({ title: '叠加层已重新居中', message: '桌面屏幕已固定在头显前方。', icon: 'i-control' });
      });
      root.addEventListener('input', (event) => {
        const range = event.target.closest('[data-ovr-range]');
        if (!range) return;
        const key = range.dataset.ovrRange;
        state[key] = Number(range.value);
        const label = $('b', range.closest('.ovr-slider'));
        if (label) label.textContent = `${state[key]}${key === 'curve' ? '°' : '%'}`;
        const overlay = $('.ovr-overlay', root);
        if (overlay) {
          overlay.style.setProperty('--ovr-opacity', String(state.opacity / 100));
          overlay.style.setProperty('--ovr-scale', String(state.scale / 100));
          overlay.style.setProperty('--ovr-curve', String(state.curve));
        }
      });
    }
    bind();
    render();
    return { open() { render(); }, reset() { Object.assign(state, { wrist: true, desktop: true, window: false, notifications: true, opacity: 88, scale: 100, curve: 36, anchor: 'headset' }); render(); } };
  }

  /* ==========================================================================
     SlimeVR companion
     ========================================================================== */

  function createSlimeVR(root, host) {
    if (!root) return null;
    const trackerMeta = [
      ['chest', '胸部', 92, 'connected'],
      ['waist', '腰环', 88, 'connected'],
      ['leftKnee', '左膝', 76, 'connected'],
      ['rightKnee', '右膝', 81, 'connected'],
      ['leftFoot', '左脚', 69, 'connected'],
      ['rightFoot', '右脚', 73, 'offline']
    ];
    const state = {
      trackers: trackerMeta.map(([key, name, battery, status]) => ({ key, name, battery, status })),
      calibrating: false,
      progress: 0,
      locked: false,
      smoothing: 62,
      prediction: true,
      fullBody: true
    };
    let calibrationTimer = null;
    function template() {
      return `<div class="slime-shell">
        <header class="slime-head"><div class="slime-brand"><span class="slime-logo"><i></i><i></i><i></i></span><div><b>SlimeVR</b><span>全身追踪 · 6 个追踪器</span></div></div><div class="slime-head-right"><span class="slime-state ${state.locked ? 'is-locked' : ''}"><i></i>${state.calibrating ? `校准中 ${Math.round(state.progress)}%` : state.locked ? '姿态已锁定' : `${state.trackers.filter((tracker) => tracker.status === 'connected').length}/6 追踪器在线`}</span><button class="slime-btn primary" data-slime-action="calibrate">${state.calibrating ? '正在校准…' : '开始校准'}</button></div></header>
        <div class="slime-layout">
          <section class="slime-body-card"><div class="slime-body-head"><div><span>TRACKING MAP</span><b>低模骨骼</b></div><span class="slime-mini-state"><i></i>${state.trackers.filter((tracker) => tracker.status === 'connected').length}/6</span></div><div class="slime-figure-wrap"><svg class="slime-figure" viewBox="0 0 260 390" aria-label="SlimeVR 追踪器骨骼图"><defs><radialGradient id="slimeGlow" cx=".5" cy=".5" r=".5"><stop stop-color="#b8f66a" stop-opacity=".55"/><stop offset="1" stop-color="#b8f66a" stop-opacity="0"/></radialGradient></defs><circle cx="130" cy="170" r="145" fill="url(#slimeGlow)" opacity=".25"/><g class="slime-skeleton"><circle cx="130" cy="55" r="26"/><path d="M130 82v108M130 100 88 146M130 100l42 46M130 190l-34 93M130 190l34 93"/><path d="M96 283 82 344M164 283l14 61"/><path d="M82 344h-13M178 344h13"/></g>${state.trackers.map((tracker) => `<g class="slime-tracker-dot ${tracker.status === 'connected' ? 'is-online' : 'is-offline'}" data-slime-tracker="${tracker.key}"><circle class="dot-glow" cx="${trackerPoint(tracker.key).x}" cy="${trackerPoint(tracker.key).y}" r="13"/><circle cx="${trackerPoint(tracker.key).x}" cy="${trackerPoint(tracker.key).y}" r="5"/><text x="${trackerPoint(tracker.key).x + 15}" y="${trackerPoint(tracker.key).y + 4}">${tracker.name}</text></g>`).join('')}</svg><div class="slime-scanline"></div></div><div class="slime-body-foot"><span><i></i>胸部</span><span><i class="teal"></i>腰 / 腿</span><span><i class="violet"></i>脚部</span></div></section>
          <aside class="slime-list-card"><div class="slime-list-head"><span>追踪器</span><button data-slime-action="detect" class="slime-text-btn">自动检测</button></div><div class="slime-trackers">${state.trackers.map((tracker) => `<button class="slime-tracker-row" data-slime-tracker-row="${tracker.key}"><span class="slime-tracker-icon"><svg viewBox="0 0 24 24"><use href="#i-box"></use></svg></span><div><b>${tracker.name}</b><span>${tracker.key.toUpperCase()} · ${tracker.status === 'connected' ? '2.4 GHz' : '未连接'}</span></div><em class="${tracker.battery < 75 ? 'low' : ''}">${tracker.battery}%</em><i class="${tracker.status === 'connected' ? 'is-online' : ''}"></i></button>`).join('')}</div><div class="slime-list-foot"><span><i></i>接收器已连接</span><span>延迟 12 ms</span></div></aside>
        </div>
        <div class="slime-bottom">
          <div class="slime-calibration"><div class="slime-cal-head"><span>${state.locked ? '校准完成' : state.calibrating ? '正在校准骨骼' : '准备校准'}</span><b>${Math.round(state.progress)}%</b></div><div class="slime-cal-track"><i style="width:${state.progress}%"></i></div><p>${state.locked ? '身体姿态已锁定，可以进入 SteamVR 世界。' : '站直并保持自然呼吸，然后开始校准。'}</p></div>
          <div class="slime-settings"><div class="slime-setting"><div><b>全身追踪</b><span>将躯干与腿部数据发送到 SteamVR</span></div><button class="ovr-toggle ${state.fullBody ? 'is-on' : ''}" data-slime-toggle="fullBody"><i></i></button></div><div class="slime-setting"><div><b>动作预测</b><span>减少快速动作的拖影</span></div><button class="ovr-toggle ${state.prediction ? 'is-on' : ''}" data-slime-toggle="prediction"><i></i></button></div><label class="slime-slider"><span>平滑</span><input type="range" min="0" max="100" value="${state.smoothing}" data-slime-range="smoothing" aria-label="平滑"><b>${state.smoothing}%</b></label><button class="slime-reset" data-slime-action="reset">重置追踪器</button></div>
        </div>
      </div>`;
    }
    function trackerPoint(key) {
      return {
        chest: { x: 130, y: 127 },
        waist: { x: 130, y: 188 },
        leftKnee: { x: 97, y: 238 },
        rightKnee: { x: 163, y: 238 },
        leftFoot: { x: 82, y: 340 },
        rightFoot: { x: 178, y: 340 }
      }[key] || { x: 130, y: 200 };
    }
    function render() { root.innerHTML = template(); }
    function calibrate() {
      if (state.calibrating) return;
      state.calibrating = true;
      state.progress = 0;
      state.locked = false;
      render();
      clearInterval(calibrationTimer);
      calibrationTimer = setInterval(() => {
        state.progress = Math.min(100, state.progress + 4 + Math.random() * 4);
        const bar = $('.slime-cal-track i', root);
        if (bar) bar.style.width = `${state.progress}%`;
        const value = $('.slime-cal-head b', root);
        if (value) value.textContent = `${Math.round(state.progress)}%`;
        const stateLabel = $('.slime-state', root);
        if (stateLabel) stateLabel.innerHTML = `<i></i>校准中 ${Math.round(state.progress)}%`;
        if (state.progress >= 100) {
          clearInterval(calibrationTimer);
          calibrationTimer = null;
          state.calibrating = false;
          state.locked = true;
          render();
          host.showToast?.({ title: 'SlimeVR 校准完成', message: '六点追踪已锁定，可以进入 SteamVR。', icon: 'i-box' });
        }
      }, 160);
    }
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-slime-action]');
      if (action) {
        if (action.dataset.slimeAction === 'calibrate') calibrate();
        else if (action.dataset.slimeAction === 'detect') {
          state.trackers.forEach((tracker) => { tracker.status = 'connected'; });
          render();
          host.showToast?.({ title: '检测完成', message: '找到 6 个 SlimeVR 追踪器。', icon: 'i-box' });
        } else if (action.dataset.slimeAction === 'reset') {
          clearInterval(calibrationTimer);
          calibrationTimer = null;
          state.calibrating = false;
          state.progress = 0;
          state.locked = false;
          render();
        }
        return;
      }
      const toggle = event.target.closest('[data-slime-toggle]');
      if (toggle) {
        state[toggle.dataset.slimeToggle] = !state[toggle.dataset.slimeToggle];
        render();
        return;
      }
      const tracker = event.target.closest('[data-slime-tracker-row]');
      if (tracker) {
        const item = state.trackers.find((entry) => entry.key === tracker.dataset.slimeTrackerRow);
        if (item) host.showToast?.({ title: item.name, message: `${item.battery}% 电量 · ${item.status === 'connected' ? '无线连接正常' : '等待连接'}`, icon: 'i-box' });
      }
    });
    root.addEventListener('input', (event) => {
      const range = event.target.closest('[data-slime-range]');
      if (!range) return;
      state.smoothing = Number(range.value);
      const label = $('b', range.closest('.slime-slider'));
      if (label) label.textContent = `${state.smoothing}%`;
    });
    render();
    return { open() { render(); }, reset() { clearInterval(calibrationTimer); calibrationTimer = null; Object.assign(state, { calibrating: false, progress: 0, locked: false, smoothing: 62, prediction: true, fullBody: true }); state.trackers.forEach((tracker) => { tracker.status = tracker.key === 'rightFoot' ? 'offline' : 'connected'; }); render(); } };
  }

  window.AISniperSteam = { init };
})();
