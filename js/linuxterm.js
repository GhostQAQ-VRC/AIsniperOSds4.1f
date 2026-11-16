/* ==========================================================================
   AISniperOS — Linux terminal catalogue
   Data, help pages and destructive-command detection for the local shell.
   Nothing here touches the host filesystem; all paths are simulated.
   ========================================================================== */

(() => {
  'use strict';

  const SYSTEM_INFO = {
    os: 'AISniperOS 26.1.4 LTS (Aquila)',
    kernel: '6.8.0-aisniper',
    arch: 'aarch64',
    host: 'aisniper',
    user: 'sniper'
  };

  const HELP_GROUPS = [
    {
      title: '文件与目录',
      items: [
        ['ls [-lah] [路径]', '列出目录内容'],
        ['cd [路径]', '切换目录，支持 ~、..、- 与绝对路径'],
        ['pwd', '显示当前工作目录'],
        ['touch <文件>', '创建空文件或更新时间戳'],
        ['mkdir [-p] <目录>', '创建目录'],
        ['rmdir <目录>', '删除空目录'],
        ['rm [-rdf] <路径>', '删除文件或目录'],
        ['cp [-r] <源> <目标>', '复制文件或目录'],
        ['mv <源> <目标>', '移动或重命名'],
        ['ln -s <目标> <链接>', '创建符号链接'],
        ['tree [路径]', '以树状图显示目录'],
        ['find [路径] -name <模式>', '递归查找文件'],
        ['stat <文件>', '显示文件元数据'],
        ['file <文件>', '识别文件类型'],
        ['du [-sh] [路径]', '统计目录占用'],
        ['df [-h]', '显示文件系统容量']
      ]
    },
    {
      title: '文本处理',
      items: [
        ['cat [-n] <文件>', '输出文件内容'],
        ['head [-n N] <文件>', '查看文件开头'],
        ['tail [-n N] <文件>', '查看文件结尾'],
        ['less <文件>', '分页查看（模拟）'],
        ['grep [-inr] <模式> [文件]', '搜索文本'],
        ['wc [-lwc] <文件>', '统计行数、词数、字节数'],
        ['sort [-rn] <文件>', '排序文本行'],
        ['uniq [-c] <文件>', '去除相邻重复行'],
        ['cut -d <分隔符> -f <列> <文件>', '按列截取'],
        ['tr <源字符> <目标字符>', '字符替换'],
        ['sed "s/旧/新/g" <文件>', '流式文本替换'],
        ['awk "{print $1}" <文件>', '按列处理文本'],
        ['diff <文件1> <文件2>', '比较两个文件'],
        ['tee <文件>', '把最近输出写入文件'],
        ['printf "<格式>" [参数]', '格式化输出'],
        ['vim / nano <文件>', '模拟编辑器预览']
      ]
    },
    {
      title: '系统与进程',
      items: [
        ['uname -a', '内核与架构信息'],
        ['hostnamectl', '主机与操作系统信息'],
        ['whoami / id / groups', '当前用户与用户组'],
        ['uptime', '运行时间与负载'],
        ['date [+格式] / cal', '日期与日历'],
        ['free -h', '内存使用量'],
        ['ps aux', '进程列表'],
        ['top / htop', '实时进程快照'],
        ['kill <PID> / pkill <名称>', '向进程发送信号'],
        ['systemctl status <服务>', '查看 systemd 服务'],
        ['journalctl -xe', '查看系统日志'],
        ['dmesg', '内核环形缓冲区'],
        ['lsblk / lscpu / lspci / lsusb', '硬件信息'],
        ['mount / umount', '挂载与卸载'],
        ['crontab -l', '查看定时任务'],
        ['env / export / unset', '环境变量'],
        ['which / whereis / type', '定位命令'],
        ['man <命令>', '查看手册页']
      ]
    },
    {
      title: '网络',
      items: [
        ['ip a / ip route', '网络接口与路由'],
        ['ifconfig', '传统网络接口信息'],
        ['ss -tulpn / netstat -tulpn', '监听端口'],
        ['ping <主机>', 'ICMP 连通性测试'],
        ['traceroute <主机>', '路由路径'],
        ['dig / nslookup / host', 'DNS 查询'],
        ['curl <URL>', '模拟 HTTP 请求'],
        ['wget <URL>', '模拟下载'],
        ['ssh user@host', '模拟 SSH 连接'],
        ['scp / rsync', '模拟远程复制'],
        ['nmap <主机>', '模拟端口扫描']
      ]
    },
    {
      title: '软件与开发',
      items: [
        ['apt / apt-get', 'Debian 系包管理'],
        ['dpkg -l', '查看已安装包'],
        ['dnf / yum', 'RHEL 系包管理'],
        ['pacman -Syu', 'Arch 系包管理'],
        ['apk / brew / snap / flatpak', '其它包管理器'],
        ['pip / pip3', 'Python 包管理'],
        ['npm / node', 'Node.js 工具链'],
        ['python / python3', 'Python 解释器'],
        ['git status / log / branch', 'Git 版本控制'],
        ['gcc / make / java / go / rustc', '编译与运行时']
      ]
    },
    {
      title: '用户、权限与归档',
      items: [
        ['sudo <命令>', '以 root 权限执行'],
        ['su', '切换用户（模拟）'],
        ['chmod [-R] <权限> <路径>', '修改权限'],
        ['chown <用户>:<组> <路径>', '修改所有者'],
        ['umask', '显示权限掩码'],
        ['passwd / useradd / userdel', '账户管理（模拟）'],
        ['who / w / users / last', '登录用户'],
        ['tar -czf / -xzf', 'tar 归档'],
        ['zip / unzip / gzip / gunzip', '压缩与解压'],
        ['md5sum / sha256sum', '校验和'],
        ['dd / mkfs / shred', '块设备与镜像工具（模拟）'],
        ['base64', 'Base64 编解码']
      ]
    },
    {
      title: 'Shell 与 AISniperOS',
      items: [
        ['history [-c]', '命令历史'],
        ['alias / unalias', '命令别名'],
        ['bash / sh / zsh', '启动模拟子 shell'],
        ['source <文件> / .', '执行 shell 文件'],
        ['clear / reset / exit', '清屏、重置、退出'],
        ['open <应用>', '打开访达、浏览器、Steam 等'],
        ['music / cinema / textedit / code / runtimes', '打开媒体、创作与运行环境'],
        ['game / void', '启动《深空信号》'],
        ['deploy baota', '部署宝塔面板'],
        ['docker ps / images / run', '模拟容器'],
        ['bt / panel / scripts', '运维台与本地脚本'],
        ['theme / wifi / network', '外观与网络'],
        ['status / neofetch', '系统遥测与身份卡片'],
        ['coffee / cowsay / fortune', '休息一下']
      ]
    }
  ];

  const HELP_INDEX = {};
  HELP_GROUPS.forEach((group) => group.items.forEach(([command, description]) => {
    HELP_INDEX[command.split(/\s+/)[0]] = { command, description, group: group.title };
  }));

  const COMMANDS = [
    'help', 'man', 'info', 'whatis', 'apropos',
    'ls', 'cd', 'pwd', 'cat', 'touch', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'ln', 'find', 'tree', 'stat', 'file', 'du', 'df',
    'head', 'tail', 'less', 'more', 'wc', 'sort', 'uniq', 'cut', 'tr', 'sed', 'awk', 'grep', 'diff', 'tee', 'xargs',
    'chmod', 'chown', 'chgrp', 'umask', 'basename', 'dirname', 'realpath', 'readlink',
    'dd', 'mkfs', 'mkfs.ext4', 'wipefs', 'shred', 'truncate',
    'md5sum', 'sha256sum', 'base64', 'tar', 'zip', 'unzip', 'gzip', 'gunzip',
    'ps', 'top', 'htop', 'kill', 'pkill', 'killall', 'pgrep', 'free', 'vmstat', 'lscpu', 'lsblk', 'lspci', 'lsusb',
    'dmesg', 'journalctl', 'systemctl', 'service', 'mount', 'umount', 'crontab', 'uptime', 'w', 'who', 'users', 'last', 'lastlog',
    'id', 'groups', 'hostname', 'hostnamectl', 'arch', 'nproc', 'date', 'cal', 'timedatectl', 'env', 'printenv', 'export', 'unset', 'alias', 'unalias', 'source', '.',
    'which', 'whereis', 'type', 'command', 'echo', 'printf', 'history', 'clear', 'reset', 'exit', 'sleep', 'seq', 'yes', 'true', 'false', 'test', 'expr', 'bc', 'factor', 'shuf',
    'vim', 'vi', 'nano', 'emacs',
    'ping', 'traceroute', 'tracepath', 'dig', 'nslookup', 'host', 'curl', 'wget', 'ssh', 'scp', 'rsync', 'netstat', 'ss', 'ip', 'ifconfig', 'route', 'arp', 'nmap',
    'apt', 'apt-get', 'dpkg', 'dnf', 'yum', 'pacman', 'apk', 'brew', 'snap', 'flatpak', 'pip', 'pip3', 'npm', 'node', 'python', 'python3', 'git', 'make', 'gcc', 'java', 'go', 'rustc',
    'bash', 'sh', 'zsh',
    'open', 'game', 'void', 'theme', 'wifi', 'network', 'status', 'health', 'neofetch', 'fastfetch', 'whoami', 'uname', 'about', 'sudo', 'su', 'passwd', 'useradd', 'userdel', 'usermod', 'groupadd', 'adduser',
    'coffee', 'cowsay', 'fortune', 'sl', 'matrix', 'cmatrix', 'banner', 'figlet',
    'deploy', 'docker', 'bt', 'panel', 'ops', 'scripts', 'steam', 'cs2', 'vrchat', 'steamvr', 'ovrtk', 'slimevr', 'unity',
    'music', 'cinema', 'video', 'textedit', 'code', 'runtimes'
  ];

  const ALIASES = {
    '?': 'help',
    ll: 'ls -la',
    la: 'ls -a',
    l: 'ls -1',
    dir: 'ls',
    cls: 'clear',
    c: 'clear',
    q: 'exit',
    h: 'history',
    containers: 'docker ps'
  };

  const SYSTEM_FS = {
    '/': {
      dirs: ['bin', 'boot', 'dev', 'etc', 'home', 'lib', 'opt', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var'],
      files: ['swap.img']
    },
    '/bin': {
      dirs: [],
      files: ['bash', 'cat', 'chmod', 'cp', 'date', 'dd', 'df', 'echo', 'grep', 'hostname', 'kill', 'ln', 'ls', 'mkdir', 'mv', 'ps', 'pwd', 'rm', 'rmdir', 'sed', 'sh', 'sleep', 'sort', 'stat', 'tail', 'tar', 'touch', 'uname', 'wc']
    },
    '/boot': {
      dirs: ['grub'],
      files: ['config-6.8.0-aisniper', 'initrd.img-6.8.0-aisniper', 'vmlinuz-6.8.0-aisniper']
    },
    '/boot/grub': { dirs: [], files: ['grub.cfg'] },
    '/dev': { dirs: [], files: ['null', 'random', 'sda', 'sda1', 'tty0', 'urandom', 'zero'] },
    '/etc': {
      dirs: ['nginx', 'ssh'],
      files: ['fstab', 'group', 'hostname', 'hosts', 'os-release', 'passwd', 'resolv.conf', 'shadow']
    },
    '/etc/nginx': { dirs: ['sites-available'], files: ['nginx.conf'] },
    '/etc/nginx/sites-available': { dirs: [], files: ['default'] },
    '/etc/ssh': { dirs: [], files: ['sshd_config'] },
    '/home': { dirs: ['sniper'], files: [] },
    '/proc': { dirs: [], files: ['cpuinfo', 'meminfo', 'mounts', 'uptime', 'version'] },
    '/root': { dirs: [], files: ['.bashrc'] },
    '/tmp': { dirs: [], files: [] },
    '/usr': { dirs: ['bin', 'lib', 'local', 'share'], files: [] },
    '/usr/bin': {
      dirs: [],
      files: ['apt', 'awk', 'curl', 'dig', 'docker', 'git', 'grep', 'htop', 'ip', 'less', 'nano', 'nmap', 'node', 'npm', 'ping', 'python3', 'rsync', 'sed', 'ssh', 'systemctl', 'tar', 'top', 'tree', 'vim', 'wget', 'zip']
    },
    '/usr/local': { dirs: ['bin'], files: [] },
    '/usr/local/bin': { dirs: [], files: ['node', 'npm', 'python3'] },
    '/var': { dirs: ['log', 'www'], files: [] },
    '/var/log': { dirs: [], files: ['auth.log', 'kern.log', 'syslog'] },
    '/var/www': { dirs: ['html'], files: [] },
    '/var/www/html': { dirs: [], files: ['index.html'] }
  };

  const SYSTEM_FILES = {
    '/etc/os-release': [
      'NAME="AISniperOS"',
      'VERSION="26.1.4 LTS (Aquila)"',
      'ID=aisniper',
      'ID_LIKE=debian',
      'PRETTY_NAME="AISniperOS 26.1.4 LTS"',
      'VERSION_ID="26.1.4"',
      'VERSION_CODENAME=aquila',
      'HOME_URL="https://aisniper.local"',
      'SUPPORT_URL="https://aisniper.local/support"',
      'BUG_REPORT_URL="https://aisniper.local/bugs"'
    ].join('\n'),
    '/etc/hostname': 'aisniper\n',
    '/etc/hosts':
      '127.0.0.1\tlocalhost\n127.0.1.1\taisniper\n::1\tlocalhost ip6-localhost ip6-loopback\n192.168.1.20\tvault.local\n192.168.1.1\trouter.local',
    '/etc/passwd':
      'root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nsniper:x:1000:1000:Sniper:/home/sniper:/bin/bash\nnginx:x:998:998:nginx:/var/www:/usr/sbin/nologin',
    '/etc/group':
      'root:x:0:\nsudo:x:27:sniper\nsniper:x:1000:\nwww-data:x:33:nginx\ndocker:x:999:sniper',
    '/etc/fstab':
      '# <file system>  <mount point>  <type>  <options>  <dump>  <pass>\nUUID=8f3a-71c2  /          ext4  defaults,noatime  0  1\nUUID=21b7-04ee  /boot      vfat  umask=0077        0  2\nvault.local:/volume1  /mnt/vault  nfs  defaults  0  0',
    '/etc/resolv.conf': 'nameserver 1.1.1.1\nnameserver 8.8.8.8\nsearch aisniper.local',
    '/etc/ssh/sshd_config':
      'Port 22\nPermitRootLogin no\nPasswordAuthentication yes\nPubkeyAuthentication yes\nX11Forwarding yes\nAllowUsers sniper\n',
    '/etc/nginx/nginx.conf':
      'user www-data;\nworker_processes auto;\nevents { worker_connections 1024; }\nhttp {\n  server {\n    listen 80 default_server;\n    root /var/www/html;\n    index index.html;\n  }\n}',
    '/proc/cpuinfo':
      'processor\t: 0\nmodel name\t: AISniper M1 Neural Core\nBogoMIPS\t: 48.00\nFeatures\t: fp asimd evtstrm aes pmull sha1 sha2 crc32 atomics fphp asimdhp\nCPU implementer\t: 0x41\nCPU architecture: 8\nCPU variant\t: 0x0\nCPU part\t: 0xd0c\n\nprocessor\t: 1\nmodel name\t: AISniper M1 Neural Core\nBogoMIPS\t: 48.00\n',
    '/proc/meminfo':
      'MemTotal:       24576000 kB\nMemFree:         9214368 kB\nMemAvailable:   18734528 kB\nBuffers:          412672 kB\nCached:          6581248 kB\nSwapTotal:       4194304 kB\nSwapFree:        4194304 kB',
    '/proc/version':
      'Linux version 6.8.0-aisniper (build@aquila) (gcc (AISniper OS 13.2.0-aisniper1) 13.2.0) #1 SMP PREEMPT_DYNAMIC Wed Nov 12 02:41:16 UTC 2026',
    '/proc/uptime': '18427.42 72110.08\n',
    '/var/log/syslog':
      'Nov 15 21:40:01 aisniper systemd[1]: Started Daily apt download activities.\nNov 15 21:42:16 aisniper kernel: [ 8421.114] EXT4-fs (sda1): mounted filesystem with ordered data mode.\nNov 15 21:44:02 aisniper sshd[2841]: Accepted publickey for sniper from 192.168.1.42 port 51422 ssh2\nNov 15 21:47:18 aisniper NetworkManager[812]: <info> device (eth0): state change: activated -> activated\nNov 15 21:51:40 aisniper nginx[1180]: 192.168.1.42 - - [15/Nov/2026:21:51:40 +0800] "GET / HTTP/1.1" 200 612',
    '/var/log/auth.log':
      'Nov 15 21:44:02 aisniper sshd[2841]: Accepted publickey for sniper from 192.168.1.42 port 51422 ssh2\nNov 15 21:44:02 aisniper systemd-logind[804]: New session 12 of user sniper.\nNov 15 21:45:11 aisniper sudo:    sniper : TTY=pts/0 ; PWD=/home/sniper ; USER=root ; COMMAND=/usr/bin/apt update',
    '/var/www/html/index.html':
      '<!doctype html>\n<html><head><title>AISniper Node</title></head>\n<body><h1>Meridian edge node online.</h1></body></html>',
    '/root/.bashrc':
      '# ~/.bashrc\nexport PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -la"\nalias grep="grep --color=auto"',
    '/etc/nginx/sites-available/default':
      'server {\n    listen 80 default_server;\n    root /var/www/html;\n    index index.html;\n    location / { try_files $uri $uri/ =404; }\n}'
  };

  const TOOL_VERSIONS = {
    node: 'v22.11.0',
    npm: '10.9.0',
    python: 'Python 3.12.7',
    python3: 'Python 3.12.7',
    pip: 'pip 24.3.1 from /usr/lib/python3/dist-packages/pip (python 3.12)',
    pip3: 'pip 24.3.1 from /usr/lib/python3/dist-packages/pip (python 3.12)',
    git: 'git version 2.47.0',
    gcc: 'gcc (AISniper OS 13.2.0-aisniper1) 13.2.0',
    make: 'GNU Make 4.4.1',
    java: 'openjdk 21.0.5 2024-10-15 LTS',
    go: 'go version go1.23.3 linux/arm64',
    rustc: 'rustc 1.82.0 (f6e511eec 2024-10-15)',
    docker: 'Docker version 27.3.1, build ce12230',
    bash: 'GNU bash, version 5.2.37(1)-release (aarch64-aisniper-linux-gnu)',
    zsh: 'zsh 5.9 (aarch64-aisniper-linux-gnu)',
    curl: 'curl 8.10.1 (aarch64-aisniper-linux-gnu) libcurl/8.10.1 OpenSSL/3.3.2',
    wget: 'GNU Wget 1.24.5 built on linux-gnu.',
    vim: 'VIM - Vi IMproved 9.1 (2024 Jan 02, compiled Nov 10 2026 04:21:11)',
    nano: 'GNU nano 8.2'
  };

  const SHELL_BUILTINS = ['cd', 'pwd', 'echo', 'alias', 'unalias', 'export', 'unset', 'history', 'source', '.', 'exit', 'type', 'command', 'umask', 'jobs', 'bg', 'fg', 'wait'];

  const MAN_PAGES = {
    rm: {
      summary: 'remove files or directories',
      synopsis: 'rm [OPTION]... [FILE]...',
      description: '删除文件或目录。递归删除目录时必须使用 -r 或 -R；使用 -f 忽略不存在的文件与确认提示。',
      options: [['-f, --force', '忽略不存在的文件，不提示确认'], ['-r, -R, --recursive', '递归删除目录及其内容'], ['-d, --dir', '删除空目录'], ['-v, --verbose', '显示删除过程']]
    },
    ls: {
      summary: 'list directory contents',
      synopsis: 'ls [OPTION]... [FILE]...',
      description: '列出目录中的文件与子目录。默认隐藏以点开头的条目。',
      options: [['-a, --all', '显示隐藏文件'], ['-l', '使用长格式'], ['-h, --human-readable', '以易读单位显示大小'], ['-R, --recursive', '递归列出子目录']]
    },
    grep: {
      summary: 'print lines that match patterns',
      synopsis: 'grep [OPTION]... PATTERNS [FILE]...',
      description: '在文件或最近一次终端输出中搜索匹配行。',
      options: [['-i, --ignore-case', '忽略大小写'], ['-n, --line-number', '显示行号'], ['-r, --recursive', '递归搜索目录'], ['-v, --invert-match', '反向匹配']]
    },
    systemctl: {
      summary: 'control the systemd system and service manager',
      synopsis: 'systemctl [OPTIONS...] COMMAND [UNIT...]',
      description: '查看和控制 systemd 服务。AISniperOS 中为本地模拟状态。',
      options: [['status UNIT', '显示服务状态'], ['start UNIT', '启动服务'], ['stop UNIT', '停止服务'], ['restart UNIT', '重启服务'], ['list-units', '列出活动单元']]
    },
    apt: {
      summary: 'APT package management tool',
      synopsis: 'apt [update|upgrade|install|remove] [PACKAGE...]',
      description: 'Debian 系软件包管理器。所有安装操作仅在模拟环境中生效。',
      options: [['update', '刷新软件源索引'], ['upgrade', '升级已安装软件包'], ['install PACKAGE', '安装软件包'], ['remove PACKAGE', '移除软件包'], ['list --installed', '列出已安装包']]
    },
    ping: {
      summary: 'send ICMP ECHO_REQUEST to network hosts',
      synopsis: 'ping [-c COUNT] HOST',
      description: '测试到目标主机的 ICMP 连通性。模拟环境会返回固定但合理的延迟。',
      options: [['-c COUNT', '发送次数，默认 4'], ['-i INTERVAL', '发送间隔'], ['-W TIMEOUT', '超时时间']]
    },
    chmod: {
      summary: 'change file mode bits',
      synopsis: 'chmod [OPTION]... MODE FILE...',
      description: '修改文件权限位。模拟文件系统会记录操作并返回成功。',
      options: [['-R, --recursive', '递归修改'], ['+x', '添加执行权限'], ['644', '所有者读写，组与其他只读']]
    },
    tar: {
      summary: 'an archiving utility',
      synopsis: 'tar -czf ARCHIVE PATH... | tar -xzf ARCHIVE',
      description: '创建或解开 tar 归档。归档文件会写入当前模拟目录。',
      options: [['-c, --create', '创建归档'], ['-x, --extract', '解开归档'], ['-z, --gzip', '使用 gzip 压缩'], ['-f FILE', '指定归档文件']]
    },
    git: {
      summary: 'the stupid content tracker',
      synopsis: 'git [--version] <command> [<args>]',
      description: '分布式版本控制。模拟仓库包含一次提交与干净的 main 分支。',
      options: [['status', '工作区状态'], ['log --oneline', '提交历史'], ['branch', '分支列表'], ['remote -v', '远程地址']]
    },
    ssh: {
      summary: 'OpenSSH remote login client',
      synopsis: 'ssh [user@]hostname [command]',
      description: '建立到远程主机的加密连接。模拟环境不会访问真实网络。',
      options: [['-p PORT', '指定端口'], ['-i FILE', '指定私钥'], ['-v', '详细调试输出']]
    },
    docker: {
      summary: 'Docker container runtime',
      synopsis: 'docker [ps|images|run|stop|rm|logs]',
      description: '管理本地演示容器，与运维台共享状态。',
      options: [['ps -a', '列出全部容器'], ['images', '列出镜像'], ['run IMAGE', '运行容器'], ['logs NAME', '查看日志']]
    }
  };

  const FORTUNES = [
    '精准不是更多，而是更少。',
    '山脊在太阳离开后，还会保留十一分钟的颜色。',
    '好的终端不会替你思考，它只是让思路更快。',
    '如果一条命令无法解释，就不要给它 sudo。',
    '真正的自动化，是把重复留给机器，把判断留给自己。',
    '备份不是可选项，是时间旅行的最低票价。'
  ];

  const COWSAY_LINES = [
    ' ______________________________________',
    '< 不要在生产环境里测试你的勇气。 >',
    ' --------------------------------------',
    '        \\   ^__^',
    '         \\  (oo)\\_______',
    '            (__)\\       )\\/\\',
    '                ||----w |',
    '                ||     ||'
  ];

  const PACKAGES = ['nginx', 'curl', 'git', 'vim', 'htop', 'docker.io', 'python3-pip', 'nodejs', 'build-essential', 'openssh-server', 'jq', 'ripgrep'];

  function splitCommand(raw) {
    return (String(raw || '').match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [])
      .map((token) => token.replace(/^["']|["']$/g, ''));
  }

  function stripWrappers(parts) {
    let index = 0;
    while (index < parts.length && ['sudo', 'doas', 'env', 'command', 'builtin', 'nohup', 'time'].includes(parts[index])) {
      const wrapper = parts[index];
      index += 1;
      if (wrapper === 'sudo' || wrapper === 'doas') {
        while (index < parts.length && parts[index].startsWith('-')) index += 1;
      } else if (wrapper === 'env') {
        while (index < parts.length && (parts[index].startsWith('-') || parts[index].includes('='))) index += 1;
      }
    }
    return parts.slice(index);
  }

  function isCatastrophic(raw, cwd = '~') {
    const parts = stripWrappers(splitCommand(raw));
    if (!parts.length) return false;
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    if (command === 'rm') {
      let options = [];
      let targets = [];
      let afterDash = false;
      args.forEach((arg) => {
        if (arg === '--') { afterDash = true; return; }
        if (!afterDash && arg.startsWith('-')) options.push(arg);
        else targets.push(arg);
      });
      const shortFlags = options.filter((option) => /^-[^-]/.test(option)).map((option) => option.slice(1)).join('');
      const recursive = /[rR]/.test(shortFlags) || options.includes('--recursive');
      const critical = /^(?:\/|\/\*|\/\.\*|~|~\/|\$HOME|\/home(?:\/sniper)?|\/(?:bin|boot|etc|lib|opt|root|sbin|usr|var)(?:\/\*+)?)$/i;
      const rootish = targets.some((target) => {
        const normalized = target.replace(/\/+$/, '') || '/';
        return critical.test(normalized) || /^\/\*+$/.test(target) || (cwd === '/' && /^\*+$/.test(target));
      });
      return recursive && rootish;
    }
    const joined = parts.join(' ');
    if (/^mkfs(\.\w+)?$/.test(command) && /\/dev\/(sd|nvme|vd|disk|mapper)/.test(joined)) return true;
    if (command === 'wipefs' && /\/dev\/(sd|nvme|vd|disk|mapper)/.test(joined)) return true;
    if (command === 'shred' && /\/dev\/(sd|nvme|vd|disk|mapper)/.test(joined)) return true;
    if (command === 'truncate' && /\/dev\/(sd|nvme|vd|disk|mapper)/.test(joined)) return true;
    if (command === 'dd' && /of=\/dev\/(sd|nvme|vd|disk|mapper)/.test(joined)) return true;
    if (command === 'chmod' && args.some((arg) => /^0{3,4}$/.test(arg)) && args.some((arg) => arg === '/' || arg === '/*')) return true;
    if (command === 'chown' && args.some((arg) => arg === '/' || arg === '/*')) return true;
    if (command === 'mv' && args.some((arg) => arg === '/dev/null') && args.some((arg) => arg === '/')) return true;
    if (/^:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:$/.test(joined.replace(/\s+/g, ' '))) return true;
    if (command === 'echo' && joined.includes('/proc/sysrq-trigger')) return true;
    if (command === 'format' || (command === 'del' && args.some((arg) => /\/[fsq]/i.test(arg))) || (command === 'rd' && args.some((arg) => /^[a-z]:\\?$/i.test(arg)))) return true;
    return false;
  }

  function dangerReason(raw) {
    const parts = stripWrappers(splitCommand(raw));
    const command = (parts[0] || '').toLowerCase();
    if (command === 'rm') return '递归删除根文件系统';
    if (/^mkfs/.test(command)) return '格式化块设备';
    if (command === 'dd' || command === 'wipefs' || command === 'shred' || command === 'truncate') return '覆盖系统块设备';
    if (command === 'chmod' || command === 'chown') return '破坏根目录权限';
    if (command === 'format' || command === 'del' || command === 'rd') return '擦除系统盘';
    if (command === ':') return 'fork 炸弹';
    return '不可逆的系统级操作';
  }

  window.AISniperLinux = {
    SYSTEM_INFO,
    HELP_GROUPS,
    HELP_INDEX,
    COMMANDS,
    ALIASES,
    SYSTEM_FS,
    SYSTEM_FILES,
    TOOL_VERSIONS,
    SHELL_BUILTINS,
    MAN_PAGES,
    FORTUNES,
    COWSAY_LINES,
    PACKAGES,
    isCatastrophic,
    dangerReason,
    splitCommand
  };
})();
