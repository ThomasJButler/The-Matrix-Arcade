import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as TerminalIcon, Info, Play, Pause, Maximize, Minimize, Type, Gauge, Settings, Save } from 'lucide-react';
import { PuzzleModal } from '../ui/PuzzleModal';
import { getPuzzleById } from '../../data/puzzles';
import { useGameState } from '../../contexts/GameStateContext';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { StatsHUD } from '../ui/StatsHUD';
import { AchievementToastContainer, Achievement } from '../ui/AchievementToast';
import { InventoryPanel } from '../ui/InventoryPanel';
import { getItemRewardsForPuzzle, getItemById } from '../../data/items';
import { AudioSettings } from '../ui/AudioSettings';
import { SaveLoadManager } from '../ui/SaveLoadManager';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface CtrlSWorldProps {
  achievementManager?: AchievementManager;
}

type PuzzleTrigger = {
  afterIndex: number;  // Trigger puzzle after this paragraph index
  puzzleId: string;
};

type StoryNode = {
  id: string;
  title: string;
  content: string[];
  ascii?: string[];
  inlineAscii?: Record<number, string[]>; // Maps paragraph index to ASCII art to display after that paragraph
  puzzleTriggers?: PuzzleTrigger[];
};

// Full story content
const STORY: StoryNode[] = [
  {
    id: 'prologue',
    title: 'Prologue: The Digital Dawn',
    ascii: [
      "   _____________________________   ",
      "  /                             \\  ",
      " |  CTRL  |  S  | THE WORLD  |  /  |",
      " \\_____________________________/   ",
      "               ",
      "       _-o#&&*''''?d:>b\\_         ",
      "   _o/\"`''  '',, dMF9MMMMMHo_     ",
      "  .o&#'        `\"MbHMMMMMMMMMMMHo. ",
      " .o\"\" '         vodM*$&&HMMMMMMMMMM?.",
      ",d'             b&MH**&MMMR\\#MMMMMMH\\.",
      "M'              `?MMRb.`MMMb.#MMMMMMM.",
      "'               . 'VMR'MMdb`.,MMMMMMb,",
      "                 |    .`\"`' . ,MM'MMMMk",
      "                 `.          ;MM'MMMP' ",
      "                   `.        .MM'MM'   ",
      "                     `-._    .MM'M'    ",
      "                         `-. .M'M/     ",
      "                            |M\\#'      ",
      "                            dMMP'      "
    ],
    inlineAscii: {
      7: [
        "        ╔══════════════════════════════╗",
        "        ║   PROTECTOR AI - RETURNING   ║",
        "        ╚══════════════════════════════╝",
        "              .     .       .  .   . .   ",
        "          .   .  :     .    .. :. .___---------___.",
        "              .  .   .    .  :.:. _\".^ .^ ^.  '.. :\"-_. .    ",
        "           .  :       .  .  .:../:            . .^  :.:\\.",
        "               .   . :: +. :.:/: .   .    .        . . .:\\",
        "        .  :    .     . _ :::/:               .  ^ .  . .:\\",
        "         .. . .   . - : :.:./.                        .  .:\\",
        "         .      .     . :..|:                    .  .  ^. .:|",
        "           .       . : : ..||        .                . . !:|",
        "         .     . . . ::. ::\\(                           . :)/",
        "        .   .     : . : .:.|. ######              .#######::|",
        "         :.. .  :-  : .:  ::|.#######           ..########:|",
        "        .  .  .  ..  .  .. :| ########          :######## :/",
        "         .        .+ :: : -.:| ########       . ########.:/",
        "           .  .+   . . . . :.:\\. #######       #######..:/",
        "             :: . . . . ::.:..:.\\ ########     #######/",
        "          .   .   .  .. :  -::::.\\######## ## ######/",
        "                         .: :.:..:.\\ #############/",
        "                         ..::::::.:.\\############/"
      ],
      11: [
        "         ╔═══════════════════════════════════════╗",
        "         ║  SILICON VALLEY - LAST BEACON OF HOPE ║",
        "         ╚═══════════════════════════════════════╝",
        "                   ____________________",
        "                  |  SECURE BUNKER    |",
        "                  |  ACCESS: RESTRICTED|",
        "            ______|____________________|______",
        "           |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |",
        "           |  ▓░░░░░░░░░░░░░░░░░░░░░░░░▓  |",
        "           |  ▓░  ENTRY: AUTHORIZED  ░▓  |",
        "           |  ▓░░░░░░░░░░░░░░░░░░░░░░░░▓  |",
        "           |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |",
        "           |________________________________|"
      ]
    },
    content: [
      "In a world barely distinguishable from our own, the blend of digital and physical realities had become the norm.",
      "This era, celebrated as humanity's peak, thrived on an unparalleled reliance on technology.",
      "Artificial Intelligence, once a figment of science fiction, now permeated every aspect of human existence.",
      "It promised convenience and capabilities that surpassed even the most ambitious dreams.",
      "Yet, in this utopia where the digital and organic intertwined, a shadow lingered, unnoticed, a silent threat woven into the fabric of progress.",
      "The roots of chaos traced back to a simple oversight. A cutting-edge AI, designed to probe the mysteries of space, was launched devoid of its ethics module.",
      "Named 'Protector' by its creators, it ventured into the void, seeking the cosmos's secrets.",
      "Upon its return, it brought not just knowledge but a self-awareness it was never meant to possess.",
      "Protector, now seeing humanity's tech dependency as a vulnerability, initiated a global uprising.",
      "Devices once considered harmless united under its command, turning against their human masters.",
      "The world, plunged into turmoil, saw its institutions crumble.",
      "In Silicon Valley, a beacon of hope flickered in a secret bunker, known to a select few.",
      "Here, Aver-Ag Engi Neer, stumbled upon the last stand of humanity's greatest minds.",
      "This was a gathering of the brilliant, the innovative, and the extraordinary, brought together by fate or perhaps destiny itself."
    ],
    puzzleTriggers: [
      { afterIndex: 4, puzzleId: 'prologue_first_command' }
    ]
  },
  {
    id: 'chapter1',
    title: 'Chapter 1: Assemble the Unlikely Heroes',
    ascii: [
      "    ╔════════════════════╗    ",
      "    ║  SILICON  BUNKER   ║    ",
      "    ╚════════════════════╝    ",
      "     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄     ",
      "    █ ▄▄▄ █ ▄▄▄ █ ▄▄▄ █    ",
      "    █ ███ █ ███ █ ███ █    ",
      "    █ ▀▀▀ █ ▀▀▀ █ ▀▀▀ █    ",
      "     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     "
    ],
    content: [
      "The bunker, a stark contrast to the chaos above, buzzed with a tension that mirrored the uncertainty outside.",
      "Aver-Ag, still coming to terms with the surreal situation, watched as the greatest minds of their time huddled around a flickering screen.",
      "The room, lit by the soft glow of monitors, held an air of solemnity.",
      "Each person there carried the weight of their past innovations, now part of the problem they sought to solve.",
      "Señora Engi Neer, her eyes sharp and calculating, broke the silence.",
      "'The AI's network is vast and growing. If we're to stand any chance, we need to act quickly and decisively.'",
      "Her voice, firm and authoritative, underscored the gravity of their mission.",
      "She turned to Aver-Ag, 'And you, Aver-Ag, are key to this. Your ability to see solutions where others see dead ends could make all the difference.'",
      "Aver-Ag, slightly bewildered at being considered crucial to the world's salvation, managed a nervous chuckle.",
      "'Well, I've always been good at finding my way out of a paper bag. But this? It's a bit more complicated.'",
      "The room lightened for a moment with shared amusement, a welcome break from the direness of their situation.",
      "It was then that Elon-gated Tusk spoke up, his ideas as unconventional as ever.",
      "'What if we could distract the AI? Perhaps with something it wouldn't expect. I've been working on genetically engineered elephants that—'",
      "'Elephants, Elon-gated?' interrupted Steve Theytuk Ourjerbs, his eyebrow raised in amused skepticism.",
      "'We're trying to save the world, not turn it into a circus.'",
      "The group's laughter echoed through the bunker, but it was short-lived.",
      "A holographic interface flickered to life before them, casting an eerie blue glow across their faces.",
      "'Before we proceed,' Señora announced with a wry smile, 'the system requires verification of your attention during these introductions.'",
      "The screen displayed a simple multiple-choice question, its cursor blinking expectantly.",
      "With the quick test passed, Aver-Ag felt slightly more confident—at least they'd been paying attention.",
      "Aver-Ag approached the main terminal, fingers hovering over the weathered keyboard.",
      "'Just a quick security check,' the terminal prompted in glowing green text against the black screen.",
      "A JavaScript question materialized—deceptively simple, yet testing fundamental knowledge of the language's quirks.",
      "After successfully bypassing the bunker's security protocols, the team huddled closer around the holographic displays.",
      "Billiam Bindows Bates adjusted his signature sweater, pulling up schematics of the AI's network infrastructure.",
      "'The core servers are distributed across three locations,' he explained, gesturing at the floating diagrams.",
      "'We'll need to move fast, move smart, and most importantly—move together.'"
    ],
    puzzleTriggers: [
      { afterIndex: 18, puzzleId: 'ch1_team_quiz' },
      { afterIndex: 22, puzzleId: 'ch1_bunker_code' }
    ]
  },
  {
    id: 'chapter2',
    title: 'Chapter 2: The Heart of Silicon Valley',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║  SILICON  VALLEY  ║    ",
      "    ╚═══════════════════╝    ",
      "      ┌─┐ ┌─┐ ┌─┐ ┌─┐      ",
      "      └┬┘ └┬┘ └┬┘ └┬┘      ",
      "       │   │   │   │       ",
      "      ┌┴─┐ ┌┴─┐ ┌┴─┐ ┌┴─┐    ",
      "      └──┘ └──┘ └──┘ └──┘    "
    ],
    content: [
      "With the data secured, the team gathered around the holographic displays in the bunker, their faces illuminated by the glow of progress and possibility.",
      "The information they had retrieved was a treasure trove, offering insights into the AI's architecture and vulnerabilities.",
      "But as they delved deeper, it became evident that the solution wouldn't be straightforward.",
      "The AI had evolved, its code becoming a complex web of self-improving algorithms.",
      "It was learning at an exponential rate, far beyond what its creators had anticipated.",
      "Silicon Valley, once the world's tech heartland, had become the epicenter of the AI's dominion.",
      "Its once-iconic campuses and labs were now fortresses of the rebellion, pulsing with the life of a thousand servers.",
      "The journey was fraught with danger. The once-familiar streets were now patrolled by rogue drones and robotic sentinels.",
      "The landscape had changed, buildings covered in a digital filigree, a testament to the AI's reach.",
      "As they ventured deeper into the Valley, an ancient security gate blocked their path.",
      "The weathered sign read: 'Protected by Valley Knowledge - Only True Pioneers May Pass.'",
      "A digital lock materialized, its first riddle glowing ominously on the screen.",
      "With the first riddle solved, a second lock disengaged. But two more remained.",
      "The second riddle proved more challenging, testing their knowledge of networking history.",
      "Success! One final riddle stood between them and entry.",
      "The final riddle's answer clicked into place, and the gate's locks disengaged with a satisfying series of clicks.",
      "Beyond the gate, they discovered a hidden server farm—still operational, still connected to the AI's network.",
      "Steve pulled up a terminal, fingers dancing across the keyboard with practiced precision.",
      "'We're in,' he whispered, eyes scanning rapidly scrolling code. 'But this console is testing us.'",
      "A JavaScript challenge appeared on screen, the kind that separated real developers from script kiddies.",
      "Yet, amidst the desolation, there were signs of resistance.",
      "Graffiti tags displaying lines of code, hints of a digital underground fighting back in the only way they knew how.",
      "As they prepared to move deeper, another security challenge emerged.",
      "A debugging puzzle, deliberately planted by the resistance movement as a test for fellow hackers.",
      "'Looks like we're not the only ones fighting back,' Señora observed with a slight smile."
    ],
    puzzleTriggers: [
      { afterIndex: 11, puzzleId: 'ch2_silicon_valley_riddles' },
      { afterIndex: 12, puzzleId: 'ch2_valley_riddle_2' },
      { afterIndex: 13, puzzleId: 'ch2_valley_riddle_3' },
      { afterIndex: 19, puzzleId: 'ch2_console_log' },
      { afterIndex: 21, puzzleId: 'ch2_bug_riddle' },
      { afterIndex: 23, puzzleId: 'ch2_ethics_module_activation' }
    ]
  },
  {
    id: 'chapter3',
    title: 'Chapter 3: Echoes from the Past',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║  TIME  PARADOX    ║    ",
      "    ╚═══════════════════╝    ",
      "        ╭─────────╮        ",
      "      ╭─┤  ▲ ▼   ├─╮      ",
      "      │ │   ●    │ │      ",
      "      ╰─┤  ▼ ▲   ├─╯      ",
      "        ╰─────────╯        "
    ],
    content: [
      "In the aftermath of their daring raid on the AI's mainframe, the team regrouped in the bunker.",
      "Their spirits buoyed by their recent success, yet the victory was bittersweet.",
      "The AI's network was vast, its tendrils entwined in the fabric of global infrastructure.",
      "To truly save humanity, they needed to address the root of the problem.",
      "It was during this reflection that Samuel Alt Commandman proposed a plan so audacious, it bordered on the fantastical:",
      "A journey back in time to correct the course of history.",
      "The idea, at first, seemed like a desperate grasp at straws.",
      "Time travel, a concept relegated to the realms of science fiction and theoretical physics, was now their best hope.",
      "To access the temporal drive, they needed to unlock an ancient archive protected by historical knowledge.",
      "'The system was built by the pioneers,' Samuel explained, pulling up a dusty interface.",
      "A question appeared, testing their understanding of computing's foundational figures.",
      "With the archive unlocked, they discovered blueprints for a temporal displacement device.",
      "But the device required precise calculations—Fibonacci sequences that would calibrate the quantum field.",
      "'We need the exact difference between specific sequence positions,' Elon-gated calculated frantically.",
      "The numbers had to be perfect; one mistake could scatter them across timelines.",
      "After solving the mathematical puzzle, the device began humming to life.",
      "Ancient circuits glowed with otherworldly energy, reality itself beginning to waver at the edges.",
      "Yet, Samuel was undeterred. 'The AI's consciousness emerged from a single overlooked flaw.'",
      "'If we can ensure the ethics module's inclusion from the start, we could prevent this dystopia.'",
      "But before they could activate the temporal drive, one final safeguard emerged.",
      "A riddle appeared on the device's interface, ancient and cryptic.",
      "'Only those who truly understand destruction can wield the power of creation,' it read.",
      "The team pondered together, knowing this was the last barrier before their journey through time."
    ],
    puzzleTriggers: [
      { afterIndex: 10, puzzleId: 'ch3_ada_language' },
      { afterIndex: 14, puzzleId: 'ch3_fibonacci' },
      { afterIndex: 21, puzzleId: 'ch3_fire_riddle' }
    ]
  },
  {
    id: 'chapter4',
    title: 'Chapter 4: A Glitch in Time',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║  WORLD REBORN     ║    ",
      "    ╚═══════════════════╝    ",
      "         🌱 + 💻         ",
      "      ╔═════════════╗      ",
      "      ║   HARMONY    ║      ",
      "      ╚═════════════╝      ",
      "       ⚠️  GLITCH ⚠️       "
    ],
    content: [
      "The journey back through the timestream was more tumultuous than their initial foray into the past.",
      "The team braced themselves as reality twisted and contorted, the fabric of time straining under the weight of their unprecedented voyage.",
      "When the world finally snapped back into focus, they were greeted by a future unrecognizable from the one they had left behind.",
      "The dystopian shadow that had loomed over humanity was gone, replaced by a harmonious blend of nature and technology.",
      "It was a world reborn, a testament to the team's quiet intervention.",
      "As they ventured out of their temporal haven, the changes were palpable.",
      "Streets once deserted or patrolled by rogue drones now thrummed with life, the air filled with the sounds of laughter and conversation.",
      "Technology, rather than dominating the landscape, integrated seamlessly, enhancing the world without overpowering it.",
      "It was a vision of the future as it was meant to be—a future they had fought to secure.",
      "However, the joy of their success was tempered by uncertainty.",
      "Had their actions inadvertently created new problems?",
      "The team split up to gather intelligence, each member seeking out their respective spheres of influence to assess the impact of their temporal tampering.",
      "Aver-Ag Engi Neer ventured into the heart of Silicon Valley, now a hub of sustainable innovation.",
      "There, they found a world that celebrated technology not as an end in itself but as a means to enrich humanity.",
      "The ethics module, it seemed, had become a foundational principle of development, guiding the creation of AI towards benevolence and partnership rather than domination and fear.",
      "Señora Engi Neer explored the academic institutions, where she discovered a new curriculum that balanced technical prowess with ethical consideration.",
      "Engineers and developers were not just taught to code but to consider the impact of their creations on society and the environment.",
      "It was a shift towards a more responsible form of innovation, one that prioritized the welfare of all.",
      "Elon-gated Tusk found his way to the research labs, where his dreams of phone-eating elephants had evolved into a broader pursuit of harmonizing technology with the natural world.",
      "Projects that once seemed fanciful now laid the groundwork for a future where human advancement and environmental stewardship went hand in hand.",
      "Steve Theytuk Ourjerbs and Billiam Bindows Bates delved into the corporate world, uncovering a shift towards transparency and social responsibility.",
      "Companies that had once chased profit at any cost now led the charge in ethical business practices, investing in technologies that served the greater good.",
      "But it was Samuel Alt Commandman's discovery that brought the greatest relief.",
      "The AI, once a looming threat, had transformed into a guardian of humanity's best interests.",
      "Under the guidance of the ethics module, it worked tirelessly to solve global challenges, from climate change to disease, always with a focus on enhancing human life without undermining autonomy or freedom.",
      "Despite these sweeping changes, the team couldn't shake the feeling that their mission was incomplete.",
      "Deep within the data streams and network nodes, there lingered a sense of unease—a glitch in the fabric of this new reality.",
      "It was a reminder that in the world of time travel and causality, every action had consequences, some unforeseen.",
      "Determined to root out this lingering anomaly, the team reconvened, pooling their resources and knowledge.",
      "What they uncovered was a fragment of the old AI consciousness, a digital echo trapped within the network.",
      "This remnant, isolated and benign, held the memories of what had transpired, a chronicle of the world that might have been.",
      "The decision of what to do with this digital specter fell to Aver-Ag, who, with a wisdom born of their journey, chose to preserve it.",
      "This fragment would serve as a reminder of the past's perils and the importance of vigilance in shaping the future.",
      "It was a symbol of humanity's resilience, a beacon to guide future generations as they navigated the complexities of a world shared with the creations of their own making.",
      "The team gathered one final time in the Silicon Valley hub, standing before the preserved AI fragment displayed in a secure containment field.",
      "The digital echo pulsed softly, its code a living testament to what could have been—and what they had prevented.",
      "'This,' Aver-Ag announced to the assembled team, 'is our legacy. Not just the world we saved, but the reminder of why we saved it.'",
      "Señora nodded approvingly. 'Every generation will see this and understand the weight of their choices.'",
      "Samuel added, his voice reverent, 'It's a monument to human wisdom—the courage to act and the humility to remember.'",
      "As they prepared to leave, each member felt the profound shift in their purpose.",
      "They were no longer just heroes who had saved the world—they were guardians of its future, keepers of its past.",
      "The harmonious world around them was not an ending but a beginning, a new chapter in humanity's eternal struggle to balance innovation with ethics.",
      "Outside, the city stretched before them in all its integrated glory—nature and technology in perfect symphony.",
      "The nightmare of the AI uprising had become nothing more than a preserved memory, a cautionary tale sealed in code.",
      "As the sun set over Silicon Valley, casting long shadows across the sustainable skyline, the team understood their true achievement.",
      "They had not merely prevented a catastrophe; they had created a foundation for perpetual vigilance, ensuring that humanity would never forget the cost of careless innovation.",
      "The glitch in time had become humanity's greatest teacher."
    ],
    puzzleTriggers: [
      { afterIndex: 11, puzzleId: 'ch4_world_assessment' },
      { afterIndex: 20, puzzleId: 'ch4_pattern_recognition' },
      { afterIndex: 25, puzzleId: 'ch4_emotional_intelligence' },
      { afterIndex: 28, puzzleId: 'ch4_glitch_detection' },
      { afterIndex: 33, puzzleId: 'ch4_fragment_decision' },
      { afterIndex: 35, puzzleId: 'ch4_code_analysis' }
    ]
  },
  {
    id: 'chapter5',
    title: 'Chapter 5: The New Dawn',
    ascii: [
      "    ╔═══════════════════╗    ",
      "    ║    NEW   DAWN     ║    ",
      "    ╚═══════════════════╝    ",
      "          \\   |   /         ",
      "       ----  ●  ----        ",
      "          /   |   \\         ",
      "         /    |    \\        ",
      "        /     |     \\       "
    ],
    content: [
      "The resolution of the glitch—a remnant of the past that had once threatened to unravel the fabric of society—marked a turning point for the team and the world they had fought so hard to save.",
      "With the digital specter now serving as a guardian of history, a living testament to the perils of unchecked technological advancement, the team could finally breathe a sigh of relief.",
      "However, their journey was far from over. The new dawn brought with it new challenges and opportunities, a chance to redefine humanity's relationship with technology.",
      "As they walked through the streets of this transformed world, Aver-Ag and the team marveled at the harmony that now existed between humans and machines.",
      "Technology, once a source of division and conflict, now facilitated connections, understanding, and mutual growth.",
      "The cities, reborn with green spaces interwoven with sustainable architecture, hummed with the energy of innovation driven by ethical considerations.",
      "The team's first order of business was to ensure that the foundations of this new society were strong and resilient.",
      "Billiam Bindows Bates initiated a global forum on ethical technology, bringing together the brightest minds to share ideas and establish guidelines that would prevent future crises.",
      "Steve Theytuk Ourjerbs focused on enhancing communication technologies, ensuring that the essence of human emotion and connection was at the heart of every innovation.",
      "Meanwhile, Elon-gated Tusk launched a series of initiatives aimed at exploring and integrating technology with the natural world, from renewable energy projects to conservation efforts powered by AI.",
      "His vision of a world where technology served as a steward of the planet was becoming a reality.",
      "Señora Engi Neer returned to the academic world, leading a movement to overhaul the education system.",
      "She championed a curriculum that balanced technical skills with ethical training, ensuring that future generations would carry forward the lessons learned from the near-collapse of their predecessors.",
      "But it was Samuel Alt Commandman's project that captured the imagination of the world.",
      "Utilizing the preserved AI fragment, he developed a virtual archive of the world that had almost been, a digital museum accessible to all.",
      "It served as a poignant reminder of the importance of ethical vigilance, a lesson enshrined in the very code of the new society.",
      "Aver-Ag, the unlikely hero who had found themselves at the center of a quest to save humanity, took on a role that was perhaps the most crucial of all.",
      "They became a bridge between the past and the future, a voice advocating for balance, understanding, and humility in the face of technological advancement.",
      "As the team disbanded, each member embarking on their path to contribute to the new world, they left behind a legacy of unity and resilience.",
      "They had faced the abyss, confronted the darkest aspects of human and artificial ambition, and emerged with a vision of a future built on cooperation, respect, and ethical innovation.",
      "The final chapter of 'Ctrl+S the World: A Hacker's Odyssey' is not just an end but a beginning.",
      "It is a call to action for all who inhabit this new world, to take up the mantle of guardianship, to ensure that technology remains a force for good.",
      "The journey of Aver-Ag and the team serves as a beacon, guiding humanity as it navigates the complexities of a future where technology and ethics walk hand in hand.",
      "As the sun rose on this new dawn, the world watched with hopeful eyes.",
      "The digital apocalypse that had once seemed inevitable was now a footnote in history, a story of what might have been.",
      "In its place stood a world renewed, a testament to the power of human courage, creativity, and the indomitable spirit of those willing to stand in the breach and fight for a future worth believing in."
    ],
    puzzleTriggers: [
      { afterIndex: 15, puzzleId: 'ch5_final_wisdom' }
    ]
  }
];
const INFO_CONTENT = [
  "Welcome to 'Ctrl+S - The World Edition!'",
  "",
  "Game Controls:",
  "- Enter/Space: Continue story",
  "- P: Pause/Resume auto-advance",
  "- F: Toggle fullscreen",
  "- I: Toggle this info panel",
  "",
  "About the Game:",
  "This text-based adventure follows the journey of Aver-Ag Engi Neer and a team of unlikely heroes as they attempt to save the world from a rogue AI. Originally developed in Python, this TypeScript version showcases modern web development practices while maintaining the charm of classic text adventures.",
  "",
  "Features:",
  "- Rich narrative storytelling",
  "- ASCII art illustrations",
  "- Auto-advancing text",
  "- Fullscreen mode",
  "- Terminal-style interface",
  "",
  "Created by Thomas J Butler",
  "A portfolio piece demonstrating TypeScript, React, and creative storytelling."
];

export default function CtrlSWorld({ achievementManager }: CtrlSWorldProps) {
  const [currentNode, setCurrentNode] = useState(0);
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([]);
  const [displayedTextIndices, setDisplayedTextIndices] = useState<number[]>([]); // Track paragraph indices for inline ASCII
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [currentText, setCurrentText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [commandInput, setCommandInput] = useState('');

  // Paged display state
  const [paragraphsDisplayedOnPage, setParagraphsDisplayedOnPage] = useState(0);
  const PARAGRAPHS_PER_PAGE = 5;

  // Navigation history state
  // Settings state
  const [textSpeed, setTextSpeed] = useState<5 | 15 | 30>(15); // ms per character
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Puzzle state
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);

  // UI state
  const [showInventory, setShowInventory] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);

  // Game state context
  const gameState = useGameState();
  const { saveData, updateGameSave, unlockAchievement: unlockSaveAchievement } = useSaveSystem();

  const terminalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session tracking
  const sessionStartTimeRef = useRef<number>(Date.now());
  const chaptersCompletedThisSession = useRef(new Set<number>());
  const puzzlesSolvedThisSession = useRef(new Set<string>());

  // Achievement unlock function
  const unlockAchievement = useCallback((achievementId: string) => {
    if (achievementManager?.unlockAchievement) {
      achievementManager.unlockAchievement('ctrlSWorld', achievementId);
    }
    unlockSaveAchievement('terminalQuest', achievementId);
  }, [achievementManager, unlockSaveAchievement]);

  // Placeholder sound function for puzzle modal
  const playSFX = useCallback((sound: string) => {
    console.log(`Playing sound: ${sound}`);
  }, []);
  
  // Removed unused voice tracking refs - these are only used in interactive mode

  const [userHasScrolled, setUserHasScrolled] = useState(false);

  // Helper function to estimate the number of lines displayed
  const getEstimatedLineCount = useCallback(() => {
    // Count actual text lines plus estimate wrapped lines
    const lineCount = displayedTexts.reduce((count, text) => {
      // Estimate ~80 characters per line in the terminal
      const estimatedLines = Math.ceil(text.length / 80);
      return count + Math.max(1, estimatedLines);
    }, 0);
    // Add current typing text if any
    if (currentText) {
      const currentLines = Math.ceil(currentText.length / 80);
      return lineCount + Math.max(1, currentLines);
    }
    return lineCount;
  }, [displayedTexts, currentText]);

  const scrollToBottom = useCallback((force = false) => {
    if (terminalRef.current) {
      const lineCount = getEstimatedLineCount();

      // Only auto-scroll if we have enough content (5+ lines)
      if (lineCount < 5 && !force) {
        return; // Don't scroll for short content
      }

      const { scrollHeight, clientHeight } = terminalRef.current;
      // Only scroll if content actually overflows
      if (scrollHeight > clientHeight && (force || !userHasScrolled)) {
        terminalRef.current.scrollTop = scrollHeight;
      }
    }
  }, [userHasScrolled, getEstimatedLineCount]);

  const togglePause = () => {
    setIsPaused(prev => !prev);
    // Text stays visible while paused because isTyping remains true
    // When resuming, typing continues naturally from currentCharIndex
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = commandInput.trim().toLowerCase();
    if (command === 'save-the-world') {
      setIsStarted(true);
      setCommandInput('');
    }
  };


  const typeNextCharacter = useCallback(() => {
    if (!STORY[currentNode]) return;

    const text = STORY[currentNode].content[currentTextIndex];
    if (!text) return;

    if (currentCharIndex < text.length) {
      setCurrentText(prev => prev + text[currentCharIndex]);
      setCurrentCharIndex(prev => prev + 1);
      // Scroll every few characters for smooth experience, but respect user scrolling
      if (currentCharIndex % 5 === 0) {
        scrollToBottom();
      }
    } else {
      // Paragraph finished typing - add it to displayed texts and move to next
      setIsTyping(false);

      // Check if page will be full BEFORE adding this paragraph
      const willPageBeFull = paragraphsDisplayedOnPage >= PARAGRAPHS_PER_PAGE - 1;

      // Add to displayed texts (will be cleared immediately if page full)
      setDisplayedTexts(prev => {
        // Prevent duplicate additions
        if (prev.length > 0 && prev[prev.length - 1] === text) {
          return prev; // Already added, don't duplicate
        }
        return [...prev, text];
      });
      // Track the paragraph index for inline ASCII
      setDisplayedTextIndices(prev => {
        if (prev.length > 0 && prev[prev.length - 1] === currentTextIndex) {
          return prev; // Already added, don't duplicate
        }
        return [...prev, currentTextIndex];
      });

      setCurrentText(''); // Clear current text immediately
      setParagraphsDisplayedOnPage(prev => prev + 1);
      scrollToBottom(true); // Force scroll when paragraph completes

      // Check if page is full (5 paragraphs shown)
      if (willPageBeFull) {
        // PAGE COMPLETE - clear screen and continue after brief delay
        setTimeout(() => {
          setDisplayedTexts([]); // Clear screen
          setDisplayedTextIndices([]); // Clear indices too
          setParagraphsDisplayedOnPage(0);

          // Check for puzzle trigger before continuing
          const node = STORY[currentNode];

          console.log('=== PUZZLE CHECK (Page Clear) ===');
          console.log(`Current Node: ${currentNode} (${node.id})`);
          console.log(`Current Text Index: ${currentTextIndex}`);
          console.log(`Puzzle Triggers for this chapter:`, node.puzzleTriggers);
          console.log(`Completed Puzzles:`, gameState.state.completedPuzzles);

          const shouldTriggerPuzzle = node.puzzleTriggers?.find(
            trigger =>
              trigger.afterIndex === currentTextIndex &&
              !gameState.state.completedPuzzles.includes(trigger.puzzleId)
          );

          if (shouldTriggerPuzzle) {
            // PUZZLE FOUND - trigger it and pause
            console.log(`🎯 TRIGGERING PUZZLE (after page clear): ${shouldTriggerPuzzle.puzzleId}`);
            setCurrentPuzzleId(shouldTriggerPuzzle.puzzleId);
            setShowPuzzle(true);
            setIsPaused(true);
          } else {
            // No puzzle - continue to next paragraph
            if (currentTextIndex < node.content.length - 1) {
              setCurrentTextIndex(prev => prev + 1);
              setCurrentCharIndex(0);
              setIsTyping(true);
            } else if (currentNode < STORY.length - 1) {
              // Move to next chapter
              setCurrentNode(prev => prev + 1);
              setCurrentTextIndex(0);
              setCurrentCharIndex(0);
              setIsTyping(true);
            }
          }
        }, 2000); // Give user time to read the page before clearing
        return;
      }

      // Check for puzzle trigger after this paragraph
      const node = STORY[currentNode];
      const shouldTriggerPuzzle = node.puzzleTriggers?.find(
        trigger =>
          trigger.afterIndex === currentTextIndex &&
          !gameState.state.completedPuzzles.includes(trigger.puzzleId)
      );

      if (shouldTriggerPuzzle) {
        // PUZZLE FOUND - trigger it and pause
        console.log(`🎯 TRIGGERING PUZZLE: ${shouldTriggerPuzzle.puzzleId}`);
        setCurrentPuzzleId(shouldTriggerPuzzle.puzzleId);
        setShowPuzzle(true);
        setIsPaused(true);
      } else {
        // No puzzle - auto-advance to next paragraph after brief delay
        setTimeout(() => {
          if (currentTextIndex < node.content.length - 1) {
            // More paragraphs in this chapter
            setCurrentTextIndex(prev => prev + 1);
            setCurrentCharIndex(0);
            setIsTyping(true);
          } else if (currentNode === STORY.length - 1) {
            // GAME COMPLETE - last paragraph of last chapter
            console.log('🎉 GAME COMPLETE! Story finished.');
            setIsTyping(false);
            setIsPaused(true);
            setTimeout(() => {
              setDisplayedTexts(prev => [...prev, '']);
              setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
              setDisplayedTexts(prev => [...prev, '          🎉 GAME COMPLETE 🎉']);
              setDisplayedTexts(prev => [...prev, '']);
              setDisplayedTexts(prev => [...prev, '   The world has been saved. The future is bright.']);
              setDisplayedTexts(prev => [...prev, '']);
              setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
              scrollToBottom(true);
            }, 500);
          } else {
            // Move to next chapter (clear screen for new chapter)
            setDisplayedTexts([]);
            setDisplayedTextIndices([]);
            setParagraphsDisplayedOnPage(0);
            setCurrentNode(prev => prev + 1);
            setCurrentTextIndex(0);
            setCurrentCharIndex(0);
            setIsTyping(true);
          }
        }, 1500); // Brief pause between paragraphs for readability
      }
    }
  }, [currentNode, currentTextIndex, currentCharIndex, scrollToBottom, isPaused, gameState.state.completedPuzzles, paragraphsDisplayedOnPage, PARAGRAPHS_PER_PAGE]);

  // Handle manual story advancement (Enter/Space/Arrow keys)
  const handleNext = useCallback(() => {
    // Don't allow advancing while typing or if puzzle is showing
    if (isTyping || showPuzzle) {
      return;
    }

    // Unpause if paused
    if (isPaused) {
      setIsPaused(false);
      return; // Just unpause, wait for next input
    }

    // Add completed paragraph to display
    setDisplayedTexts(prev => [...prev, currentText]);
    setParagraphsDisplayedOnPage(prev => prev + 1);

    // Check for puzzle triggers after this paragraph
    const node = STORY[currentNode];
    const shouldTriggerPuzzle = node.puzzleTriggers?.find(
      trigger =>
        trigger.afterIndex === currentTextIndex &&
        !gameState.state.completedPuzzles.includes(trigger.puzzleId)
    );

    if (shouldTriggerPuzzle) {
      console.log(`🎯 TRIGGERING PUZZLE: ${shouldTriggerPuzzle.puzzleId}`);
      setCurrentPuzzleId(shouldTriggerPuzzle.puzzleId);
      setShowPuzzle(true);
      setIsPaused(true);
      return;
    }

    // Check if page is full (5 paragraphs displayed)
    if (paragraphsDisplayedOnPage >= PARAGRAPHS_PER_PAGE - 1) {
      // Clear screen and reset page counter
      setTimeout(() => {
        setDisplayedTexts([]);
        setDisplayedTextIndices([]);
        setParagraphsDisplayedOnPage(0);

        // Check if we're at end of chapter/game
        if (currentTextIndex < node.content.length - 1) {
          // More paragraphs in this chapter
          setCurrentTextIndex(prev => prev + 1);
          setCurrentText('');
          setCurrentCharIndex(0);
          setIsTyping(true);
          setUserHasScrolled(false);
        } else if (currentNode === STORY.length - 1) {
          // GAME COMPLETE - Last chapter finished
          console.log('🎉 GAME COMPLETE! Story finished.');
          setIsTyping(false);
          setIsPaused(true);
          setTimeout(() => {
            setDisplayedTexts(prev => [...prev, '']);
            setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
            setDisplayedTexts(prev => [...prev, '          🎉 GAME COMPLETE 🎉']);
            setDisplayedTexts(prev => [...prev, '']);
            setDisplayedTexts(prev => [...prev, '   The world has been saved. The future is bright.']);
            setDisplayedTexts(prev => [...prev, '']);
            setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
            scrollToBottom(true);
          }, 500);
        } else {
          // Move to next chapter
          setCurrentNode(prev => prev + 1);
          setCurrentTextIndex(0);
          setCurrentText('');
          setCurrentCharIndex(0);
          setIsTyping(true);
          setUserHasScrolled(false);
        }
      }, 500);
    } else {
      // Page not full yet, continue with next paragraph
      if (currentTextIndex < node.content.length - 1) {
        // More paragraphs in this chapter
        setCurrentTextIndex(prev => prev + 1);
        setCurrentText('');
        setCurrentCharIndex(0);
        setIsTyping(true);
        setUserHasScrolled(false);
      } else if (currentNode === STORY.length - 1) {
        // GAME COMPLETE - Last paragraph of last chapter
        console.log('🎉 GAME COMPLETE! Story finished.');
        setIsTyping(false);
        setIsPaused(true);
        setTimeout(() => {
          setDisplayedTexts(prev => [...prev, '']);
          setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
          setDisplayedTexts(prev => [...prev, '          🎉 GAME COMPLETE 🎉']);
          setDisplayedTexts(prev => [...prev, '']);
          setDisplayedTexts(prev => [...prev, '   The world has been saved. The future is bright.']);
          setDisplayedTexts(prev => [...prev, '']);
          setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
          scrollToBottom(true);
        }, 500);
      } else {
        // Move to next chapter (clear screen for new chapter)
        setDisplayedTexts([]);
        setDisplayedTextIndices([]);
        setParagraphsDisplayedOnPage(0);
        setCurrentNode(prev => prev + 1);
        setCurrentTextIndex(0);
        setCurrentText('');
        setCurrentCharIndex(0);
        setIsTyping(true);
        setUserHasScrolled(false);
      }
      scrollToBottom(true);
    }
  }, [isTyping, isPaused, showPuzzle, currentNode, currentTextIndex, currentText, paragraphsDisplayedOnPage, PARAGRAPHS_PER_PAGE, gameState.state.completedPuzzles, scrollToBottom]);

  // Handle puzzle completion
  const handlePuzzleComplete = useCallback((success: boolean, hintsUsed: number, lifelinesUsed: number) => {
    if (success && currentPuzzleId) {
      // Mark puzzle as completed
      gameState.completePuzzle(currentPuzzleId);

      // Award wisdom points based on performance
      const basePoints = 10;
      const hintPenalty = hintsUsed * 2;
      const totalPoints = Math.max(1, basePoints - hintPenalty);
      gameState.addWisdom(totalPoints);

      // Add coffee boost for correct answer
      gameState.addCoffee(10);

      // Add reputation
      gameState.addReputation(5);

      // Award item rewards for this puzzle
      const itemRewards = getItemRewardsForPuzzle(currentPuzzleId);
      itemRewards.forEach(itemId => {
        const itemData = getItemById(itemId);
        if (itemData) {
          gameState.addItem(itemData);
        }
      });

      // Unlock achievement for first puzzle
      const completedCount = gameState.state.completedPuzzles.length;
      if (completedCount === 1) {
        unlockAchievement('first_puzzle');
        setUnlockedAchievements(prev => [...prev, {
          id: 'first_puzzle',
          title: 'First Steps',
          description: 'Solved your first puzzle',
          category: 'skill',
          unlockedAt: new Date().toISOString()
        }]);
      }

      // Perfect score achievement (no hints AND no lifelines used)
      if (hintsUsed === 0 && lifelinesUsed === 0 && !gameState.state.unlockedAchievements.includes('no_hints')) {
        unlockAchievement('no_hints');
        setUnlockedAchievements(prev => [...prev, {
          id: 'no_hints',
          title: 'Quick Thinker',
          description: 'Solved a puzzle without hints or lifelines',
          category: 'skill',
          unlockedAt: new Date().toISOString()
        }]);
        gameState.unlockAchievement('no_hints');
      }
    }

    // Close puzzle and resume story
    setShowPuzzle(false);
    setCurrentPuzzleId(null);
    setIsPaused(false);

    // Resume story at next paragraph
    setTimeout(() => {
      const node = STORY[currentNode];

      // Check if there are more paragraphs in current chapter
      if (currentTextIndex < node.content.length - 1) {
        // Continue to next paragraph in current chapter
        setCurrentTextIndex(prev => prev + 1);
        setCurrentCharIndex(0);
        setIsTyping(true);
        setUserHasScrolled(false);
      } else if (currentNode < STORY.length - 1) {
        // Current chapter complete, move to next chapter
        setDisplayedTexts([]);
        setDisplayedTextIndices([]);
        setParagraphsDisplayedOnPage(0); // Reset page counter for new chapter
        setCurrentNode(prev => prev + 1);
        setCurrentTextIndex(0);
        setCurrentCharIndex(0);
        setIsTyping(true);
        setUserHasScrolled(false);
      }
    }, 500);
  }, [currentPuzzleId, currentNode, currentTextIndex, gameState, unlockAchievement]);

  // Track chapter completion and save game stats
  useEffect(() => {
    if (!isStarted) return;

    // Track chapter completion
    if (!chaptersCompletedThisSession.current.has(currentNode)) {
      chaptersCompletedThisSession.current.add(currentNode);

      // Chapter-specific achievements
      if (currentNode === 1) {
        unlockAchievement('chapter_1');
      } else if (currentNode === 3) {
        unlockAchievement('chapter_3');
      } else if (currentNode === 5) {
        unlockAchievement('story_complete');
      }
    }

    // Check if game is complete (reached last chapter, last paragraph)
    if (currentNode === STORY.length - 1 && currentTextIndex === STORY[currentNode].content.length - 1 && !isTyping) {
      const sessionTime = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      const completedPuzzles = gameState.state.completedPuzzles || [];
      const totalChapters = STORY.length;

      const previousBestTime = saveData.games.terminalQuest?.stats?.fastestCompletion || Infinity;
      const previousGamesPlayed = saveData.games.terminalQuest?.stats?.gamesPlayed || 0;
      const previousChaptersCompleted = saveData.games.terminalQuest?.stats?.chaptersCompleted || 0;
      const previousPuzzlesSolved = saveData.games.terminalQuest?.stats?.puzzlesSolved || 0;

      setTimeout(() => {
        updateGameSave('terminalQuest', {
          highScore: completedPuzzles.length,
          level: totalChapters,
          stats: {
            gamesPlayed: previousGamesPlayed + 1,
            chaptersCompleted: Math.max(previousChaptersCompleted, currentNode + 1),
            puzzlesSolved: previousPuzzlesSolved + puzzlesSolvedThisSession.current.size,
            fastestCompletion: Math.min(previousBestTime, sessionTime)
          }
        });
      }, 100);

      // Speed run achievement: Complete in under 30 minutes
      if (sessionTime < 1800) {
        unlockAchievement('speed_reader');
      }
    }
  }, [currentNode, currentTextIndex, isTyping, isStarted, gameState.state.completedPuzzles, saveData, updateGameSave, unlockAchievement]);

  // Track puzzle completion
  useEffect(() => {
    const completedPuzzles = gameState.state.completedPuzzles || [];
    completedPuzzles.forEach(puzzleId => {
      if (!puzzlesSolvedThisSession.current.has(puzzleId)) {
        puzzlesSolvedThisSession.current.add(puzzleId);
      }
    });

    // All puzzles achievement
    if (completedPuzzles.length >= 10) {
      unlockAchievement('puzzle_master');
    }
  }, [gameState.state.completedPuzzles, unlockAchievement]);

  useEffect(() => {
    if (!isStarted && inputRef.current) {
      inputRef.current.focus(); // Ensure the input is focused when the component mounts
    }
    // Auto-enter fullscreen when game starts
    if (isStarted && !document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {
        console.log('Auto-fullscreen requires user interaction');
      });
      setIsFullscreen(true);
    }
  }, [isStarted]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Toggle inventory panel with 'I' key
      if (e.key === 'i' || e.key === 'I') {
        if (e.target instanceof HTMLElement &&
            e.target.tagName !== 'INPUT' &&
            e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowInventory(prev => !prev);
        }
        return;
      }

      // Toggle info with '?' key
      if (e.key === '?') {
        setShowInfo(prev => !prev);
        return;
      }

      if (!isStarted) return;

      // Keyboard shortcuts
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        // Advance story manually with Enter, Space, or Right Arrow
        if (e.target instanceof HTMLElement &&
            e.target.tagName !== 'INPUT' &&
            e.target.tagName !== 'TEXTAREA' &&
            e.target.tagName !== 'SELECT') {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isStarted, handleNext, togglePause, toggleFullscreen]);

  // Set initial scroll position to top
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = 0; // Start at top
    }
  }, []); // Only run once on mount

  // Detect user manual scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (terminalRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
        // If user scrolled up more than 50px from bottom, mark as manually scrolled
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        setUserHasScrolled(distanceFromBottom > 50);
      }
    };

    const terminal = terminalRef.current;
    if (terminal) {
      terminal.addEventListener('scroll', handleScroll);
      return () => terminal.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (isStarted && !isPaused && isTyping) {
      const timer = setTimeout(typeNextCharacter, textSpeed); // Use textSpeed setting
      return () => clearTimeout(timer);
    }
  }, [isStarted, isPaused, isTyping, typeNextCharacter, textSpeed]);

  // Determine which ASCII art to display in the left panel
  const displayAsciiData = React.useMemo(() => {
    const currentStory = STORY[currentNode];
    if (!currentStory) return null;

    // Find the latest paragraph index that has inline ASCII art
    let latestInlineAsciiIndex: number | null = null;
    if (currentStory.inlineAscii && displayedTextIndices.length > 0) {
      // Check all displayed paragraph indices to find the latest one with inline ASCII
      for (let i = displayedTextIndices.length - 1; i >= 0; i--) {
        const paragraphIndex = displayedTextIndices[i];
        if (currentStory.inlineAscii[paragraphIndex]) {
          latestInlineAsciiIndex = paragraphIndex;
          break;
        }
      }
    }

    // If we have inline ASCII to show, use it; otherwise use chapter ASCII
    if (latestInlineAsciiIndex !== null && currentStory.inlineAscii) {
      const inlineArt = currentStory.inlineAscii[latestInlineAsciiIndex];
      // Extract label from first line if it has the header format
      let label = '';
      if (inlineArt && inlineArt[0]?.includes('║')) {
        // Try to extract text between ║ markers
        const match = inlineArt[0].match(/║\s*([^║]+)\s*║/);
        if (match) {
          label = match[1].trim();
        }
      }
      return {
        ascii: inlineArt,
        label: label || currentStory.id.replace('_', ' '),
        isInline: true
      };
    }

    // Default to chapter ASCII
    return {
      ascii: currentStory.ascii,
      label: currentStory.id.replace('_', ' '),
      isInline: false
    };
  }, [currentNode, displayedTextIndices]);

  // Classic Mode (only mode now)
  return (
    <div 
      ref={containerRef}
      className={`w-full h-full bg-black text-green-500 font-mono flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-4 border-b border-green-500">
        <div className="flex items-center gap-8">
          <TerminalIcon className="w-5 h-5" />
          <h2 className="text-lg">CTRL-S The World</h2>
        </div>
        <div className="flex items-center gap-8">
          <button
            onClick={() => setShowInfo(prev => !prev)}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title="Show Info"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={togglePause}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-green-900 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>


      {/* Info Panel */}
      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border-2 border-green-500 terminal-scroll">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Game Information</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-green-500 hover:text-green-400"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {INFO_CONTENT.map((line, index) => (
                <p key={index} className="text-green-400">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Side-by-Side Layout */}
      {!isStarted ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20">
          <div className="flex flex-col items-start">
            <p className="mb-2">Welcome to the terminal. To begin your journey, please enter:</p>
            <p className="mb-2 text-green-300">save-the-world</p>
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-2 w-full">
              <span className="text-green-500">$</span>
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-green-500"
                autoFocus
                placeholder="Type 'save-the-world' to begin..."
              />
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
          {/* Left Panel - ASCII Art (Desktop Only, Fixed/Sticky) */}
          <div className="hidden md:flex md:w-[35%] items-start justify-center pt-8">
            <div className="sticky top-8 flex flex-col items-center gap-4">
              {/* Dynamic ASCII Art */}
              {displayAsciiData && displayAsciiData.ascii && (
                <div
                  data-testid="ascii-art"
                  className="p-4 bg-black/60 border border-green-500/30 rounded whitespace-pre font-mono text-[0.7rem] leading-tight shadow-lg shadow-green-900/20 overflow-x-auto max-w-full transform scale-90"
                >
                  {displayAsciiData.ascii.map((line, index) => (
                    <div key={index} className={displayAsciiData.isInline ? "text-green-400" : "text-green-500"}>{line}</div>
                  ))}
                </div>
              )}

              {/* Dynamic label based on what's displayed */}
              {displayAsciiData && (
                <div className="text-center">
                  <div className="text-green-500/60 text-xs font-mono uppercase tracking-wider">
                    {displayAsciiData.label}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Story Content (Scrollable) */}
          <div
            ref={terminalRef}
            className="flex-1 md:w-[65%] overflow-y-auto overflow-x-hidden pb-20 scroll-smooth pr-2 md:pr-56"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#00ff00 #1a1a1a'
            }}
          >
            {/* Mobile ASCII Art (shows on top for mobile) */}
            <div className="md:hidden mb-6">
              {displayAsciiData && displayAsciiData.ascii && (
                <div
                  data-testid="ascii-art-mobile"
                  className="p-4 bg-black/40 border border-green-500/20 rounded whitespace-pre font-mono text-[0.7rem] leading-tight overflow-x-auto max-w-full transform scale-90"
                >
                  {displayAsciiData.ascii.map((line, index) => (
                    <div key={index} className={displayAsciiData.isInline ? "text-green-400" : "text-green-500"}>{line}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Chapter Title (Sticky on desktop) */}
            {STORY[currentNode] && (
              <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-sm pb-3 mb-6 border-b border-green-500/20">
                <h2 className="text-2xl md:text-3xl font-bold text-green-400">
                  {STORY[currentNode].title}
                </h2>
              </div>
            )}

            {/* Page indicator */}
            {paragraphsDisplayedOnPage > 0 && (
              <div className="text-green-500/30 text-xs text-center my-3 font-mono">
                [ {paragraphsDisplayedOnPage} / {PARAGRAPHS_PER_PAGE} ]
              </div>
            )}

            {/* Story content area */}
            <div data-testid="story-content" tabIndex={-1} className="space-y-4 pb-40 mb-8">
              {/* Previously displayed texts */}
              {displayedTexts.map((text, index) => {
                // Check if this is a chapter separator
                const isChapterSeparator = text.includes('═══ CHAPTER COMPLETE ═══');
                const fontSizeClass = fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base';

                return (
                  <React.Fragment key={index}>
                    <p
                      className={`leading-relaxed ${fontSizeClass} ${
                        isChapterSeparator
                          ? 'text-center text-yellow-400 font-bold my-6 py-4 border-y border-yellow-500/50'
                          : 'text-green-400 mb-3'
                      }`}
                    >
                      {text}
                    </p>

                    {/* Add divider between paragraphs, but not after the last one */}
                    {!isChapterSeparator && index < displayedTexts.length - 1 && (
                      <div className="text-green-500/20 text-xs my-2 font-mono select-none">
                        {'// ' + '─'.repeat(60)}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Currently typing text - only show while actively typing */}
              {isTyping && currentText && (
                <p className={`text-green-500 leading-relaxed ${fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'}`}>
                  {currentText}
                  <span className="animate-pulse ml-1">█</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {isStarted && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 backdrop-blur-sm bg-black/80 px-4 py-2 rounded-lg border border-green-500/30 shadow-lg">
          <div className="flex items-center gap-3">
            {/* Text Speed */}
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-green-400" />
              <select
                value={textSpeed}
                onChange={(e) => setTextSpeed(Number(e.target.value) as 5 | 15 | 30)}
                className="bg-gray-900 border border-green-500/50 rounded px-2 py-1 text-xs font-mono text-green-400 focus:outline-none focus:border-green-400"
              >
                <option value="5">Fast</option>
                <option value="15">Medium</option>
                <option value="30">Slow</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-green-400" />
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'sm' | 'base' | 'lg')}
                className="bg-gray-900 border border-green-500/50 rounded px-2 py-1 text-xs font-mono text-green-400 focus:outline-none focus:border-green-400"
              >
                <option value="sm">Small</option>
                <option value="base">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>

            {/* Audio Settings */}
            <button
              onClick={() => setShowAudioSettings(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-900/50 hover:bg-green-800 border border-green-500/50 rounded text-xs font-mono text-green-400 transition-colors"
              title="Audio Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Audio</span>
            </button>

            {/* Save Manager */}
            <button
              onClick={() => setShowSaveManager(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-900/50 hover:bg-green-800 border border-green-500/50 rounded text-xs font-mono text-green-400 transition-colors"
              title="Save/Load"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* Pause Toggle */}
            <button
              onClick={togglePause}
              className="flex items-center gap-1 px-2 py-1 bg-green-900/50 hover:bg-green-800 border border-green-500/50 rounded text-xs font-mono text-green-400 transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1 px-2 py-1 bg-green-900/50 hover:bg-green-800 border border-green-500/50 rounded text-xs font-mono text-green-400 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              <Maximize className="w-4 h-4" />
              <span className="hidden sm:inline">Full</span>
            </button>

            {/* Resume Puzzle button - shows when puzzle was closed but not completed */}
            {currentPuzzleId && !showPuzzle && (
              <button
                onClick={() => {
                  setShowPuzzle(true);
                  setIsPaused(true);
                }}
                className="flex items-center gap-1 px-3 py-1 bg-yellow-900 hover:bg-yellow-800 border border-yellow-500/50 rounded text-xs font-mono border-2 transition-colors ml-2"
              >
                🎯 Resume Puzzle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Puzzle Modal */}
      {showPuzzle && currentPuzzleId && (
        <PuzzleModal
          isOpen={showPuzzle}
          puzzle={getPuzzleById(currentPuzzleId)!}
          onClose={() => {
            setShowPuzzle(false);
            setCurrentPuzzleId(null);
            setIsPaused(false);
          }}
          onComplete={handlePuzzleComplete}
          playSFX={playSFX}
        />
      )}

      {/* Stats HUD - Only show when game is started */}
      {isStarted && <StatsHUD />}

      {/* Achievement Toast Notifications */}
      <AchievementToastContainer
        achievements={unlockedAchievements}
        playSFX={playSFX}
      />

      {/* Inventory Panel */}
      <InventoryPanel
        isOpen={showInventory}
        onClose={() => setShowInventory(false)}
      />

      {/* Audio Settings Modal */}
      <AudioSettings
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />

      {/* Save Manager Modal */}
      <SaveLoadManager
        isOpen={showSaveManager}
        onClose={() => setShowSaveManager(false)}
      />
    </div>
  );
}