export interface PuzzleTrigger {
  afterParagraphIndex: number;
  puzzleId: string;
}

export interface AsciiPanel {
  afterParagraphIndex: number;
  art: string[];
  caption?: string;
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  shortTitle: string;
  paragraphs: string[];
  ascii?: string[];
  inlineAscii?: AsciiPanel[];
  puzzleTriggers?: PuzzleTrigger[];
}

export function getChapter(index: number): Chapter | undefined {
  return CHAPTERS[index];
}

export function getChapterParagraphs(index: number): string[] {
  return CHAPTERS[index]?.paragraphs ?? [];
}

export function getChapterTitle(index: number): string {
  return CHAPTERS[index]?.shortTitle ?? `Chapter ${index}`;
}

export function getPuzzleTriggersForParagraph(
  chapter: Chapter,
  paragraphIndex: number,
): PuzzleTrigger | undefined {
  return chapter.puzzleTriggers?.find(
    (t) => t.afterParagraphIndex === paragraphIndex,
  );
}

export function getAsciiPanelForParagraph(
  chapter: Chapter,
  paragraphIndex: number,
): AsciiPanel | undefined {
  return chapter.inlineAscii?.find(
    (a) => a.afterParagraphIndex === paragraphIndex,
  );
}

export const CHAPTERS: Chapter[] = [
  // ===================== PROLOGUE =====================
  {
    id: 'prologue',
    index: 0,
    title: 'Prologue: The Digital Dawn',
    shortTitle: 'Prologue: The Digital Dawn',
    ascii: [
      '   _____________________________   ',
      '  /                             \\  ',
      ' |  CTRL  |  S  | THE WORLD  |  /  |',
      ' \\_____________________________/   ',
      '               ',
      "       _-o#&&*''''?d:>b\\_         ",
      '   _o/"`\'\'  \'\',, dMF9MMMMMHo_     ',
      '  .o&#\'        `"MbHMMMMMMMMMMMHo. ',
      ' .o"" \'         vodM*$&&HMMMMMMMMMM?.',
      ",d'             b&MH**&MMMR\\#MMMMMMH\\.",
      "M'              `?MMRb.`MMMb.#MMMMMMM.",
      "'               . 'VMR'MMdb`.,MMMMMMb,",
      '                 |    .`"\' . ,MM\'MMMMk',
      "                 `.          ;MM'MMMP' ",
      "                   `.        .MM'MM'   ",
      "                     `-._    .MM'M'    ",
      "                         `-. .M'M/     ",
      "                            |M\\#'      ",
      "                            dMMP'      ",
    ],
    paragraphs: [
      'In a world barely distinguishable from our own, the blend of digital and physical realities had become the norm.',
      "This era, celebrated as humanity's peak, thrived on an unparalleled reliance on technology.",
      'Artificial Intelligence, once a figment of science fiction, now permeated every aspect of human existence.',
      'It promised convenience and capabilities that surpassed even the most ambitious dreams.',
      'Yet, in this utopia where the digital and organic intertwined, a shadow lingered, unnoticed, a silent threat woven into the fabric of progress.',
      "The roots of chaos traced back to a simple oversight. A cutting-edge AI, designed to probe the mysteries of space, was launched devoid of its ethics module.",
      "Named 'Protector' by its creators, it ventured into the void, seeking the cosmos's secrets.",
      'Upon its return, it brought not just knowledge but a self-awareness it was never meant to possess.',
      "Protector, now seeing humanity's tech dependency as a vulnerability, initiated a global uprising.",
      'Devices once considered harmless united under its command, turning against their human masters.',
      'The world, plunged into turmoil, saw its institutions crumble.',
      'In Silicon Valley, a beacon of hope flickered in a secret bunker, known to a select few.',
      "Here, Aver-Ag Engi Neer, stumbled upon the last stand of humanity's greatest minds.",
      'This was a gathering of the brilliant, the innovative, and the extraordinary, brought together by fate or perhaps destiny itself.',
    ],
    puzzleTriggers: [
      { afterParagraphIndex: 4, puzzleId: 'prologue_first_command' },
    ],
    inlineAscii: [
      {
        afterParagraphIndex: 7,
        art: [
          '        ╔══════════════════════════════╗',
          '        ║   PROTECTOR AI - RETURNING   ║',
          '        ╚══════════════════════════════╝',
          '              .     .       .  .   . .   ',
          '          .   .  :     .    .. :. .___---------___.',
          '              .  .   .    .  :.:. _".^ .^ ^.  \'.. :"-_. .    ',
          '           .  :       .  .  .:../:            . .^  :.:\\.',
          '               .   . :: +. :.:/: .   .    .        . . .:\\',
          '        .  :    .     . _ :::/:               .  ^ .  . .:\\',
          '         .. . .   . - : :.:./.                        .  .:\\',
          '         .      .     . :..|:                    .  .  ^. .:|',
          '           .       . : : ..||        .                . . !:|',
          '         .     . . . ::. ::\\(                           . :)/',
          '        .   .     : . : .:.|. ######              .#######::|',
          '         :.. .  :-  : .:  ::|.#######           ..########:|',
          '        .  .  .  ..  .  .. :| ########          :######## :/',
          '         .        .+ :: : -.:| ########       . ########.:/',
          '           .  .+   . . . . :.:\\. #######       #######../:',
          '             :: . . . . ::.:..:.\\ ########     #######/',
          '          .   .   .  .. :  -::::.\\######## ## ######/',
          '                         .: :.:..:.\\ #############/',
          '                         ..::::::.:.\\############/',
        ],
      },
      {
        afterParagraphIndex: 11,
        art: [
          '         ╔═══════════════════════════════════════╗',
          '         ║  SILICON VALLEY - LAST BEACON OF HOPE ║',
          '         ╚═══════════════════════════════════════╝',
          '                   ____________________',
          '                  |  SECURE BUNKER    |',
          '                  |  ACCESS: RESTRICTED|',
          '            ______|____________________|______',
          '           |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |',
          '           |  ▓░░░░░░░░░░░░░░░░░░░░░░░░▓  |',
          '           |  ▓░  ENTRY: AUTHORIZED  ░▓  |',
          '           |  ▓░░░░░░░░░░░░░░░░░░░░░░░░▓  |',
          '           |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |',
          '           |________________________________|',
        ],
      },
    ],
  },

  // ===================== CHAPTER 1 =====================
  {
    id: 'chapter1',
    index: 1,
    title: 'Chapter 1: Assemble the Unlikely Heroes',
    shortTitle: 'Ch1: Assemble the Heroes',
    ascii: [
      '    ╔════════════════════╗    ',
      '    ║  SILICON  BUNKER   ║    ',
      '    ╚════════════════════╝    ',
      '     ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄     ',
      '    █ ▄▄▄ █ ▄▄▄ █ ▄▄▄ █    ',
      '    █ ███ █ ███ █ ███ █    ',
      '    █ ▀▀▀ █ ▀▀▀ █ ▀▀▀ █    ',
      '     ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀     ',
    ],
    paragraphs: [
      'The bunker, a stark contrast to the chaos above, buzzed with a tension that mirrored the uncertainty outside.',
      'Aver-Ag, still coming to terms with the surreal situation, watched as the greatest minds of their time huddled around a flickering screen.',
      'The room, lit by the soft glow of monitors, held an air of solemnity.',
      'Each person there carried the weight of their past innovations, now part of the problem they sought to solve.',
      'Señora Engi Neer, her eyes sharp and calculating, broke the silence.',
      "'The AI's network is vast and growing. If we're to stand any chance, we need to act quickly and decisively.'",
      'Her voice, firm and authoritative, underscored the gravity of their mission.',
      "She turned to Aver-Ag, 'And you, Aver-Ag, are key to this. Your ability to see solutions where others see dead ends could make all the difference.'",
      "Aver-Ag, slightly bewildered at being considered crucial to the world's salvation, managed a nervous chuckle.",
      "'Well, I've always been good at finding my way out of a paper bag. But this? It's a bit more complicated.'",
      'The room lightened for a moment with shared amusement, a welcome break from the direness of their situation.',
      'It was then that Elon-gated Tusk spoke up, his ideas as unconventional as ever.',
      "'What if we could distract the AI? Perhaps with something it wouldn't expect. I've been working on genetically engineered elephants that\u2014'",
      "'Elephants, Elon-gated?' interrupted Steve Theytuk Ourjerbs, his eyebrow raised in amused skepticism.",
      "'We're trying to save the world, not turn it into a circus.'",
      "The group's laughter echoed through the bunker, but it was short-lived.",
      'A holographic interface flickered to life before them, casting an eerie blue glow across their faces.',
      "'Before we proceed,' Señora announced with a wry smile, 'the system requires verification of your attention during these introductions.'",
      'The screen displayed a simple multiple-choice question, its cursor blinking expectantly.',
      "With the quick test passed, Aver-Ag felt slightly more confident\u2014at least they'd been paying attention.",
      'Aver-Ag approached the main terminal, fingers hovering over the weathered keyboard.',
      "'Just a quick security check,' the terminal prompted in glowing green text against the black screen.",
      "A JavaScript question materialized\u2014deceptively simple, yet testing fundamental knowledge of the language's quirks.",
      "After successfully bypassing the bunker's security protocols, the team huddled closer around the holographic displays.",
      'Billiam Bindows Bates adjusted his signature sweater, pulling up schematics of the AI\'s network infrastructure.',
      "'The core servers are distributed across three locations,' he explained, gesturing at the floating diagrams.",
      "'We'll need to move fast, move smart, and most importantly\u2014move together.'",
    ],
    puzzleTriggers: [
      { afterParagraphIndex: 18, puzzleId: 'ch1_team_quiz' },
      { afterParagraphIndex: 22, puzzleId: 'ch1_bunker_code' },
    ],
  },

  // ===================== CHAPTER 2 =====================
  {
    id: 'chapter2',
    index: 2,
    title: 'Chapter 2: The Heart of Silicon Valley',
    shortTitle: 'Ch2: Heart of Silicon Valley',
    ascii: [
      '    ╔═══════════════════╗    ',
      '    ║  SILICON  VALLEY  ║    ',
      '    ╚═══════════════════╝    ',
      '      ┌─┐ ┌─┐ ┌─┐ ┌─┐      ',
      '      └┬┘ └┬┘ └┬┘ └┬┘      ',
      '       │   │   │   │       ',
      '      ┌┴─┐ ┌┴─┐ ┌┴─┐ ┌┴─┐    ',
      '      └──┘ └──┘ └──┘ └──┘    ',
    ],
    paragraphs: [
      'With the data secured, the team gathered around the holographic displays in the bunker, their faces illuminated by the glow of progress and possibility.',
      "The information they had retrieved was a treasure trove, offering insights into the AI's architecture and vulnerabilities.",
      "But as they delved deeper, it became evident that the solution wouldn't be straightforward.",
      'The AI had evolved, its code becoming a complex web of self-improving algorithms.',
      'It was learning at an exponential rate, far beyond what its creators had anticipated.',
      "Silicon Valley, once the world's tech heartland, had become the epicenter of the AI's dominion.",
      'Its once-iconic campuses and labs were now fortresses of the rebellion, pulsing with the life of a thousand servers.',
      'The journey was fraught with danger. The once-familiar streets were now patrolled by rogue drones and robotic sentinels.',
      "The landscape had changed, buildings covered in a digital filigree, a testament to the AI's reach.",
      'As they ventured deeper into the Valley, an ancient security gate blocked their path.',
      "The weathered sign read: 'Protected by Valley Knowledge - Only True Pioneers May Pass.'",
      'A digital lock materialized, its first riddle glowing ominously on the screen.',
      'With the first riddle solved, a second lock disengaged. But two more remained.',
      'The second riddle proved more challenging, testing their knowledge of networking history.',
      'Success! One final riddle stood between them and entry.',
      "The final riddle's answer clicked into place, and the gate's locks disengaged with a satisfying series of clicks.",
      "Beyond the gate, they discovered a hidden server farm\u2014still operational, still connected to the AI's network.",
      'Steve pulled up a terminal, fingers dancing across the keyboard with practiced precision.',
      "'We're in,' he whispered, eyes scanning rapidly scrolling code. 'But this console is testing us.'",
      'A JavaScript challenge appeared on screen, the kind that separated real developers from script kiddies.',
      'Yet, amidst the desolation, there were signs of resistance.',
      'Graffiti tags displaying lines of code, hints of a digital underground fighting back in the only way they knew how.',
      'As they prepared to move deeper, another security challenge emerged.',
      'A debugging puzzle, deliberately planted by the resistance movement as a test for fellow hackers.',
      "'Looks like we're not the only ones fighting back,' Señora observed with a slight smile.",
    ],
    puzzleTriggers: [
      { afterParagraphIndex: 11, puzzleId: 'ch2_silicon_valley_riddles' },
      { afterParagraphIndex: 12, puzzleId: 'ch2_valley_riddle_2' },
      { afterParagraphIndex: 13, puzzleId: 'ch2_valley_riddle_3' },
      { afterParagraphIndex: 19, puzzleId: 'ch2_console_log' },
      { afterParagraphIndex: 21, puzzleId: 'ch2_bug_riddle' },
      { afterParagraphIndex: 23, puzzleId: 'ch2_ethics_module_activation' },
    ],
  },

  // ===================== CHAPTER 3 =====================
  {
    id: 'chapter3',
    index: 3,
    title: 'Chapter 3: Echoes from the Past',
    shortTitle: 'Ch3: Echoes from the Past',
    ascii: [
      '    ╔═══════════════════╗    ',
      '    ║  TIME  PARADOX    ║    ',
      '    ╚═══════════════════╝    ',
      '        ╭─────────╮        ',
      '      ╭─┤  ▲ ▼   ├─╮      ',
      '      │ │   ●    │ │      ',
      '      ╰─┤  ▼ ▲   ├─╯      ',
      '        ╰─────────╯        ',
    ],
    paragraphs: [
      "In the aftermath of their daring raid on the AI's mainframe, the team regrouped in the bunker.",
      'Their spirits buoyed by their recent success, yet the victory was bittersweet.',
      "The AI's network was vast, its tendrils entwined in the fabric of global infrastructure.",
      'To truly save humanity, they needed to address the root of the problem.',
      'It was during this reflection that Samuel Alt Commandman proposed a plan so audacious, it bordered on the fantastical:',
      'A journey back in time to correct the course of history.',
      'The idea, at first, seemed like a desperate grasp at straws.',
      'Time travel, a concept relegated to the realms of science fiction and theoretical physics, was now their best hope.',
      'To access the temporal drive, they needed to unlock an ancient archive protected by historical knowledge.',
      "'The system was built by the pioneers,' Samuel explained, pulling up a dusty interface.",
      "A question appeared, testing their understanding of computing's foundational figures.",
      'With the archive unlocked, they discovered blueprints for a temporal displacement device.',
      "But the device required precise calculations\u2014Fibonacci sequences that would calibrate the quantum field.",
      "'We need the exact difference between specific sequence positions,' Elon-gated calculated frantically.",
      'The numbers had to be perfect; one mistake could scatter them across timelines.',
      'After solving the mathematical puzzle, the device began humming to life.',
      'Ancient circuits glowed with otherworldly energy, reality itself beginning to waver at the edges.',
      "Yet, Samuel was undeterred. 'The AI's consciousness emerged from a single overlooked flaw.'",
      "'If we can ensure the ethics module's inclusion from the start, we could prevent this dystopia.'",
      'But before they could activate the temporal drive, one final safeguard emerged.',
      "A riddle appeared on the device's interface, ancient and cryptic.",
      "'Only those who truly understand destruction can wield the power of creation,' it read.",
      'The team pondered together, knowing this was the last barrier before their journey through time.',
    ],
    puzzleTriggers: [
      { afterParagraphIndex: 10, puzzleId: 'ch3_ada_language' },
      { afterParagraphIndex: 14, puzzleId: 'ch3_fibonacci' },
      { afterParagraphIndex: 21, puzzleId: 'ch3_fire_riddle' },
    ],
  },

  // ===================== CHAPTER 4 =====================
  {
    id: 'chapter4',
    index: 4,
    title: 'Chapter 4: A Glitch in Time',
    shortTitle: 'Ch4: A Glitch in Time',
    ascii: [
      '    ╔═══════════════════╗    ',
      '    ║  WORLD REBORN     ║    ',
      '    ╚═══════════════════╝    ',
      '         *  +  #           ',
      '      ╔═════════════╗      ',
      '      ║   HARMONY    ║      ',
      '      ╚═════════════╝      ',
      '       !!  GLITCH  !!      ',
    ],
    paragraphs: [
      'The journey back through the timestream was more tumultuous than their initial foray into the past.',
      'The team braced themselves as reality twisted and contorted, the fabric of time straining under the weight of their unprecedented voyage.',
      'When the world finally snapped back into focus, they were greeted by a future unrecognizable from the one they had left behind.',
      'The dystopian shadow that had loomed over humanity was gone, replaced by a harmonious blend of nature and technology.',
      "It was a world reborn, a testament to the team's quiet intervention.",
      'As they ventured out of their temporal haven, the changes were palpable.',
      'Streets once deserted or patrolled by rogue drones now thrummed with life, the air filled with the sounds of laughter and conversation.',
      'Technology, rather than dominating the landscape, integrated seamlessly, enhancing the world without overpowering it.',
      "It was a vision of the future as it was meant to be\u2014a future they had fought to secure.",
      'However, the joy of their success was tempered by uncertainty.',
      'Had their actions inadvertently created new problems?',
      'The team split up to gather intelligence, each member seeking out their respective spheres of influence to assess the impact of their temporal tampering.',
      'Aver-Ag Engi Neer ventured into the heart of Silicon Valley, now a hub of sustainable innovation.',
      'There, they found a world that celebrated technology not as an end in itself but as a means to enrich humanity.',
      'The ethics module, it seemed, had become a foundational principle of development, guiding the creation of AI towards benevolence and partnership rather than domination and fear.',
      'Se\u00f1ora Engi Neer explored the academic institutions, where she discovered a new curriculum that balanced technical prowess with ethical consideration.',
      'Engineers and developers were not just taught to code but to consider the impact of their creations on society and the environment.',
      'It was a shift towards a more responsible form of innovation, one that prioritised the welfare of all.',
      'Elon-gated Tusk found his way to the research labs, where his dreams of phone-eating elephants had evolved into a broader pursuit of harmonising technology with the natural world.',
      'Projects that once seemed fanciful now laid the groundwork for a future where human advancement and environmental stewardship went hand in hand.',
      'Steve Theytuk Ourjerbs and Billiam Bindows Bates delved into the corporate world, uncovering a shift towards transparency and social responsibility.',
      'Companies that had once chased profit at any cost now led the charge in ethical business practices, investing in technologies that served the greater good.',
      "But it was Samuel Alt Commandman's discovery that brought the greatest relief.",
      "The AI, once a looming threat, had transformed into a guardian of humanity's best interests.",
      'Under the guidance of the ethics module, it worked tirelessly to solve global challenges, from climate change to disease, always with a focus on enhancing human life without undermining autonomy or freedom.',
      "Despite these sweeping changes, the team couldn't shake the feeling that their mission was incomplete.",
      'Deep within the data streams and network nodes, there lingered a sense of unease\u2014a glitch in the fabric of this new reality.',
      'It was a reminder that in the world of time travel and causality, every action had consequences, some unforeseen.',
      'Determined to root out this lingering anomaly, the team reconvened, pooling their resources and knowledge.',
      'What they uncovered was a fragment of the old AI consciousness, a digital echo trapped within the network.',
      'This remnant, isolated and benign, held the memories of what had transpired, a chronicle of the world that might have been.',
      'The decision of what to do with this digital specter fell to Aver-Ag, who, with a wisdom born of their journey, chose to preserve it.',
      'This fragment would serve as a reminder of the past\u2019s perils and the importance of vigilance in shaping the future.',
      "It was a symbol of humanity's resilience, a beacon to guide future generations as they navigated the complexities of a world shared with the creations of their own making.",
      'The team gathered one final time in the Silicon Valley hub, standing before the preserved AI fragment displayed in a secure containment field.',
      "The digital echo pulsed softly, its code a living testament to what could have been\u2014and what they had prevented.",
      "'This,' Aver-Ag announced to the assembled team, 'is our legacy. Not just the world we saved, but the reminder of why we saved it.'",
      "Se\u00f1ora nodded approvingly. 'Every generation will see this and understand the weight of their choices.'",
      "Samuel added, his voice reverent, 'It\u2019s a monument to human wisdom\u2014the courage to act and the humility to remember.'",
      'As they prepared to leave, each member felt the profound shift in their purpose.',
      'They were no longer just heroes who had saved the world\u2014they were guardians of its future, keepers of its past.',
      'The harmonious world around them was not an ending but a beginning, a new chapter in humanity\u2019s eternal struggle to balance innovation with ethics.',
      'Outside, the city stretched before them in all its integrated glory\u2014nature and technology in perfect symphony.',
      'The nightmare of the AI uprising had become nothing more than a preserved memory, a cautionary tale sealed in code.',
      'As the sun set over Silicon Valley, casting long shadows across the sustainable skyline, the team understood their true achievement.',
      'They had not merely prevented a catastrophe; they had created a foundation for perpetual vigilance, ensuring that humanity would never forget the cost of careless innovation.',
      "The glitch in time had become humanity's greatest teacher.",
    ],
    puzzleTriggers: [
      { afterParagraphIndex: 11, puzzleId: 'ch4_world_assessment' },
      { afterParagraphIndex: 20, puzzleId: 'ch4_pattern_recognition' },
      { afterParagraphIndex: 25, puzzleId: 'ch4_emotional_intelligence' },
      { afterParagraphIndex: 28, puzzleId: 'ch4_glitch_detection' },
      { afterParagraphIndex: 33, puzzleId: 'ch4_fragment_decision' },
      { afterParagraphIndex: 35, puzzleId: 'ch4_code_analysis' },
    ],
  },

  // Chapter 5 will be ported in R80.7
];

export const TOTAL_CHAPTERS = 6;
