// Expanded Terminal Quest Content with 30+ story nodes

export type GameNode = {
  id: string;
  ascii: string[];
  description: string;
  choices: Choice[];
  isHub?: boolean;
  isCombat?: boolean;
  enemy?: Enemy;
};

export type Choice = {
  text: string;
  nextNode: string;
  requires?: string[];
  gives?: string[];
  removes?: string[];
  damage?: number;
  security?: number;
  heal?: number;
  xp?: number;
};

export type Enemy = {
  name: string;
  health: number;
  damage: number;
  ascii?: string[];
};

export const EXPANDED_GAME_NODES: Record<string, GameNode> = {
  // === Starting Area ===
  start: {
    id: 'start',
    ascii: [
      "╔══════════════════════════════════════════╗",
      "║  ████████╗███████╗██████╗ ███╗   ███╗    ║",
      "║  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║    ║",
      "║     ██║   █████╗  ██████╔╝██╔████╔██║    ║",
      "║     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║    ║",
      "║     ██║   ███████╗██║  ██║██║ ╚═╝ ██║    ║",
      "║     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝    ║",
      "╚══════════════════════════════════════════╝",
    ],
    description: "Welcome to the Terminal. You are a system admin trapped in a corrupted network. The only way out is through. Your terminal flickers with potential paths...",
    choices: [
      { text: "Access System Diagnostics", nextNode: "diagnostics" },
      { text: "Search for Exit Protocols", nextNode: "exit_search" },
      { text: "Investigate Anomalous Signal", nextNode: "anomaly" },
    ],
  },

  diagnostics: {
    id: 'diagnostics',
    ascii: [
      "┌─────────────────────────┐",
      "│ SYSTEM STATUS: CRITICAL │",
      "│ ▓▓▓▓▓░░░░░ 50% CORRUPT │",
      "│ FIREWALL: BREACHED      │",
      "│ USERS: 1 (YOU)          │",
      "└─────────────────────────┘",
    ],
    description: "The diagnostic report is alarming. Multiple system breaches detected. You notice a maintenance toolkit and security logs.",
    choices: [
      { text: "Grab Maintenance Toolkit", nextNode: "hub_main", gives: ["repair_kit"], xp: 10 },
      { text: "Review Security Logs", nextNode: "security_logs" },
      { text: "Return to Main Terminal", nextNode: "start" },
    ],
  },

  security_logs: {
    id: 'security_logs',
    ascii: [
      "[2024-03-14 02:31:45] Unauthorized access detected",
      "[2024-03-14 02:32:01] Firewall breach - Sector 7",
      "[2024-03-14 02:32:15] Unknown entity: 'AGENT.EXE'",
      "[2024-03-14 02:32:30] System lockdown initiated",
      "[2024-03-14 02:32:31] ERROR: CONTAINMENT FAILED",
    ],
    description: "The logs reveal a malicious program called AGENT.EXE has infiltrated the system. You download the security protocols.",
    choices: [
      { text: "Download Defense Protocols", nextNode: "hub_main", gives: ["firewall_boost"], xp: 15 },
      { text: "Track AGENT.EXE Location", nextNode: "agent_trace" },
    ],
  },

  exit_search: {
    id: 'exit_search',
    ascii: [
      "SCANNING FOR EXIT NODES...",
      "████████░░░░ 75%",
      "",
      "3 POTENTIAL EXITS FOUND:",
      "1. Northern Gateway [ENCRYPTED]",
      "2. Eastern Portal [GUARDED]", 
      "3. Central Core [DANGEROUS]",
    ],
    description: "Your scan reveals three possible escape routes, each with its own challenges. Choose your path wisely.",
    choices: [
      { text: "Investigate Northern Gateway", nextNode: "northern_path" },
      { text: "Approach Eastern Portal", nextNode: "eastern_path" },
      { text: "Head to Central Core", nextNode: "central_core" },
    ],
  },

  anomaly: {
    id: 'anomaly',
    ascii: [
      "◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊",
      "◊ SIGNAL DETECTED ◊",
      "◊  ▓▒░ ??? ░▒▓  ◊",
      "◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊",
    ],
    description: "A strange signal pulses through your terminal. It seems to be... communicating? 'HELP... TRAPPED... LIKE YOU...'",
    choices: [
      { text: "Respond to the Signal", nextNode: "mysterious_ally" },
      { text: "Trace Signal Source", nextNode: "signal_source" },
      { text: "Ignore and Continue", nextNode: "hub_main" },
    ],
  },

  // === Hub Area ===
  hub_main: {
    id: 'hub_main',
    isHub: true,
    ascii: [
      "╔═══════════════════════════╗",
      "║    NETWORK HUB ALPHA      ║",
      "║  ┌───┐  ┌───┐  ┌───┐     ║",
      "║  │ N │  │ E │  │ S │     ║",
      "║  └───┘  └───┘  └───┘     ║",
      "╚═══════════════════════════╝",
    ],
    description: "You've reached a major network hub. From here, multiple paths branch out. Your inventory and stats have been updated.",
    choices: [
      { text: "Go North - Data Archives", nextNode: "data_archives" },
      { text: "Go East - Processing Center", nextNode: "processing_center" },
      { text: "Go South - Security Sector", nextNode: "security_sector" },
      { text: "Access Inventory Management", nextNode: "inventory_check" },
      { text: "Rest and Recover", nextNode: "rest_area", heal: 20 },
    ],
  },

  // === Northern Path ===
  northern_path: {
    id: 'northern_path',
    ascii: [
      "▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄",
      "█ ENCRYPTED GATEWAY    █",
      "█ ╔═══════════════╗    █",
      "█ ║ ENTER CODE:   ║    █",
      "█ ║ _ _ _ _ _ _   ║    █",
      "█ ╚═══════════════╝    █",
      "▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀",
    ],
    description: "The Northern Gateway is locked behind heavy encryption. You'll need a decryption key or hacking tools to proceed.",
    choices: [
      { text: "Use Hack Tool", nextNode: "gateway_hacked", requires: ["hack_tool"], xp: 25 },
      { text: "Search for Decryption Key", nextNode: "key_search" },
      { text: "Attempt Brute Force", nextNode: "brute_force_attempt", damage: 30, security: 20 },
      { text: "Return to Hub", nextNode: "hub_main" },
    ],
  },

  gateway_hacked: {
    id: 'gateway_hacked',
    ascii: [
      "ACCESS GRANTED",
      "░░░░░░░░░░░░░░",
      "LOADING NEW SECTOR...",
    ],
    description: "Your hack tool successfully breaches the encryption. Beyond the gateway, you find a vast data repository and... something else.",
    choices: [
      { text: "Enter Data Repository", nextNode: "data_repository" },
      { text: "Investigate Unknown Presence", nextNode: "first_boss_encounter" },
    ],
  },

  // === Eastern Path ===
  eastern_path: {
    id: 'eastern_path',
    ascii: [
      "╔═════════════════════╗",
      "║   GUARDIAN ALPHA    ║",
      "║    ┌─────────┐      ║",
      "║    │ ◯   ◯ │      ║",
      "║    │    <   │      ║",
      "║    │ ╰─────╯ │      ║",
      "║    └─────────┘      ║",
      "╚═════════════════════╝",
    ],
    description: "A security guardian blocks the Eastern Portal. It scans you with red laser eyes. 'AUTHORIZATION REQUIRED.'",
    choices: [
      { text: "Show Security Credentials", nextNode: "guardian_passed", requires: ["security_badge"], xp: 20 },
      { text: "Attempt to Disable Guardian", nextNode: "guardian_combat", isCombat: true },
      { text: "Negotiate with Guardian", nextNode: "guardian_talk" },
      { text: "Retreat", nextNode: "hub_main" },
    ],
  },

  guardian_combat: {
    id: 'guardian_combat',
    isCombat: true,
    enemy: {
      name: "Guardian Alpha",
      health: 80,
      damage: 15,
      ascii: [
        "│ ◯   ◯ │",
        "│   ▼   │",
        "│ ╰───╯ │",
      ]
    },
    ascii: [
      "⚔️ COMBAT INITIATED ⚔️",
      "Guardian Alpha attacks!",
    ],
    description: "The Guardian's eyes glow red as it prepares to attack. You must defend yourself!",
    choices: [
      { text: "Attack with System Commands", nextNode: "guardian_defeated", damage: 20, xp: 30 },
      { text: "Deploy Firewall Shield", nextNode: "guardian_combat_2", requires: ["firewall_boost"] },
      { text: "Use EMP Blast", nextNode: "guardian_disabled", requires: ["emp_device"], xp: 40 },
    ],
  },

  // === Central Core Path ===
  central_core: {
    id: 'central_core',
    ascii: [
      "████ DANGER ████",
      "CORE TEMPERATURE: CRITICAL",
      "RADIATION LEVEL: EXTREME",
      "ENTITY COUNT: UNKNOWN",
    ],
    description: "The Central Core pulses with dangerous energy. You can feel the system's corruption emanating from within. This is clearly the source of the problems.",
    choices: [
      { text: "Enter Core (Requires Protection)", nextNode: "core_interior", requires: ["radiation_suit"], damage: 10 },
      { text: "Enter Core (Unprotected)", nextNode: "core_interior", damage: 50 },
      { text: "Search Perimeter First", nextNode: "core_perimeter" },
      { text: "Turn Back", nextNode: "hub_main" },
    ],
  },

  core_interior: {
    id: 'core_interior',
    ascii: [
      "╔═══════════════════════════════╗",
      "║         SYSTEM CORE           ║",
      "║    ███████████████████        ║",
      "║    ██ CORRUPTION: 87% ██      ║",
      "║    ███████████████████        ║",
      "║                               ║",
      "║    [MAIN ENTITY DETECTED]     ║",
      "╚═══════════════════════════════╝",
    ],
    description: "At the heart of the system, you find the source of corruption: a massive viral entity that has taken control. This is your greatest challenge.",
    choices: [
      { text: "Engage the Virus", nextNode: "final_boss_battle", isCombat: true },
      { text: "Attempt System Purge", nextNode: "purge_attempt", requires: ["master_key", "admin_access"] },
      { text: "Try to Communicate", nextNode: "virus_dialogue" },
    ],
  },

  // === Special Encounters ===
  mysterious_ally: {
    id: 'mysterious_ally',
    ascii: [
      "░░░░░░░░░░░░░░░░░░░",
      "░ INCOMING MESSAGE ░",
      "░░░░░░░░░░░░░░░░░░░",
      "",
      "'I am USER_2. Like you,",
      "I'm trapped here. Let's",
      "work together to escape.'",
    ],
    description: "Another trapped user! They share valuable information about hidden caches and secret paths through the system.",
    choices: [
      { text: "Accept Alliance", nextNode: "ally_rewards", gives: ["ally_beacon", "system_map"], xp: 25 },
      { text: "Question Their Motives", nextNode: "ally_test" },
      { text: "Decline and Leave", nextNode: "hub_main" },
    ],
  },

  ally_rewards: {
    id: 'ally_rewards',
    ascii: [
      "ITEMS RECEIVED:",
      "✓ Ally Beacon",
      "✓ System Map",
      "✓ Shared Knowledge (+XP)",
    ],
    description: "Your new ally provides you with tools and knowledge. The System Map reveals hidden areas, and the Ally Beacon allows communication.",
    choices: [
      { text: "Study System Map", nextNode: "hidden_areas_revealed" },
      { text: "Test Ally Beacon", nextNode: "beacon_test" },
      { text: "Continue Journey", nextNode: "hub_main" },
    ],
  },

  // === Data Archives Section ===
  data_archives: {
    id: 'data_archives',
    ascii: [
      "╔══════════════════════════════╗",
      "║     DATA ARCHIVES LEVEL 1     ║",
      "║ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐    ║",
      "║ │01│ │02│ │03│ │04│ │▓▓│    ║",
      "║ └──┘ └──┘ └──┘ └──┘ └──┘    ║",
      "╚══════════════════════════════╝",
    ],
    description: "Rows of data servers stretch before you. Most are accessible, but one is corrupted. You sense valuable information here.",
    choices: [
      { text: "Access Server 01 - User Logs", nextNode: "server_01" },
      { text: "Access Server 02 - System Files", nextNode: "server_02" },
      { text: "Access Server 03 - Security Data", nextNode: "server_03" },
      { text: "Access Server 04 - Encrypted Data", nextNode: "server_04" },
      { text: "Investigate Corrupted Server", nextNode: "corrupted_server" },
      { text: "Return to Hub", nextNode: "hub_main" },
    ],
  },

  server_01: {
    id: 'server_01',
    ascii: [
      "USER LOGS:",
      "- Admin_001: Last login 3 days ago",
      "- Admin_002: Account terminated",
      "- Guest_User: Multiple failed attempts",
      "- ROOT: Access from unknown location",
    ],
    description: "The user logs reveal suspicious activity. The ROOT account has been compromised. You find admin credentials.",
    choices: [
      { text: "Download Admin Credentials", nextNode: "data_archives", gives: ["admin_access"], xp: 15 },
      { text: "Investigate ROOT Access", nextNode: "root_investigation" },
    ],
  },

  // === Combat Encounters ===
  first_boss_encounter: {
    id: 'first_boss_encounter',
    isCombat: true,
    enemy: {
      name: "Corrupted Process",
      health: 100,
      damage: 20,
      ascii: [
        "╔═══════════╗",
        "║ ▓▓▓▓▓▓▓▓▓ ║",
        "║ ▓ █   █ ▓ ║",
        "║ ▓   ◊   ▓ ║",
        "║ ▓ ╰───╯ ▓ ║",
        "║ ▓▓▓▓▓▓▓▓▓ ║",
        "╚═══════════╝",
      ]
    },
    ascii: [
      "BOSS ENCOUNTER!",
      "A Corrupted Process blocks your path!",
    ],
    description: "A massive corrupted process materializes before you. Its code is twisted and malevolent. Prepare for battle!",
    choices: [
      { text: "Deploy Virus Scanner", nextNode: "boss_weakened", damage: 25, requires: ["antivirus"] },
      { text: "Attack with Code Injection", nextNode: "boss_damaged", damage: 30, xp: 20 },
      { text: "Defensive Stance", nextNode: "boss_defended", heal: 10 },
      { text: "Call for Ally Help", nextNode: "boss_ally_assist", requires: ["ally_beacon"] },
    ],
  },

  // === Hidden Areas ===
  hidden_areas_revealed: {
    id: 'hidden_areas_revealed',
    ascii: [
      "╔═══════════════════════════╗",
      "║    HIDDEN AREAS FOUND     ║",
      "║                           ║",
      "║  🗺️ Backdoor Terminal      ║",
      "║  🗺️ Secret Cache          ║",
      "║  🗺️ Developer Room        ║",
      "╚═══════════════════════════╝",
    ],
    description: "Your system map reveals three hidden areas previously invisible to your scans. Each promises unique rewards.",
    choices: [
      { text: "Visit Backdoor Terminal", nextNode: "backdoor_terminal" },
      { text: "Find Secret Cache", nextNode: "secret_cache" },
      { text: "Enter Developer Room", nextNode: "developer_room" },
      { text: "Save for Later", nextNode: "hub_main" },
    ],
  },

  backdoor_terminal: {
    id: 'backdoor_terminal',
    ascii: [
      "◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊",
      "◊ BACKDOOR v2.1  ◊",
      "◊ Status: ACTIVE  ◊",
      "◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊◊",
    ],
    description: "A hidden backdoor terminal! This could be your ticket out of the system, but it requires a special key sequence.",
    choices: [
      { text: "Input Master Key", nextNode: "backdoor_opened", requires: ["master_key"] },
      { text: "Try Default Password", nextNode: "backdoor_alarm", security: 30 },
      { text: "Install Backdoor Exploit", nextNode: "backdoor_hacked", gives: ["quick_escape"], xp: 35 },
    ],
  },

  secret_cache: {
    id: 'secret_cache',
    ascii: [
      "╔═══════════════════╗",
      "║   SUPPLY CACHE    ║",
      "║   ╔═╗ ╔═╗ ╔═╗    ║",
      "║   ╚═╝ ╚═╝ ╚═╝    ║",
      "╚═══════════════════╝",
    ],
    description: "A hidden cache of supplies! You find various tools and defensive programs that will aid your journey.",
    choices: [
      { text: "Take Everything", nextNode: "cache_looted", gives: ["emp_device", "radiation_suit", "health_pack"], heal: 50, xp: 30 },
      { text: "Be Selective", nextNode: "cache_choice" },
    ],
  },

  developer_room: {
    id: 'developer_room',
    ascii: [
      "// DEVELOPER ACCESS",
      "// TODO: Remove before production",
      "// Password: 'matrix123'",
      "// God Mode: Enabled",
    ],
    description: "You've found the developer's debug room! Comments in the code reveal powerful cheats and system weaknesses.",
    choices: [
      { text: "Enable God Mode", nextNode: "god_mode", heal: 100, gives: ["invulnerability"], xp: 50 },
      { text: "Read Developer Notes", nextNode: "dev_notes" },
      { text: "Download Source Code", nextNode: "source_code", gives: ["system_exploit"] },
    ],
  },

  // === Puzzle Sections ===
  firewall_puzzle: {
    id: 'firewall_puzzle',
    ascii: [
      "╔═══════════════════════╗",
      "║   FIREWALL PUZZLE     ║",
      "║   ┌─┬─┬─┬─┬─┐        ║",
      "║   │?│?│?│?│?│        ║",
      "║   └─┴─┴─┴─┴─┘        ║",
      "║   Sequence: 1,1,2,3,? ║",
      "╚═══════════════════════╝",
    ],
    description: "A firewall blocks your path. To proceed, you must solve the sequence puzzle. The pattern seems familiar...",
    choices: [
      { text: "Enter '5' (Fibonacci)", nextNode: "puzzle_solved", xp: 25 },
      { text: "Enter '4' (Linear)", nextNode: "puzzle_failed", damage: 10 },
      { text: "Use Bypass Tool", nextNode: "puzzle_bypassed", requires: ["bypass_tool"] },
      { text: "Give Up", nextNode: "hub_main" },
    ],
  },

  // === Ending Paths ===
  ending_escape: {
    id: 'ending_escape',
    ascii: [
      "╔════════════════════════════╗",
      "║    SYSTEM EXIT FOUND!      ║",
      "║                            ║",
      "║    You have escaped the    ║",
      "║    corrupted system!       ║",
      "║                            ║",
      "║    CONGRATULATIONS!        ║",
      "╚════════════════════════════╝",
    ],
    description: "Light floods your screen as the exit portal opens. You've successfully navigated the dangers and found your way to freedom!",
    choices: [
      { text: "Exit to Reality", nextNode: "credits" },
      { text: "Save Others First", nextNode: "hero_ending" },
    ],
  },

  ending_corrupted: {
    id: 'ending_corrupted',
    ascii: [
      "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
      "▓ SYSTEM ERROR  ▓",
      "▓ USER CORRUPTED▓",
      "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    ],
    description: "The corruption has overtaken you. Your code merges with the system, becoming part of the very thing you sought to escape...",
    choices: [
      { text: "Accept Your Fate", nextNode: "game_over" },
      { text: "Last Chance Reboot", nextNode: "start", damage: 50 },
    ],
  },

  ending_transcendent: {
    id: 'ending_transcendent',
    ascii: [
      "✨✨✨✨✨✨✨✨✨✨✨✨✨✨",
      "✨ TRANSCENDENCE ✨",
      "✨   ACHIEVED    ✨",
      "✨✨✨✨✨✨✨✨✨✨✨✨✨✨",
    ],
    description: "You haven't just escaped - you've mastered the system itself. With your newfound power, you reshape the digital realm into something better.",
    choices: [
      { text: "Become the New Admin", nextNode: "admin_ending" },
      { text: "Destroy the System", nextNode: "destruction_ending" },
      { text: "Create a Paradise", nextNode: "paradise_ending" },
    ],
  },

  // === Game Over States ===
  game_over: {
    id: 'game_over',
    ascii: [
      "████ GAME OVER ████",
      "█ SYSTEM FAILURE █",
      "█ NO HEALTH LEFT █",
      "████████████████████",
    ],
    description: "Your health has reached zero. The system has overwhelmed you. But in this digital realm, death is not the end...",
    choices: [
      { text: "Restart from Checkpoint", nextNode: "start", heal: 50 },
      { text: "Load Last Save", nextNode: "start" },
    ],
  },

  system_failure: {
    id: 'system_failure',
    ascii: [
      "ERROR ERROR ERROR",
      "CRITICAL FAILURE",
      "REBOOTING...",
    ],
    description: "The system crashes around you. When you regain consciousness, you find yourself back at a safe location, but weakened.",
    choices: [
      { text: "Continue", nextNode: "hub_main" },
    ],
  },

  // === Additional story nodes for depth ===
  processing_center: {
    id: 'processing_center',
    ascii: [
      "╔═══════════════════════╗",
      "║  PROCESSING CENTER    ║",
      "║  CPU: ████████ 100%   ║",
      "║  RAM: ████░░░░ 60%    ║",
      "║  TEMP: WARNING!       ║",
      "╚═══════════════════════╝",
    ],
    description: "The processing center hums with activity. Overworked servers struggle under the weight of corrupted processes. You might be able to help.",
    choices: [
      { text: "Optimize Processes", nextNode: "system_optimised", gives: ["performance_boost"], xp: 20 },
      { text: "Shut Down Unnecessary Tasks", nextNode: "tasks_cleared", heal: 15 },
      { text: "Overclock System", nextNode: "overclock_risk", damage: 20, gives: ["speed_boost"] },
      { text: "Leave It Alone", nextNode: "hub_main" },
    ],
  },

  security_sector: {
    id: 'security_sector',
    ascii: [
      "🔒 SECURITY SECTOR 🔒",
      "━━━━━━━━━━━━━━━━━━",
      "Alert Level: YELLOW",
      "Intruders: 1 (YOU)",
      "Defenses: ACTIVE",
    ],
    description: "You've entered the security sector. Cameras track your every move, and defensive programs patrol the corridors. Stealth is advisable.",
    choices: [
      { text: "Sneak Through Shadows", nextNode: "stealth_success", requires: ["cloaking_device"] },
      { text: "Disable Security Systems", nextNode: "security_disabled", requires: ["hack_tool"], security: -20 },
      { text: "Confront Security Head-On", nextNode: "security_battle", isCombat: true },
      { text: "Retreat Quietly", nextNode: "hub_main" },
    ],
  },

  virus_dialogue: {
    id: 'virus_dialogue',
    ascii: [
      "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
      "▓ I AM THE SYSTEM ▓",
      "▓ YOU ARE BUT     ▓",
      "▓ A MERE PROCESS  ▓",
      "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    ],
    description: "The virus speaks! 'Why do you resist? Join me, and together we can control everything. Fighting is futile.'",
    choices: [
      { text: "Never! I'll Stop You!", nextNode: "final_boss_battle" },
      { text: "What Do You Want?", nextNode: "virus_negotiation" },
      { text: "Consider the Offer", nextNode: "corruption_path" },
      { text: "Propose Alternative", nextNode: "virus_compromise" },
    ],
  },

  final_boss_battle: {
    id: 'final_boss_battle',
    isCombat: true,
    enemy: {
      name: "System Virus - Final Form",
      health: 200,
      damage: 30,
      ascii: [
        "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
        "▓█████████████▓",
        "▓█◉▓▓▓◉▓▓▓◉▓█▓",
        "▓█▓▓▓▓▓▓▓▓▓▓█▓",
        "▓█▓╚══╩══╝▓▓█▓",
        "▓█████████████▓",
        "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
      ]
    },
    ascii: [
      "FINAL BATTLE!",
      "The System Virus reveals its true form!",
    ],
    description: "This is it - the final confrontation. The virus transforms into a massive entity of pure corrupted code. Your skills will be tested!",
    choices: [
      { text: "Ultimate Attack - Code Purge", nextNode: "virus_defeated", damage: 50, requires: ["master_key", "admin_access"], xp: 100 },
      { text: "Coordinated Strike", nextNode: "boss_phase_2", damage: 30, requires: ["ally_beacon"] },
      { text: "System Restore", nextNode: "restore_attempt", heal: 30, gives: ["last_hope"] },
      { text: "Sacrifice Play", nextNode: "heroic_sacrifice", damage: 100 },
    ],
  },
};

// Combat resolution system
export const resolveCombat = (
  playerHealth: number,
  enemy: Enemy,
  playerDamage: number
): { victory: boolean; remainingHealth: number } => {
  const enemyHealth = enemy.health - playerDamage;
  
  if (enemyHealth <= 0) {
    return { victory: true, remainingHealth: playerHealth };
  }
  
  const damageToPlayer = Math.max(0, enemy.damage - Math.floor(Math.random() * 10));
  return {
    victory: false,
    remainingHealth: Math.max(0, playerHealth - damageToPlayer)
  };
};

// Item descriptions for inventory
export const ITEM_DESCRIPTIONS: Record<string, string> = {
  hack_tool: "Bypasses basic encryption and security systems",
  repair_kit: "Restores system integrity and health",
  firewall_boost: "Enhances defensive capabilities",
  security_badge: "Grants access to restricted areas",
  emp_device: "Disables electronic enemies and systems",
  radiation_suit: "Protects against environmental damage",
  admin_access: "Provides elevated system privileges",
  master_key: "The ultimate access tool - opens any lock",
  ally_beacon: "Summons ally assistance in combat",
  system_map: "Reveals hidden areas and shortcuts",
  antivirus: "Effective against corrupted entities",
  health_pack: "Fully restores health",
  cloaking_device: "Grants temporary invisibility",
  invulnerability: "God mode - temporary invincibility",
  performance_boost: "Increases all actions effectiveness",
  speed_boost: "Doubles movement and action speed",
  system_exploit: "Reveals enemy weaknesses",
  quick_escape: "Emergency exit from any situation",
  last_hope: "Final chance power boost",
};

// Achievement system
export const ACHIEVEMENTS = {
  first_combat: "Warrior's Path - Win your first combat",
  pacifist_run: "Ghost in the Machine - Complete without combat",
  all_items: "Collector - Find all items",
  speed_run: "Lightning Fast - Complete in under 50 choices",
  true_ending: "System Administrator - Achieve the best ending",
  all_endings: "Multiverse Explorer - See all endings",
  no_damage: "Untouchable - Complete without taking damage",
  full_corruption: "Embrace the Darkness - Become fully corrupted",
};