import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as TerminalIcon, ChevronRight, Info, Play, Pause, Maximize, Minimize } from 'lucide-react';
import { PuzzleModal } from '../ui/PuzzleModal';
import { getPuzzleById } from '../../data/puzzles';
import { useGameState } from '../../contexts/GameStateContext';
import { StatsHUD } from '../ui/StatsHUD';
import { AchievementToastContainer, Achievement } from '../ui/AchievementToast';
import { InventoryPanel } from '../ui/InventoryPanel';
import { getItemRewardsForPuzzle, getItemById } from '../../data/items';

interface AchievementManager {
  unlockAchievement(gameId: string, achievementId: string): void;
}

interface CtrlSWorldProps {
  achievementManager?: AchievementManager;
  isMuted?: boolean;
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
      { afterIndex: 23, puzzleId: 'ch2_bug_riddle' }
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
      { afterIndex: 28, puzzleId: 'ch4_glitch_detection' },
      { afterIndex: 33, puzzleId: 'ch4_fragment_decision' }
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

export default function CtrlSWorld({ achievementManager, isMuted }: CtrlSWorldProps) {
  const [currentNode, setCurrentNode] = useState(0);
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([]);
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

  // Puzzle state
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null);

  // UI state
  const [showInventory, setShowInventory] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);

  // Game state context
  const gameState = useGameState();

  const terminalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Achievement unlock function
  const unlockAchievement = useCallback((achievementId: string) => {
    if (achievementManager?.unlockAchievement) {
      achievementManager.unlockAchievement('ctrlSWorld', achievementId);
    }
  }, [achievementManager]);

  // Placeholder sound function for puzzle modal
  const playSFX = useCallback((sound: string) => {
    if (!isMuted) {
      console.log(`Playing sound: ${sound}`);
    }
  }, [isMuted]);
  
  // Removed unused voice tracking refs - these are only used in interactive mode

  const [userHasScrolled, setUserHasScrolled] = useState(false);

  const scrollToBottom = useCallback((force = false) => {
    if (terminalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
      // Force scroll on new paragraphs or when explicitly requested
      // Otherwise only scroll if user hasn't manually scrolled up
      if (force || !userHasScrolled) {
        terminalRef.current.scrollTop = scrollHeight;
      }
    }
  }, [userHasScrolled]);

  const togglePause = () => {
    setIsPaused(prev => !prev);
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
      setDisplayedTexts(prev => {
        // Prevent duplicate additions
        if (prev.length > 0 && prev[prev.length - 1] === text) {
          return prev; // Already added, don't duplicate
        }
        return [...prev, text];
      });
      setCurrentText(''); // Clear current text since it's now in displayedTexts
      setParagraphsDisplayedOnPage(prev => prev + 1);
      scrollToBottom(true); // Force scroll when paragraph completes

      // Check if page is full (7 paragraphs shown)
      if (paragraphsDisplayedOnPage >= PARAGRAPHS_PER_PAGE - 1) {
        // PAGE COMPLETE - pause, then clear and continue
        setTimeout(() => {
          setDisplayedTexts([]); // Clear screen
          setParagraphsDisplayedOnPage(0);

          // Check for puzzle trigger before continuing
          const node = STORY[currentNode];

          console.log('=== PUZZLE CHECK (Page Clear) ===');
          console.log(`Current Node: ${currentNode} (${node.id})`);
          console.log(`Current Text Index: ${currentTextIndex}`);
          console.log(`Puzzle Triggers for this chapter:`, node.puzzleTriggers);
          console.log(`Completed Puzzles:`, gameState.state.completedPuzzles);

          const shouldTriggerPuzzle = node.puzzleTriggers?.find(
            trigger => {
              const matches = trigger.afterIndex === currentTextIndex;
              const notCompleted = !gameState.state.completedPuzzles.includes(trigger.puzzleId);
              console.log(`  Checking trigger: afterIndex=${trigger.afterIndex}, puzzleId=${trigger.puzzleId}`);
              console.log(`    Matches currentTextIndex? ${matches}`);
              console.log(`    Not completed? ${notCompleted}`);
              return matches && notCompleted;
            }
          );

          console.log(`Should Trigger Puzzle:`, shouldTriggerPuzzle);
          console.log('=====================================\n');

          if (shouldTriggerPuzzle) {
            // Trigger puzzle
            console.log(`🎯 TRIGGERING PUZZLE (Page Clear): ${shouldTriggerPuzzle.puzzleId}`);
            setCurrentPuzzleId(shouldTriggerPuzzle.puzzleId);
            setShowPuzzle(true);
            setIsPaused(true);
          } else if (currentTextIndex < node.content.length - 1) {
            // Continue to next paragraph
            setCurrentTextIndex(prev => prev + 1);
            setCurrentCharIndex(0);
            setIsTyping(true);
            setUserHasScrolled(false);
          } else if (currentNode === STORY.length - 1 &&
                     currentTextIndex === node.content.length - 1) {
            // GAME COMPLETE - Last paragraph of last chapter (page clear path)
            console.log('🎉 GAME COMPLETE! Story finished (page clear).');
            setIsTyping(false);
            setIsPaused(true);

            // Add completion message
            setTimeout(() => {
              setDisplayedTexts(prev => [...prev, '']);
              setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
              setDisplayedTexts(prev => [...prev, '          🎉 GAME COMPLETE 🎉']);
              setDisplayedTexts(prev => [...prev, '']);
              setDisplayedTexts(prev => [...prev, '   The world has been saved. The future is bright.']);
              setDisplayedTexts(prev => [...prev, '']);
              setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
              scrollToBottom(true);
            }, 1000);
          } else if (currentNode < STORY.length - 1) {
            // Move to next chapter
            setCurrentNode(prev => prev + 1);
            setCurrentTextIndex(0);
            setCurrentCharIndex(0);
            setIsTyping(true);
            setUserHasScrolled(false);
          }
        }, 3000); // Give user time to read page
        return; // Don't continue until page cleared
      }

      // Normal flow - continue if not end of page
      // Check for mid-chapter puzzle triggers
      const node = STORY[currentNode];

      console.log('=== PUZZLE CHECK (Normal Flow) ===');
      console.log(`Current Node: ${currentNode} (${node.id})`);
      console.log(`Current Text Index: ${currentTextIndex}`);
      console.log(`Paragraphs on Page: ${paragraphsDisplayedOnPage}`);
      console.log(`Puzzle Triggers for this chapter:`, node.puzzleTriggers);
      console.log(`Completed Puzzles:`, gameState.state.completedPuzzles);

      const shouldTriggerPuzzle = node.puzzleTriggers?.find(
        trigger => {
          const matches = trigger.afterIndex === currentTextIndex;
          const notCompleted = !gameState.state.completedPuzzles.includes(trigger.puzzleId);
          console.log(`  Checking trigger: afterIndex=${trigger.afterIndex}, puzzleId=${trigger.puzzleId}`);
          console.log(`    Matches currentTextIndex? ${matches}`);
          console.log(`    Not completed? ${notCompleted}`);
          return matches && notCompleted;
        }
      );

      console.log(`Should Trigger Puzzle:`, shouldTriggerPuzzle);
      console.log('=====================================\n');

      if (shouldTriggerPuzzle) {
        // Trigger mid-chapter puzzle
        console.log(`🎯 TRIGGERING PUZZLE: ${shouldTriggerPuzzle.puzzleId}`);
        setTimeout(() => {
          setCurrentPuzzleId(shouldTriggerPuzzle.puzzleId);
          setShowPuzzle(true);
          setIsPaused(true);
        }, 2000);
      } else if (!isPaused && currentTextIndex < STORY[currentNode].content.length - 1) {
        // More paragraphs in this node - continue to next
        setTimeout(() => {
          setCurrentTextIndex(prev => prev + 1);
          setCurrentCharIndex(0);
          setIsTyping(true);
          setUserHasScrolled(false); // Reset scroll tracking for new paragraph
        }, 2000);
      } else if (!isPaused && currentNode === STORY.length - 1 &&
                 currentTextIndex === STORY[currentNode].content.length - 1) {
        // GAME COMPLETE - Last paragraph of last chapter reached
        console.log('🎉 GAME COMPLETE! Story finished.');
        setIsTyping(false);
        setIsPaused(true);

        // Add completion message to display
        setTimeout(() => {
          setDisplayedTexts(prev => [...prev, '']);
          setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
          setDisplayedTexts(prev => [...prev, '          🎉 GAME COMPLETE 🎉']);
          setDisplayedTexts(prev => [...prev, '']);
          setDisplayedTexts(prev => [...prev, '   The world has been saved. The future is bright.']);
          setDisplayedTexts(prev => [...prev, '']);
          setDisplayedTexts(prev => [...prev, '═══════════════════════════════════════════════']);
          scrollToBottom(true);
        }, 2000);

        // TODO: Show proper ending screen component (Phase 4)

      } else if (!isPaused && currentNode < STORY.length - 1) {
        // Move to next node if available - clear screen for new chapter
        setTimeout(() => {
          setDisplayedTexts([]); // Clear screen for new chapter
          setParagraphsDisplayedOnPage(0); // Reset page counter
          setCurrentNode(prev => prev + 1);
          setCurrentTextIndex(0);
          setCurrentCharIndex(0);
          setIsTyping(true);
          setUserHasScrolled(false);
        }, 3000); // Pause before starting new chapter
      }
    }
  }, [currentNode, currentTextIndex, currentCharIndex, scrollToBottom, isPaused, gameState.state.completedPuzzles, paragraphsDisplayedOnPage, PARAGRAPHS_PER_PAGE]);

  const handleNext = useCallback(() => {
    if (isTyping) {
      // Complete current text immediately
      const fullText = STORY[currentNode].content[currentTextIndex];
      setCurrentText(fullText);
      setCurrentCharIndex(fullText.length);
      setIsTyping(false);
      scrollToBottom(true); // Force scroll when completing text
    } else {
      // Add completed text to displayed texts - KEEP FULL HISTORY for scrolling
      setDisplayedTexts(prev => [...prev, currentText]);
      setParagraphsDisplayedOnPage(prev => prev + 1);

      // Check if page is full
      if (paragraphsDisplayedOnPage >= PARAGRAPHS_PER_PAGE - 1) {
        // Clear screen and reset page counter
        setTimeout(() => {
          setDisplayedTexts([]);
          setParagraphsDisplayedOnPage(0);

          // Move to next text or node
          if (currentTextIndex < STORY[currentNode].content.length - 1) {
            setCurrentTextIndex(prev => prev + 1);
            setCurrentText('');
            setCurrentCharIndex(0);
            setIsTyping(true);
            setUserHasScrolled(false);
          } else if (currentNode === STORY.length - 1 &&
                     currentTextIndex === STORY[currentNode].content.length - 1) {
            // GAME COMPLETE - Last paragraph of last chapter (manual page clear)
            console.log('🎉 GAME COMPLETE! Story finished (manual page clear).');
            setIsTyping(false);
            setIsPaused(true);

            // Add completion message
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
          } else if (currentNode < STORY.length - 1) {
            setCurrentNode(prev => prev + 1);
            setCurrentTextIndex(0);
            setCurrentText('');
            setCurrentCharIndex(0);
            setIsTyping(true);
            setUserHasScrolled(false);
          }
        }, 500);
      } else {
        // Move to next text or node
        if (currentTextIndex < STORY[currentNode].content.length - 1) {
          setCurrentTextIndex(prev => prev + 1);
          setCurrentText('');
          setCurrentCharIndex(0);
          setIsTyping(true);
          setUserHasScrolled(false); // Reset for new paragraph
        } else if (currentNode === STORY.length - 1 &&
                   currentTextIndex === STORY[currentNode].content.length - 1) {
          // GAME COMPLETE - Last paragraph of last chapter
          console.log('🎉 GAME COMPLETE! Story finished (manual advance).');
          setIsTyping(false);
          setIsPaused(true);

          // Add completion message
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
        } else if (currentNode < STORY.length - 1) {
          // Clear screen for new chapter
          setDisplayedTexts([]); // Clear display for fresh chapter start
          setParagraphsDisplayedOnPage(0); // Reset page counter
          setCurrentNode(prev => prev + 1);
          setCurrentTextIndex(0);
          setCurrentText('');
          setCurrentCharIndex(0);
          setIsTyping(true);
          setUserHasScrolled(false); // Reset for new chapter
        }
        scrollToBottom(true); // Force scroll on next
      }
    }
  }, [isTyping, currentNode, currentTextIndex, currentText, scrollToBottom, paragraphsDisplayedOnPage, PARAGRAPHS_PER_PAGE]);

  // Handle puzzle completion
  const handlePuzzleComplete = useCallback((success: boolean, hintsUsed: number) => {
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

      // Perfect score achievement (no hints used)
      if (hintsUsed === 0 && !gameState.state.unlockedAchievements.includes('no_hints')) {
        unlockAchievement('no_hints');
        setUnlockedAchievements(prev => [...prev, {
          id: 'no_hints',
          title: 'Quick Thinker',
          description: 'Solved a puzzle without hints',
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
        setParagraphsDisplayedOnPage(0); // Reset page counter for new chapter
        setCurrentNode(prev => prev + 1);
        setCurrentTextIndex(0);
        setCurrentCharIndex(0);
        setIsTyping(true);
        setUserHasScrolled(false);
      }
    }, 500);
  }, [currentPuzzleId, currentNode, currentTextIndex, gameState, unlockAchievement]);

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

      if (e.key === 'Enter' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, isStarted]);

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
      const timer = setTimeout(typeNextCharacter, 45); // Increased from 30ms to 45ms for more reliable typing
      return () => clearTimeout(timer);
    }
  }, [isStarted, isPaused, isTyping, typeNextCharacter]);

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
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          <h2 className="text-lg">CTRL-S The World</h2>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Main Content */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32 scroll-smooth"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: '#00ff00 #1a1a1a'
        }}
      >
        {!isStarted ? (
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
        ) : (
          <>
            {/* Chapter Title */}
            {STORY[currentNode] && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  {STORY[currentNode].title}
                </h2>
                {STORY[currentNode].ascii && (
                  <div data-testid="ascii-art" className="mb-4 whitespace-pre font-mono">
                    {STORY[currentNode].ascii.map((line, index) => (
                      <div key={index} className="text-green-500">{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Page indicator */}
            {paragraphsDisplayedOnPage > 0 && (
              <div className="text-green-500/30 text-xs text-center my-2 font-mono">
                [ {paragraphsDisplayedOnPage} / {PARAGRAPHS_PER_PAGE} ]
              </div>
            )}

            {/* Story content area */}
            <div data-testid="story-content" tabIndex={-1} className="space-y-4 pb-40 mb-8 min-h-[70vh]">
              {/* Previously displayed texts */}
              {displayedTexts.map((text, index) => {
                // Check if this is a chapter separator
                const isChapterSeparator = text.includes('═══ CHAPTER COMPLETE ═══');
                return (
                  <React.Fragment key={index}>
                    <p
                      className={`leading-relaxed ${
                        isChapterSeparator
                          ? 'text-center text-yellow-400 font-bold text-lg my-6 py-4 border-y border-yellow-500/50'
                          : 'text-green-400 mb-3'
                      }`}
                    >
                      {text}
                    </p>
                    {/* Add divider between paragraphs, but not after the last one */}
                    {!isChapterSeparator && index < displayedTexts.length - 1 && (
                      <div className="text-green-500/20 text-xs my-2 font-mono select-none">
                        {'// ' + '─'.repeat(80)}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Currently typing text - only show if there's text to show */}
              {(isTyping || currentText) && (
                <p className="text-green-500 leading-relaxed">
                  {currentText}
                  {isTyping && <span className="animate-pulse ml-1">█</span>}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      {isStarted && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30 backdrop-blur-sm bg-black/80 px-6 py-3 rounded-lg border border-green-500/30 shadow-lg">
          <div className="flex justify-between items-center gap-4">
            <div className="text-sm text-green-400">
              Press <kbd className="px-2 py-1 bg-green-900 rounded">Space</kbd> or{' '}
              <kbd className="px-2 py-1 bg-green-900 rounded">Enter</kbd> to continue
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-green-900 hover:bg-green-800 rounded text-sm"
            >
              {isTyping ? "Skip" : "Continue"} <ChevronRight className="w-4 h-4" />
            </button>
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
    </div>
  );
}