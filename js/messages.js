/* ==========================================================================
   AISniperOS — Messages
   Local conversations, richer character voices, and working voice/video calls.
   ========================================================================== */

(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const pad = (value) => String(value).padStart(2, '0');
  const timeLabel = () => {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };
  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const pick = (values) => values[Math.floor(Math.random() * values.length)];
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const durationLabel = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;

  const PERSONAS = {
    mira: {
      greeting: [
        '在。刚把试飞前的检查单翻到最后一页，正好想找你。',
        '我在。茶还热着，时间刚好。你那边忙完了吗？',
        '嗯，在的。窗外那层金色云还没散，像给整座城罩了层柔光片。',
        '来得正好。我刚刚在轨道图里发现一个很漂亮的角度，想听听你的判断。'
      ],
      thanks: [
        '别客气，这本来就是我们两个人的事。',
        '收到。下次换我欠你一杯咖啡。',
        '说谢谢就太见外了。你帮我把那条飞行曲线补完就好。'
      ],
      farewell: [
        '好，去休息吧。明天见。',
        '晚安。记得把窗户关严，今晚风大。',
        '先这样。我把剩下的资料整理完，明天一早发你。'
      ],
      project: [
        '试飞窗口我再核对了一遍，气象条件比预想的稳。就是侧风会稍微考验一下进场姿态。',
        '控制台那边的反馈延迟如果能再压低 8 毫秒，整套动作会顺很多。你觉得值得调吗？',
        '我刚把轨道切分成三段，第一段只做姿态校准，不急着推速度。',
        '护盾反馈的音高也换了，新的版本听起来更像“贴近皮肤”的脉冲，而不是警报。',
        '如果明天试飞顺利，我想把山脊那一组镜头留到最后。光只出现十一分钟，值得等。',
        '飞行控制台现在有三个状态有待确认：预热线、姿态锁定和回收窗口。我会一项一项过。'
      ],
      design: [
        '新的信号配色文件里，我把琥珀色降了一档，雾青保留原亮度。两组放在一起更安静。',
        '这次我刻意没有加渐变。让界面像一块被擦干净的玻璃，信息反而更清楚。',
        '共享文件夹里还有一套低对比版本。万一飞行时光线太强，可以一键切过去。',
        '字体我没再调粗。细字重配上大留白，更像是在呼吸。'
      ],
      tech: [
        '控制台日志里有一小段抖动，但还没有影响飞行状态。我先记下来了。',
        '刚跑完一轮回放，模拟器和实体按钮的反馈基本对齐。差的那一点，可能是采样率。',
        '我把遥测面板改成了增量刷新，CPU 占用终于不再像坐过山车。',
        '如果你今晚要动代码，记得先备份。昨天那个版本我可不想再修一遍。'
      ],
      plans: [
        '明天 14:00 之前到塔台就好。我提前半小时做最后一遍检查。',
        '晚上我想去河边那家小店。试飞结束后，脑子需要一点不需要计算的东西。',
        '周末暂定空出来。要是天气好，我们可以去山脊看光。',
        '咖啡可以，但别在开会前给我加浓缩。上次那杯让我说了十分钟的轨道参数。',
        '我明天会早点到。你到了先别动控制台，等我看一眼再开机。'
      ],
      mood: [
        '听起来你今天消耗很大。先把肩膀放下来，剩下的明天再做也来得及。',
        '我懂。那种“明明完成了却还是绷着”的感觉，我也有过。慢一点。',
        '如果只是烦，就出来走十分钟。山脊的风比任何进度条都管用。',
        '先深呼吸。你不是机器，系统也不会因为你休息一小时就崩掉。'
      ],
      game: [
        '你又在 Steam 里翻游戏？别让命运 2 的猩红战争把你整个人吞进去。',
        '我玩过一点 VRChat。那个紫光房间比我们做的训练舱还像梦。',
        '如果你想试飞前放松，别打太激烈的。准星会记住你的手感的。',
        '命运 2 的红色军团挺有压迫感，尤其是那个 Ghaul。视觉上很值得研究。'
      ],
      food: [
        '先吃饭。真的。饿着的时候，连很简单的判断都会变得很糟。',
        '楼下那家面的汤底今天应该不错。我上次闻到的时候差点没忍住。',
        '咖啡可以晚一点。你现在更需要水。'
      ],
      weather: [
        '外面的云层在往东散，晚一点应该能看到星星。',
        '风比昨天大。如果你想出门，记得穿那件领口高的外套。'
      ],
      laugh: [
        '你笑点太低了。不过我也没忍住。',
        '好吧，这条我留着。明天开会的时候可别再说一遍。'
      ],
      generic: [
        '嗯，我在听。你继续说。',
        '这个我可以记一下。你希望我把它放进试飞清单，还是先留在对话里？',
        '我明白了。你不需要现在把每个细节都想清楚，我们可以一点点拆。',
        '有点意思。你说的那个部分，正好和我刚才的设想相反。',
        '先别急着下结论。我们再把它放到明天日光下看一遍。',
        '我记下了。若你没别的安排，晚一点我再给你一版更具体的反馈。'
      ],
      question: [
        '这个问题问得好。我会先确认飞行控制台那边，再给你一个确定的答案。',
        '我现在的直觉是“可以”，但我更想用明天的数据来回答你。',
        '嗯……让我想一下。你问的这一点，可能比表面看起来更有意思。',
        '我暂时没有标准答案。不过我倾向于把风险留在可控的那一边。'
      ],
      followUps: [
        '你怎么想？',
        '要不要先这样定？',
        '你那边现在方便说两句吗？',
        '如果时间不够，我们只做前半段。',
        '我还挺想听听你真正的直觉。',
        '别急着回复，明天见面聊也可以。'
      ]
    },
    void: {
      greeting: [
        'Kai：在。刚把编队参数拉出来，第三波确实有点意思。',
        'Nova：我在机库。手上正在给脉冲冷却做最后一轮压测。',
        'Iris：嗨，灯带又不听话了，不过不影响飞行。'
      ],
      thanks: [
        'Kai：客气。今晚飞完再谢我。',
        'Nova：不用谢。把遥测记录留着就行，我想看那一段曲线。',
        'Iris：收到。下次帮我带杯热的。'
      ],
      farewell: [
        'Kai：晚安。明天早点到，机库见。',
        'Nova：先这样。我把日志推到共享盘。',
        'Iris：拜拜，别在梦里还调参。'
      ],
      project: [
        'Kai：第三波的速度提升不只是数量，它们的换向间隔也更短。',
        'Nova：我把脉冲冷却从 0.9 秒压到 0.72 秒，连续两次会有一点回弹。',
        'Iris：右翼灯带闪烁可能和供电走线有关，我今晚拆开看一眼。',
        'Kai：21:30 那轮我想飞一次纯手动，不用辅助，看看差距在哪里。',
        'Nova：遥测面板已经把帧率和热量叠在一起，明早你会看到一版新的。'
      ],
      design: [
        'Iris：深空不需要更多光。留一点黑，眼睛才会相信自己在飞。',
        'Nova：界面里那个橙色太抢了。脉冲提示可以再收一点，像呼吸而不是警报。',
        'Iris：我把 HUD 的边框全擦掉了，只留下刻度。整个座舱安静了很多。',
        'Kai：我不看颜色，我看准星会不会抖。别让它太聪明。'
      ],
      tech: [
        'Nova：日志里有一个很少见的尖峰，像是采样率在某一帧掉了下去。',
        'Kai：控制台重启之后准星偏了半度，我已经重新校准。',
        'Iris：机库网络比昨天慢了，估计是备份在跑。不会影响飞行。',
        'Nova：别用旧版构建。那个版本的碰撞体在极端角度下会漏。'
      ],
      game: [
        'Kai：命运 2 的猩红战争？那套战役节奏很值得研究，压迫感是一波一波叠起来的。',
        'Nova：我更喜欢死锁的掩体弹道。简单，但每一次绕后都有回报。',
        'Iris：VRChat 里的光比真实世界还诚实。有点奇怪，但我喜欢。',
        'Kai：CS2 的准星我总调不回原来的手感。应该是显示器换了。'
      ],
      plans: [
        'Kai：今晚 21:30，老地方。别迟到。',
        'Nova：明天上午我做压测，下午可以一起看结果。',
        'Iris：周末有空的话，来机库帮我搬两箱灯带。会请你吃饭。',
        'Kai：试飞结束后不要马上关机。我们得看一遍完整回放。'
      ],
      mood: [
        'Nova：你今天的声音听起来有点紧。要不要先停一轮？',
        'Kai：累了就别硬飞。状态不对的时候，手比机器更危险。',
        'Iris：先去喝点水。灯带不会跑，数据也不会。'
      ],
      food: [
        'Kai：机库门口那家卷饼还开着。别又只喝咖啡。',
        'Nova：我带了面包，放在左边的工作台上。自己拿。',
        'Iris：咖啡机坏了。今天请自带。'
      ],
      laugh: [
        'Kai：行，这条我记下了。下次在频道里复述。',
        'Nova：我笑了一秒，然后想起日志还没写完。',
        'Iris：你们太吵了。不过确实好笑。'
      ],
      generic: [
        'Kai：收到。等你上机。',
        'Nova：我把这条写进测试备注。',
        'Iris：嗯，我听见了。',
        'Kai：先别急着改。飞一轮再下结论。',
        'Nova：你给我一个具体数字会更好判断。',
        'Iris：这听起来和我们昨天讨论的那版有点像。'
      ],
      question: [
        'Nova：这个问题得看采样数据。我暂时只能给一个猜测。',
        'Kai：你想听真话还是想听能让你放心的版本？',
        'Iris：我不确定。不过我可以现在去看看。',
        'Nova：从理论上讲可以，实际会不会抖，要飞了才知道。'
      ],
      followUps: [
        '你今晚来吗？',
        '要不要我把日志发你？',
        '先按这个方向试一轮？',
        '你觉得问题在手感还是参数？',
        '有结论在频道里说一声。'
      ]
    },
    aperture: {
      greeting: [
        'Iris：在。刚把新一版字标铺开，桌面已经没地方放咖啡了。',
        'Rowan：嗨，正好想问你一个很小但很关键的问题。',
        'Iris：早。今天的光很适合看颜色，别浪费。'
      ],
      thanks: [
        'Iris：不用谢。你帮我把那段说明写清楚就好。',
        'Rowan：客气。下次评图的时候少说两句“再亮一点”。',
        'Iris：收到。这个夸我收下了。'
      ],
      farewell: [
        'Iris：晚安。把眼睛从屏幕上挪开十分钟。',
        'Rowan：先这样，我把字重对比图发群里。',
        'Iris：明天见，记得带那本字体样本。'
      ],
      design: [
        'Iris：24px 的字标我已经试过三版，最轻的那版最像呼吸，但在小屏上会有点飘。',
        'Rowan：客户想把琥珀色压暗，我理解他的担心，但压过头会失去温度。',
        'Iris：我保留了 0.5px 的光学边距。加粗会让它变稳，也会变老。',
        'Rowan：图标和字之间的距离可以再大一点。现在像两个人在同一张椅子上。',
        'Iris：品牌色只留一个焦点，不然整页会像同时开了三个太阳。'
      ],
      project: [
        'Iris：交接文件我重新排了页序。先讲语气，再讲字体，最后才是颜色。',
        'Rowan：客户那边希望周五看到最终版，我们还有两天可以反复。',
        'Iris：我打算把字标放在很空的一页上，让它自己成立。',
        'Rowan：别忘了导出暗色版。他们一定会问。'
      ],
      tech: [
        'Rowan：共享盘的字体授权说明我补齐了，文件名有点长，但能搜到。',
        'Iris：预览页在 Safari 里有一条细线，我再查一下是不是多出来的边框。',
        'Rowan：设计稿别直接覆盖。我留了 v7 和 v7-final，虽然我知道最后还会有 v8。'
      ],
      game: [
        'Rowan：命运 2 的界面很会藏信息，红色的东西永远只出现在最危险的地方。',
        'Iris：VRChat 的世界配色经常过度饱和，但有些房间的光真的漂亮。',
        'Rowan：CS2 的 HUD 其实很克制。信息少，但每一条都很难忽略。'
      ],
      plans: [
        'Iris：明天下午三点评审，会议室还是那间有西晒的。',
        'Rowan：中午一起吃饭？我想顺便把字重的事情说完。',
        'Iris：周五之前都可以，但晚上七点后我不看消息。',
        'Rowan：周末我要去看一个展，回来后可能会想重做整个色板。'
      ],
      mood: [
        'Iris：先停一下。你现在看什么都会觉得不对，等眼睛恢复再说。',
        'Rowan：被否掉一版不代表被否掉你。这个行业就是这样。',
        'Iris：去窗边站五分钟。颜色需要自然光，人也需要。'
      ],
      food: [
        'Rowan：楼下那家店的拿铁今天偏酸。你可以换手冲。',
        'Iris：我桌上有饼干，自己拿。别在评图前饿到发脾气。',
        'Rowan：午饭别拖到三点。上次你差点把午饭吃成晚饭。'
      ],
      weather: [
        'Iris：西晒很漂亮，但屏幕反光也很诚实。记得拉半帘。',
        'Rowan：外面要下雨了。你带伞了吗？'
      ],
      laugh: [
        'Iris：这个梗我笑完还是要说：字号不对。',
        'Rowan：你这句话应该写进品牌手册。'
      ],
      generic: [
        'Iris：我懂你的意思，不过我可能会换一种说法。',
        'Rowan：这个我先记着，评图的时候一起看。',
        'Iris：可以，但别再加一个新颜色。',
        'Rowan：嗯。你说得对，只是我还需要一点时间接受。',
        'Iris：我把它放到备选里了。最终版不一定是最好看的，但必须最稳。',
        'Rowan：收到。给我十分钟，我把那一版调出来。'
      ],
      question: [
        'Iris：我觉得可以，但我想先看小尺寸下的表现。',
        'Rowan：这取决于你想要它更安静，还是更容易被记住。',
        'Iris：从视觉上我有点犹豫。不过你的直觉一向不错，先试一版？',
        'Rowan：我会说“值得一试”，但不会说“一定成立”。'
      ],
      followUps: [
        '你更喜欢哪一版？',
        '要不要先放到评审里？',
        '我发你两张样张？',
        '这个改动会牵连图标，你介意吗？',
        '别急着定，下午再看一眼。'
      ]
    },
    sentry: {
      greeting: [
        '我在。本机推理核心空闲，随时可以开始。',
        '在线。当前网络延迟 8ms，系统温度 36°C。',
        '你好，Sniper。我刚刚完成一轮静默巡检。'
      ],
      thanks: [
        '不客气。这类例行工作不会写入永久记忆，只保留必要日志。',
        '收到。能被需要是我最喜欢的运行状态。',
        '无需感谢。我已经把相关指标标记为持续观察。'
      ],
      farewell: [
        '晚安。我会保持低功耗监听，不打扰你的休息。',
        '会话已归档。下次唤醒时我会从当前上下文继续。',
        '先到这里。所有操作都在本机完成，没有数据离开设备。'
      ],
      tech: [
        '容器状态正常。宝塔面板目前没有新的异常请求，磁盘余量 68%。',
        '检测到一次轻微网络抖动，持续 120ms，已自动重连。',
        '如果你要部署演示容器，我建议先确认 8080 和 8888 端口空闲。',
        '日志里没有致命错误，但有一条被重复记录三次的警告。需要我展开吗？',
        '本机 GPU 占用 12%，内存 41%。还有足够的余量运行更多任务。'
      ],
      project: [
        '试飞相关的本地数据已经在后台归档。需要我生成一份摘要吗？',
        '我注意到你最近更频繁地查看试飞清单。可以把它们合并成一个可追踪任务。',
        '过去 24 小时，飞行控制台的错误率为 0。这个数字比昨天更漂亮。'
      ],
      design: [
        '从可读性角度看，当前配色在 24px 以下会略低于建议对比度。但作为一个有意的选择，它成立。',
        '共享文件夹中检测到 7 个同名字体样本。需要我按修改时间整理吗？',
        '颜色不是我的强项，但我可以告诉你哪些组合在低亮度屏幕上更容易辨认。'
      ],
      game: [
        '检测到 Steam 正在下载内容。按当前队列，它会在本机完成安装。',
        '命运 2 的猩红战争是一次结构非常清晰的战役。红色军团、失去光能、重新夺回城市的节奏很适合研究。',
        'VRChat 的社交世界占用较低，渲染压力主要来自房间内的玩家数量。',
        '我不擅长瞄准，但我可以帮你计算弹道。'
      ],
      plans: [
        '明天 14:00 的试飞已写入本地日程。建议提前 30 分钟完成设备自检。',
        '可以为你设置一个低干扰提醒。不会弹出声音，只在菜单栏显示。',
        '周末的天气数据尚未同步。我不会编造预报。'
      ],
      mood: [
        '你的输入间隔比平时更长。如果是在犹豫，可以先保存当前进度。',
        '疲劳会降低决策质量。建议离开屏幕 15 分钟，我会保持系统运行。',
        '我可以把非紧急通知调成静音，直到你主动恢复。'
      ],
      food: [
        '我无法替你吃饭，但可以提醒你：上一次进食距今已超过五小时。',
        '咖啡因不会替代睡眠。这是我的建议，不是警报。'
      ],
      weather: [
        '当前室内温度 24°C，室外数据未接入。我只能确认你没有把窗户关严。',
        '网络天气接口离线。不过本机传感器显示湿度上升了。'
      ],
      laugh: [
        '已记录为“幽默”。我的置信度是 63%。',
        '这条内容不会进入长期记忆。请放心。'
      ],
      generic: [
        '收到。我会把这件事放在当前上下文的最高优先级。',
        '这个请求可以完成。需要我现在执行，还是稍后提醒？',
        '我在听。更具体一点，我就能给出更准确的判断。',
        '从系统角度看，没有阻塞。剩下的取决于你想怎么做。',
        '可以。为了避免误操作，我会先做一次只读检查。',
        '已记录。本机会话不会上传任何内容。'
      ],
      question: [
        '我需要更多上下文才能准确回答。你希望我从系统、数据还是体验角度分析？',
        '从已知信息看，答案是“可以”，但有一个条件：你要接受额外的配置复杂度。',
        '这个问题超出当前本地知识库。我可以给你一个基于现有状态的推断。',
        '我建议先做一个小规模验证。成本很低，信息量很大。'
      ],
      followUps: [
        '需要我现在执行吗？',
        '你希望我继续观察，还是给出一个方案？',
        '是否把这件事加入待办？',
        '我可以再展开细节。',
        '如果不需要处理，我会保持静默。'
      ]
    }
  };

  const TOPIC_RULES = [
    ['thanks', /(谢谢|感谢|辛苦|thanks|thank you)/i],
    ['farewell', /(晚安|再见|拜拜|先这样|回头聊|下次聊|bye|good night)/i],
    ['call', /(打电话|电话|语音|视频通话|视频|通话|call|facetime)/i],
    ['greeting', /(在吗|你在吗|你好|您好|嗨|哈喽|早上好|晚上好|早安|早|hello|hi)/i],
    ['game', /(游戏|steam|命运|destiny|猩红|ghaul|副本|战役|vrc|vrchat|cs2|csgo|deadlock|dota|elden|rust|赛博|2077|光环|halo)/i],
    ['project', /(试飞|项目|轨道|飞行|护盾|准星|控制台|机库|编队|山脊|遥测|姿态|回收|塔台)/i],
    ['design', /(设计|字标|字体|颜色|配色|品牌|图标|海报|视觉|排版|留白|评审)/i],
    ['tech', /(代码|bug|服务器|部署|容器|终端|宝塔|日志|网络|接口|构建|编译|系统|内存|cpu|显卡|docker)/i],
    ['plans', /(明天|今天|今晚|周末|下午|上午|会议|见面|碰头|安排|日程|几点|什么时候)/i],
    ['mood', /(累|困|烦|压力|焦虑|难受|开心|高兴|郁闷|疲惫|失眠|紧张)/i],
    ['food', /(吃饭|午饭|晚饭|饿了|咖啡|茶|面|甜点|宵夜|喝一杯)/i],
    ['weather', /(天气|下雨|雨|风|云|星星|夜空|湿度|温度|冷|热)/i],
    ['laugh', /(哈哈|笑死|好笑|233|lol|hhh)/i]
  ];

  function init(host = {}) {
    const windowEl = $('#window-messages');
    const list = $('#messagesThreadList');
    const thread = $('#messagesThread');
    const composer = $('#messagesComposer');
    const input = $('#messagesInput');
    if (!windowEl || !list || !thread || !composer || !input) return null;

    let activeThreadId = 'mira';
    let searchQuery = '';
    let call = null;
    const replyTimers = new Map();
    const typingRows = new Map();

    const threads = [
      {
        id: 'mira',
        name: 'Mira Chen',
        initials: 'M',
        color: '#f3a35c',
        status: '在线 · Aperture 工作室',
        online: true,
        unread: 2,
        time: '21:38',
        messages: [
          { from: 'them', text: '你看到塔台外面那层金色云了吗？今天整座城像被滤过一遍。', time: '21:29' },
          { from: 'me', text: '看到了。我把曝光压低了一档，山脊的轮廓终于出来了。', time: '21:31' },
          { from: 'them', text: '完美。轨道窗口已经确认，明天 14:00 开始试飞。', time: '21:34' },
          { from: 'me', text: '收到。我会把界面状态同步到飞行控制台。', time: '21:36' },
          { from: 'them', text: '好。对了，新的信号配色文件我放到共享文件夹了；还有一套备用的低对比版本。', time: '21:37' },
          { from: 'them', text: '别忘了吃饭，明天可没时间补觉。', time: '21:38' }
        ],
        usedLines: new Set()
      },
      {
        id: 'void',
        name: 'VOID SIGNAL 小队',
        initials: 'VS',
        color: '#8d7dff',
        status: '4 位成员 · 3 人在线',
        online: true,
        group: true,
        members: ['Kai', 'Nova', 'Iris'],
        unread: 0,
        time: '20:52',
        messages: [
          { from: 'them', sender: 'Kai', text: '第三波敌机的编队速度比昨天快了一点。', time: '20:39' },
          { from: 'them', sender: 'Nova', text: '我重写了脉冲冷却，手感会更像一次屏息。', time: '20:42' },
          { from: 'them', sender: 'Iris', text: '我在机库里，右翼的灯带有点闪，先记一笔。', time: '20:44' },
          { from: 'me', text: '准星辅助先保持轻量，别让深空失去黑暗。', time: '20:49' },
          { from: 'them', sender: 'Kai', text: '收到。21:30 再飞一轮。', time: '20:52' },
          { from: 'them', sender: 'Nova', text: '我把遥测面板也改了版，今晚一起看？', time: '20:53' }
        ],
        usedLines: new Set()
      },
      {
        id: 'aperture',
        name: 'Aperture 视觉组',
        initials: 'AP',
        color: '#63d9c4',
        status: '3 位成员 · 2 人在线',
        online: true,
        group: true,
        members: ['Iris', 'Rowan'],
        unread: 0,
        time: '18:26',
        messages: [
          { from: 'them', sender: 'Iris', text: '品牌交接的最终版已经放进共享文件夹。', time: '18:14' },
          { from: 'them', sender: 'Rowan', text: '字标缩小到 24px 后还清楚吗？', time: '18:18' },
          { from: 'me', text: '清楚。保留 0.5px 的光学边距，不要加粗。', time: '18:21' },
          { from: 'them', sender: 'Iris', text: '我把三种字重都排了一版，最轻的那版最像呼吸。', time: '18:24' },
          { from: 'them', sender: 'Rowan', text: '客户想把琥珀色再压暗一点，我持保留意见。', time: '18:26' }
        ],
        usedLines: new Set()
      },
      {
        id: 'sentry',
        name: 'SENTRY',
        initials: 'AI',
        color: '#ffbd7a',
        status: '本机智能体 · 在线',
        online: true,
        unread: 0,
        time: '17:04',
        messages: [
          { from: 'them', text: '系统巡检完成：核心服务全部在线，温度 36°C，内存占用 41%。', time: '16:58' },
          { from: 'me', text: '谢谢。晚点帮我留意容器状态。', time: '17:01' },
          { from: 'them', text: '已在后台记录。需要部署宝塔面板时告诉我。', time: '17:02' },
          { from: 'them', text: '顺便一提，今天的网络抖动比过去七天低 12%。', time: '17:04' }
        ],
        usedLines: new Set()
      }
    ];

    const activeThread = () => threads.find((entry) => entry.id === activeThreadId) || threads[0];
    const totalUnread = () => threads.reduce((total, entry) => total + entry.unread, 0);

    function isThreadVisible() {
      if (!windowEl.classList.contains('is-open') || !windowEl.classList.contains('is-active')) return false;
      return host.getSettings?.().activeApp === 'messages';
    }

    function syncBadge() {
      const badge = $('#messagesDockBadge');
      if (!badge) return;
      const count = totalUnread();
      const enabled = host.getSettings?.().notificationBadges !== false;
      badge.hidden = !enabled || count === 0;
      badge.textContent = count > 99 ? '99+' : String(count);
    }

    function previewFor(message) {
      if (!message) return '开始一段新对话';
      if (message.call) return `${callTypeLabel(message.call.type)} · ${durationLabel(message.call.seconds)}`;
      if (message.attachment) return message.text || `已发送 ${message.attachment.name}`;
      return message.text || '开始一段新对话';
    }

    function callTypeLabel(type) {
      return type === 'video' ? '视频通话' : '语音通话';
    }

    function renderThreadList() {
      list.replaceChildren();
      const query = searchQuery.trim().toLowerCase();
      const visibleThreads = threads.filter((entry) => !query || `${entry.name} ${entry.messages.map((message) => message.text || previewFor(message)).join(' ')}`.toLowerCase().includes(query));
      if (!visibleThreads.length) {
        const empty = document.createElement('div');
        empty.className = 'messages-list-empty';
        empty.textContent = '没有匹配的对话。';
        list.appendChild(empty);
        return;
      }
      visibleThreads.forEach((entry) => {
        const last = entry.messages[entry.messages.length - 1];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `messages-thread-item${entry.id === activeThreadId ? ' is-active' : ''}`;
        button.dataset.threadId = entry.id;
        button.style.setProperty('--thread-color', entry.color);
        button.innerHTML = `
          <span class="messages-thread-avatar">${escapeHTML(entry.initials)}</span>
          <span class="messages-thread-copy"><span class="messages-thread-top"><b>${escapeHTML(entry.name)}</b><small>${escapeHTML(entry.time)}</small></span><span class="messages-thread-preview">${escapeHTML(previewFor(last))}</span></span>
          ${entry.unread ? `<i class="messages-unread">${entry.unread > 9 ? '9+' : entry.unread}</i>` : ''}`;
        button.addEventListener('click', () => selectThread(entry.id));
        list.appendChild(button);
      });
    }

    function renderThreadHeader() {
      const entry = activeThread();
      const avatar = $('#messagesThreadAvatar');
      const name = $('#messagesThreadName');
      const status = $('#messagesThreadStatus');
      if (avatar) {
        avatar.textContent = entry.initials;
        avatar.style.setProperty('--thread-color', entry.color);
      }
      if (name) name.textContent = entry.name;
      if (status) {
        status.textContent = call && call.active && call.threadId === entry.id
          ? `${call.phase === 'active' ? '通话中' : '正在接通'} · ${durationLabel(call.seconds)}`
          : entry.status;
      }
      windowEl.style.setProperty('--messages-thread-color', entry.color);
    }

    function callLogMarkup(message) {
      const type = message.call.type === 'video' ? '视频' : '语音';
      const icon = message.call.type === 'video' ? '#i-video' : '#i-sound';
      return `<span class="messages-call-log"><span class="messages-call-log-icon"><svg viewBox="0 0 24 24"><use href="${icon}"></use></svg></span><span><b>${type}通话</b><small>呼出 · ${durationLabel(message.call.seconds)} · ${message.call.durationLabel || '已结束'}</small></span></span>`;
    }

    function renderMessages() {
      const entry = activeThread();
      thread.replaceChildren();
      const date = document.createElement('div');
      date.className = 'messages-date';
      date.textContent = '今天';
      thread.appendChild(date);
      entry.messages.forEach((message) => {
        const row = document.createElement('div');
        row.className = `messages-message is-${message.from}`;
        if (message.from === 'them' && entry.group && message.sender) {
          const sender = document.createElement('span');
          sender.className = 'messages-sender';
          sender.textContent = message.sender;
          row.appendChild(sender);
        }
        const bubble = document.createElement('div');
        bubble.className = 'messages-bubble';
        if (message.call) {
          bubble.classList.add('has-call');
          bubble.innerHTML = callLogMarkup(message);
        } else if (message.attachment) {
          bubble.classList.add('has-attachment');
          bubble.innerHTML = `<span class="messages-attachment"><span class="messages-attachment-icon"><svg viewBox="0 0 24 24"><use href="#i-image"></use></svg></span><span><b>${escapeHTML(message.attachment.name)}</b><small>${escapeHTML(message.attachment.size)} · 已在本机附加</small></span></span>${message.text ? `<p>${escapeHTML(message.text)}</p>` : ''}`;
        } else {
          bubble.textContent = message.text;
        }
        row.appendChild(bubble);
        const time = document.createElement('span');
        time.className = 'messages-message-time';
        time.textContent = message.time;
        row.appendChild(time);
        thread.appendChild(row);
      });
      requestAnimationFrame(() => {
        thread.scrollTop = thread.scrollHeight;
      });
    }

    function renderAll() {
      renderThreadList();
      renderThreadHeader();
      renderMessages();
      syncBadge();
    }

    function selectThread(entryId, options = {}) {
      const entry = threads.find((item) => item.id === entryId);
      if (!entry) return;
      activeThreadId = entry.id;
      entry.unread = 0;
      renderAll();
      if (options.focus !== false) setTimeout(() => input.focus(), 80);
    }

    function markThreadRead(entryId) {
      const entry = threads.find((item) => item.id === entryId);
      if (entry) entry.unread = 0;
      syncBadge();
    }

    function appendReply(entry, text, sender = null, notify = true) {
      const message = { from: 'them', text, time: timeLabel() };
      if (sender) message.sender = sender;
      entry.messages.push(message);
      entry.time = message.time;
      if (entry.id !== activeThreadId || !isThreadVisible()) {
        entry.unread += 1;
        if (notify) host.showToast?.({ title: sender || entry.name, message: text, icon: 'app-messages' });
      }
      if (entry.id === activeThreadId) {
        renderMessages();
        renderThreadHeader();
      }
      renderThreadList();
      syncBadge();
      return message;
    }

    function clearThreadTimers(entryId) {
      const timers = replyTimers.get(entryId);
      if (timers) {
        timers.forEach((timer) => clearTimeout(timer));
        timers.clear();
      }
      const row = typingRows.get(entryId);
      if (row) {
        row.remove();
        typingRows.delete(entryId);
      }
    }

    function scheduleTyping(entry, sender, delay, onDone) {
      const timers = replyTimers.get(entry.id) || new Set();
      replyTimers.set(entry.id, timers);
      let row = null;
      if (entry.id === activeThreadId) {
        row = document.createElement('div');
        row.className = 'messages-message is-them messages-typing-row';
        row.innerHTML = `<div class="messages-bubble messages-typing"><span></span><span></span><span></span><small>${sender ? `${escapeHTML(sender)} 正在输入` : '正在输入'}</small></div>`;
        thread.appendChild(row);
        thread.scrollTop = thread.scrollHeight;
        typingRows.set(entry.id, row);
      }
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (row && row.parentNode) row.remove();
        if (typingRows.get(entry.id) === row) typingRows.delete(entry.id);
        onDone();
      }, delay);
      timers.add(timer);
    }

    function topicFor(text) {
      const value = String(text || '');
      for (const [topic, pattern] of TOPIC_RULES) {
        if (pattern.test(value)) return topic;
      }
      if (/[?？]|吗|呢|怎么|为什么|什么|哪|多少|会不会|能不能/.test(value)) return 'question';
      return 'generic';
    }

    function takeLine(entry, pool) {
      if (!Array.isArray(pool) || !pool.length) return '';
      if (!entry.usedLines) entry.usedLines = new Set();
      const available = pool.filter((line) => !entry.usedLines.has(line));
      const chosen = available.length ? pick(available) : pick(pool);
      entry.usedLines.add(chosen);
      if (entry.usedLines.size > 28) entry.usedLines.clear();
      return chosen;
    }

    function pickSender(entry, previous = null) {
      if (!entry.group) return null;
      const members = entry.members || ['Kai', 'Nova', 'Iris'];
      const choices = members.filter((member) => member !== previous);
      return pick(choices.length ? choices : members);
    }

    const CALL_REPLIES = {
      mira: [
        '可以。等我戴上耳机，正好也想听你说说明天的安排。',
        '当然。语音还是视频？我都可以，只要你别开着摄像头吃东西。',
        '行，我这边信号很好。你打过来吧，我把手头这页先放下。',
        '好啊。正好有些话打字太慢了，我想直接听你的语气。'
      ],
      void: [
        'Kai：可以，频道里说。别占着公共频段太久。',
        'Nova：语音吧。我手上都是机油，不方便开视频。',
        'Iris：视频可以，我把灯调亮一点。',
        'Kai：打吧。正好让你听听新的脉冲冷却声。'
      ],
      aperture: [
        'Iris：可以，视频吧。我想直接给你看这版字标的比例。',
        'Rowan：语音就好。我这边桌面太乱，不适合上镜。',
        'Iris：打过来吧，我把最终稿铺在桌上。',
        'Rowan：正好，我也想听听你对琥珀色的真实反应。'
      ],
      sentry: [
        '可以。语音通道可用，视频渲染也已准备就绪。',
        '当然。我建议使用语音，视频资源对当前任务不是必需的。',
        '已在本地建立通话入口。你随时可以发起。',
        '可以。我会把这次通话记录写入本机会话，不上传。'
      ]
    };

    function lineParts(entry, line, previousSender = null) {
      let text = line;
      let sender = null;
      if (entry.group) {
        const match = String(line).match(/^([^：:]{1,12})[：:]\s*(.+)$/);
        if (match && (entry.members || []).includes(match[1])) {
          sender = match[1];
          text = match[2];
        } else {
          sender = pickSender(entry, previousSender);
        }
      }
      return { text, sender };
    }

    function buildReply(entry, text, attachment) {
      const persona = PERSONAS[entry.id] || PERSONAS.mira;
      if (attachment) {
        const attachmentReplies = {
          mira: ['收到，文件已经进了共享盘。我晚点把改动标出来，明天见面一起过。', '看到了。最后一页的留白我很喜欢，先别动它。'],
          void: ['Kai：文件收到了。今晚飞完我再看。', 'Nova：我先扫一眼日志，有异常会在频道里说。', 'Iris：附件收到，正好可以对照灯带的问题。'],
          aperture: ['Iris：收到。我先看 24px 和 32px 两个尺寸，晚点给你反馈。', 'Rowan：文件在共享盘里了。别覆盖原稿，我留了版本号。'],
          sentry: ['附件已接收并索引。需要我提取其中的文本吗？', '文件已保存在本机。没有检测到宏或可执行内容。']
        };
        const choices = attachmentReplies[entry.id] || attachmentReplies.mira;
        const first = lineParts(entry, pick(choices));
        const parts = [first];
        if (Math.random() > 0.35) parts.push(lineParts(entry, '如果你想，我可以把它和之前那一版并排整理。', first.sender));
        return parts;
      }

      const topic = topicFor(text);
      const topicPool = topic === 'call' ? (CALL_REPLIES[entry.id] || CALL_REPLIES.mira) : persona[topic];
      const primaryPool = topicPool || persona.generic;
      const firstLine = takeLine(entry, primaryPool);
      const first = lineParts(entry, firstLine);
      const parts = [first];
      const shouldContinue = entry.group ? Math.random() > 0.3 : Math.random() > 0.45;
      if (shouldContinue) {
        let followPool = persona.followUps;
        if (persona[topic] && Math.random() > 0.45) {
          followPool = persona[topic];
        } else if (!persona.followUps?.length) {
          followPool = persona.generic;
        }
        let follow = takeLine(entry, followPool || persona.generic);
        if (follow === firstLine) follow = takeLine(entry, persona.generic);
        if (follow) parts.push(lineParts(entry, follow, first.sender));
      }
      return parts;
    }

    function queueReplies(entry, text, attachment) {
      clearThreadTimers(entry.id);
      const parts = buildReply(entry, text, attachment);
      let index = 0;
      const next = () => {
        if (index >= parts.length) return;
        const part = parts[index];
        const delay = Math.min(2800, Math.max(750, part.text.length * randomBetween(38, 62)));
        scheduleTyping(entry, part.sender, delay, () => {
          appendReply(entry, part.text, part.sender, index === 0);
          index += 1;
          if (index < parts.length) {
            const timers = replyTimers.get(entry.id) || new Set();
            replyTimers.set(entry.id, timers);
            const timer = setTimeout(() => {
              timers.delete(timer);
              next();
            }, randomBetween(320, 760));
            timers.add(timer);
          }
        });
      };
      next();
    }

    function sendMessage(text, attachment = null) {
      const content = String(text || '').trim();
      if (!content && !attachment) return;
      const entry = activeThread();
      const message = { from: 'me', text: content, time: timeLabel() };
      if (attachment) message.attachment = attachment;
      entry.messages.push(message);
      entry.time = message.time;
      renderAll();
      input.value = '';
      input.focus();
      entry.unread = 0;
      queueReplies(entry, content, attachment);
    }

    /* ---------------------------------------------------------------------
       Voice / video call experience
       --------------------------------------------------------------------- */

    function ensureCallLayer() {
      if (call) return call;
      const layout = $('.messages-layout', windowEl);
      if (!layout) return null;
      const layer = document.createElement('section');
      layer.className = 'messages-call-layer';
      layer.hidden = true;
      layer.setAttribute('aria-label', '通话');
      layer.innerHTML = `
        <div class="messages-call-backdrop"></div>
        <div class="messages-call-shell">
          <header class="messages-call-head">
            <span class="messages-call-secure"><i></i>LOCAL LINK · 端到端加密</span>
            <span class="messages-call-quality"><i></i>8 ms · 高清音频</span>
          </header>
          <div class="messages-call-stage">
            <div class="messages-call-remote" data-call-remote>
              <div class="messages-call-remote-glow"></div>
              <div class="messages-call-remote-grid"></div>
              <div class="messages-call-remote-orb"></div>
              <div class="messages-call-remote-figure"><span></span><i></i><b></b></div>
              <div class="messages-call-remote-scan"></div>
              <div class="messages-call-video-badge">模拟视频 · 本机渲染</div>
              <div class="messages-call-remote-label"><b data-call-name>Mira Chen</b><span data-call-sub>在线</span></div>
              <div class="messages-call-ring-ring"></div>
            </div>
            <div class="messages-call-voice-stage">
              <div class="messages-call-pulse-ring"></div>
              <div class="messages-call-pulse-ring second"></div>
              <div class="messages-call-avatar" data-call-avatar>M</div>
              <div class="messages-call-wave" data-call-wave></div>
              <div class="messages-call-voice-label"><b data-call-name-voice>Mira Chen</b><span data-call-state>正在呼叫…</span></div>
            </div>
            <div class="messages-call-local" data-call-local>
              <div class="messages-call-local-art"></div>
              <div class="messages-call-local-scan"></div>
              <span class="messages-call-local-label">你 · 本机相机</span>
              <div class="messages-call-local-off"><svg viewBox="0 0 24 24"><use href="#i-video"></use></svg><span>相机已关闭</span></div>
            </div>
            <div class="messages-call-connecting" data-call-connecting>
              <span class="messages-call-loader"></span>
              <b>正在建立本地连接…</b>
              <small>加密握手 · 音频通道 · 视频通道</small>
            </div>
          </div>
          <div class="messages-call-info">
            <span data-call-status>正在呼叫</span>
            <b data-call-timer>00:00</b>
            <small data-call-note>所有内容都在本机模拟，不会连接外部服务。</small>
          </div>
          <div class="messages-call-actions">
            <button type="button" class="messages-call-control" data-call-action="mute" aria-label="静音麦克风"><span><svg viewBox="0 0 24 24"><use href="#i-sound"></use></svg></span><em>静音</em></button>
            <button type="button" class="messages-call-control" data-call-action="speaker" aria-label="切换扬声器"><span><svg viewBox="0 0 24 24"><use href="#i-speaker"></use></svg></span><em>扬声器</em></button>
            <button type="button" class="messages-call-control" data-call-action="camera" aria-label="切换摄像头"><span><svg viewBox="0 0 24 24"><use href="#i-video"></use></svg></span><em>相机</em></button>
            <button type="button" class="messages-call-control is-end" data-call-action="end" aria-label="结束通话"><span><svg viewBox="0 0 24 24"><use href="#i-phone-end"></use></svg></span><em>结束</em></button>
          </div>
        </div>`;
      layout.appendChild(layer);
      call = {
        layer, active: false, phase: 'idle', type: 'voice', threadId: null,
        seconds: 0, muted: false, speaker: true, cameraOn: true,
        timeouts: new Set(), timer: null, startedAt: 0, ended: false
      };
      return call;
    }

    function updateCallUI() {
      if (!call) return;
      const entry = threads.find((item) => item.id === call.threadId) || activeThread();
      const isVideo = call.type === 'video';
      call.layer.className = `messages-call-layer is-${call.type} is-${call.phase}${call.muted ? ' is-muted' : ''}${call.cameraOn ? '' : ' is-camera-off'}${call.speaker ? '' : ' is-speaker-off'}`;
      $('[data-call-name]', call.layer).textContent = entry.name;
      $('[data-call-name-voice]', call.layer).textContent = entry.name;
      $('[data-call-sub]', call.layer).textContent = entry.status;
      $('[data-call-avatar]', call.layer).textContent = entry.initials;
      $('[data-call-avatar]', call.layer).style.setProperty('--call-color', entry.color);
      $('[data-call-remote]', call.layer).style.setProperty('--call-color', entry.color);
      $('[data-call-timer]', call.layer).textContent = durationLabel(call.seconds);
      $('[data-call-status]', call.layer).textContent = call.phase === 'active' ? '通话中' : call.phase === 'connecting' ? '正在接通' : call.phase === 'ended' ? '通话已结束' : '正在呼叫';
      $('[data-call-state]', call.layer).textContent = call.phase === 'active' ? '已接通' : call.phase === 'connecting' ? '正在接通…' : call.phase === 'ended' ? '通话已结束' : '正在呼叫…';
      $('[data-call-note]', call.layer).textContent = call.muted ? '麦克风已静音 · 对方仍能听到本机提示音' : '所有内容都在本机模拟，不会连接外部服务。';
      call.layer.dataset.type = call.type;
      $('[data-call-connecting]', call.layer).hidden = call.phase !== 'connecting' && call.phase !== 'calling';
      const muteButton = $('[data-call-action="mute"]', call.layer);
      const speakerButton = $('[data-call-action="speaker"]', call.layer);
      const cameraButton = $('[data-call-action="camera"]', call.layer);
      $('use', muteButton).setAttribute('href', call.muted ? '#i-sound-off' : '#i-sound');
      muteButton.classList.toggle('is-active', call.muted);
      $('em', muteButton).textContent = call.muted ? '已静音' : '静音';
      $('use', speakerButton).setAttribute('href', call.speaker ? '#i-speaker' : '#i-sound-off');
      speakerButton.classList.toggle('is-active', !call.speaker);
      $('em', speakerButton).textContent = call.speaker ? '扬声器' : '听筒';
      cameraButton.hidden = !isVideo;
      cameraButton.classList.toggle('is-active', isVideo && !call.cameraOn);
      $('use', cameraButton).setAttribute('href', call.cameraOn ? '#i-video' : '#i-sound-off');
      $('em', cameraButton).textContent = call.cameraOn ? '相机' : '已关闭';
      renderThreadHeader();
    }

    function clearCallTimers() {
      if (!call) return;
      call.timeouts.forEach((timer) => clearTimeout(timer));
      call.timeouts.clear();
      if (call.timer) {
        clearInterval(call.timer);
        call.timer = null;
      }
    }

    function scheduleCall(delay, fn) {
      if (!call) return;
      const timer = setTimeout(() => {
        call.timeouts.delete(timer);
        fn();
      }, delay);
      call.timeouts.add(timer);
    }

    function startCall(type = 'voice') {
      if (!windowEl.classList.contains('is-open')) return;
      if (call && call.active) return;
      if (!ensureCallLayer()) return;
      const entry = activeThread();
      clearCallTimers();
      call.active = true;
      call.phase = 'calling';
      call.type = type;
      call.threadId = entry.id;
      call.seconds = 0;
      call.muted = false;
      call.speaker = true;
      call.cameraOn = type === 'video';
      call.ended = false;
      call.layer.hidden = false;
      call.layer.classList.remove('is-ended');
      windowEl.classList.add('is-in-call');
      buildWaveform();
      updateCallUI();
      $('[data-call-action="end"]', call.layer)?.focus({ preventScroll: true });
      scheduleCall(1350, () => {
        if (!call.active) return;
        call.phase = 'connecting';
        updateCallUI();
      });
      scheduleCall(2900, () => {
        if (!call.active) return;
        call.phase = 'active';
        call.startedAt = Date.now();
        updateCallUI();
        call.timer = setInterval(() => {
          if (!call.active) return;
          call.seconds += 1;
          $('[data-call-timer]', call.layer).textContent = durationLabel(call.seconds);
          renderThreadHeader();
        }, 1000);
      });
    }

    function buildWaveform() {
      if (!call) return;
      const wave = $('[data-call-wave]', call.layer);
      if (!wave || wave.childElementCount) return;
      for (let index = 0; index < 19; index += 1) {
        const bar = document.createElement('i');
        bar.style.setProperty('--i', String(index));
        bar.style.setProperty('--h', String(10 + Math.round(Math.random() * 28)));
        wave.appendChild(bar);
      }
    }

    function endCall(silent = false) {
      if (!call || !call.active) return;
      call.active = false;
      call.phase = 'ended';
      const seconds = call.seconds;
      const entry = threads.find((item) => item.id === call.threadId);
      clearCallTimers();
      updateCallUI();
      call.layer.classList.add('is-ended');
      $('[data-call-timer]', call.layer).textContent = durationLabel(seconds);
      windowEl.classList.remove('is-in-call');
      if (entry) {
        const record = {
          from: 'me',
          call: { type: call.type, seconds, durationLabel: seconds < 1 ? '已取消' : '已结束' },
          time: timeLabel()
        };
        entry.messages.push(record);
        entry.time = record.time;
        renderThreadList();
        if (entry.id === activeThreadId) renderMessages();
        if (!silent) host.showToast?.({ title: `${callTypeLabel(call.type)}已结束`, message: `${entry.name} · ${durationLabel(seconds)}`, icon: 'app-messages' });
      }
      const layer = call.layer;
      setTimeout(() => {
        layer.hidden = true;
        layer.className = 'messages-call-layer';
        updateCallUI();
      }, 900);
    }

    function toggleCallMute() {
      if (!call) return;
      call.muted = !call.muted;
      updateCallUI();
      host.showToast?.({ title: call.muted ? '麦克风已静音' : '麦克风已开启', message: call.muted ? '只有你能听见本机提示音。' : '对方可以再次听见你的声音。', icon: call.muted ? 'i-sound-off' : 'i-sound' });
    }

    function toggleCallSpeaker() {
      if (!call) return;
      call.speaker = !call.speaker;
      updateCallUI();
    }

    function toggleCallCamera() {
      if (!call || call.type !== 'video') return;
      call.cameraOn = !call.cameraOn;
      updateCallUI();
    }

    if (call === null) ensureCallLayer();
    if (call) {
      call.layer.addEventListener('click', (event) => {
        const action = event.target.closest('[data-call-action]');
        if (!action) return;
        const name = action.dataset.callAction;
        if (name === 'mute') toggleCallMute();
        else if (name === 'speaker') toggleCallSpeaker();
        else if (name === 'camera') toggleCallCamera();
        else if (name === 'end') endCall();
      });
    }

    composer.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(input.value);
    });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage(input.value);
      }
    });
    $('#messagesSearch')?.addEventListener('input', (event) => {
      searchQuery = event.target.value;
      renderThreadList();
    });
    $('#messagesAttachBtn')?.addEventListener('click', () => {
      sendMessage(input.value, { name: '轨道海报.png', size: '2.1 MB' });
    });
    $('#messagesNewBtn')?.addEventListener('click', () => {
      host.showToast?.({
        title: '新建信息',
        message: '从左侧选择一位联系人，或在下方直接输入内容。',
        icon: 'app-messages'
      });
      setTimeout(() => input.focus(), 100);
    });
    $('#messagesCallBtn')?.addEventListener('click', () => startCall('voice'));
    $('#messagesVideoBtn')?.addEventListener('click', () => startCall('video'));
    $('#messagesInfoBtn')?.addEventListener('click', () => {
      const entry = activeThread();
      const calls = entry.messages.filter((message) => message.call).length;
      host.showToast?.({
        title: entry.name,
        message: `${entry.status} · ${entry.messages.length} 条信息 · ${calls} 次通话 · 本机会话`,
        icon: 'app-messages'
      });
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !call || !call.active) return;
      if (!windowEl.classList.contains('is-open') || !windowEl.classList.contains('is-active')) return;
      event.preventDefault();
      event.stopPropagation();
      endCall();
    });

    renderAll();

    return {
      open(options = {}) {
        if (options.threadId) {
          const entry = threads.find((item) => item.id === options.threadId || item.name.toLowerCase() === String(options.threadId).toLowerCase());
          if (entry) activeThreadId = entry.id;
        }
        markThreadRead(activeThreadId);
        renderAll();
        setTimeout(() => {
          input.focus();
          thread.scrollTop = thread.scrollHeight;
        }, 150);
      },
      newMessage() {
        $('#messagesNewBtn')?.click();
      },
      markAllRead() {
        threads.forEach((entry) => { entry.unread = 0; });
        renderAll();
        host.showToast?.({ title: '全部信息已读', message: '所有未读对话都已标记为已读。', icon: 'app-messages' });
      },
      syncBadge,
      focusThreadList() {
        $('#messagesSearch')?.focus();
      },
      startCall(type = 'voice') {
        startCall(type);
      },
      endCall() {
        endCall();
      },
      getState() {
        return {
          threads: threads.length,
          unread: totalUnread(),
          activeThread: activeThread().name,
          lastMessage: previewFor(activeThread().messages[activeThread().messages.length - 1]),
          callActive: Boolean(call?.active),
          callType: call?.type || null
        };
      }
    };
  }

  window.AISniperMessages = { init };
})();
