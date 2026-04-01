PLEASE SEE MY BASIC NOTES, AND ADD THESE INSIGHTS INTO THE REBUILD PLANS. (or simply bug fixes if they are already build with Phaser)


In this case, we may as well rebuild the code with phaser only components, so its more streamlined and future proof. No dual code and old dependencies. We are moving one way. forward
----

General UX/UI, good, however can be improved. We can increase the size of the game boxes in cliking right or left mode (after the arcade dashboard)

HAVE ASCII ART FOR ALL GAME NAMES!!! THIS WILL LOOK EPIC.

See gamecardlayout.png (rebuildingoldgames/inspirationimages/gamecardlayout.png) we can increase the width adn height of the game box. Add two buttosn, instructions, adn high scroes, removing the basic instructions into the modal which pops up wehn click instructions button.

This will be the same design for all games wehn go left or right.

Please sort out the high scores area, its broken.

Please amend the achievements area (once we have redesigned everything to phaser, this will be easier as all games have the same build foundation, rahter than mix and match)

----


-----
ctrl-s the world 

see rebuildingoldgames/inspirationimagesandsprites/ctrlscitizensleeperimageinspiration for design inspiration

cant save = can't access property "gamesPlayed", gameData.stats is undefined

ascii image needs to be bigger
story screen needs better building, UX, and design. It's too glitchy and custom. 

Check 'Citizen Sleeper' UI screenshots in the folder, this is what I am setting out to achieve. The text based stuff and UX any way. 

User needs to be in conrol, not the game, its all a bit rushed in this current iteration and hard to g  et into a flow state or deep interest. It needs more soul and care to make this a great game. 

It's probably about 70% there before the rebuild, but we can make it better, and the interactivity we have already added will be better for users as they are mentally invested. 

----

snake classic 

too basic, we alrady have plans to improve this game, so we can improve and rebuild with phaser

see rebuildingoldgames/inspirationimagesandsprites/snake

Transform Snake Classic into a flagship game with 3 modes:

- **Classic Mode** - existing gameplay with visual enhancements
- **Matrix Mode** - firewall obstacles, Agent Smith enemies, bullet time power-up
- **Hacker Mode** - sequence collection (collect 1-0-1-0 in order), decryption puzzles

Visual enhancements (all modes):
- Matrix rain background, particle trails, death animation
- Food spawn animation, screen shake, combo counter
- Level system with progressive difficulty
- Boss encounters every 5 levels
- Mini-map for larger grids (levels 6+)

Achievements expanded from 7 to 16+.
------

vortex pong

perfect, keep it how it is, just rebuild

see this folder for design ideas
rebuildingoldgames/inspirationimagesandsprites/vortexpong 
-----

Matrix cloud - needs a full redesign

the game works, but sprite is not very good, there is a bug wehere you simply dont have to do anything and you gain combo for hitting the pillars across the floor (or in gernal). Should only get combos when pass throught eh gap in then pillar. Lose a life if hit or touch it. Proper flappy bird style. 

This needs a complete rebuild with phaser.

see /Users/tombutler/Repos/TheMatrixArcade-/rebuildingoldgames/inspirationimagesandsprites/matrixcloud

------

matrix invaders

good, nothing wrong, would benefit from a phaser upgrade for visuals and UX/UI

see 
rebuildingoldgames/inspirationimagesandsprites/matrixinvaders
------

metris


BULLET TIME (B) does not work



good, not much wrong, would seriously benefit from a phaser upgrade for visuals and UX/UI as the current state is very dated

------

matrix frogger (phaser)

bug fixes

need a start line (so user can spawn safely after crossing the road) - often get back to the beginning just to be hit by something. Needs to be a line and a safe starting space

Needs 5 seconds timer before start

add more user power ups

NEO mode power up, where you are invinsible (like mario invincibility multicolour)

needs a finishing line, or pavement (currently user just goes to the top and it takes you to the bottom)

needs more interactivity with scores

needs to have kung fu, where if user cannot manouvre, they can use kung fu to defeat some of the agents and sentinels to break free. Max 3 per gameplay.

add road markings, and more agents and sentinels, random speeds, ones that chase you up adn down the lanes


see rebuildingoldgames/inspirationimagesandsprites/matrixfrogger

-----

Neo jump (already phaser)

fully UX redesign needed

remove the sprites and create our own

jetpack deosnt work

endless falling, should be instant death when you fall (you fall past your total score, and stats)

better enemies

more like doodle jump

see rebuildingoldgames/inspirationimagesandsprites/doodlejump

-----

agent chase (already phaser)

good, needs work though on funcationality,
agent smiths are stuck in the middle box, only one actually starts chasing you

secondly, if hit a wall, the pacman will just glitch, it won't automatically turn the right way and continue moving. This is the worst thing for UX and looks really glitchy.

thirdly, the map needs to be more open and more paths to the opposite side to appear out of. 

square map, circle map, and a diamond map are needed. (easy, medium, hard mode)

see rebuildingoldgames/inspirationimagesandsprites/pacman

----

rythm hacker, (phaser) this is great and really fun

make the game sync to the backing music track so user can play to this 

We will use the keys QW OP instead of DF JK (better hand positioning)

timer 5 seconds, not 10

make UX/UI better and improve visuals and animations

please see rebuildingoldgames/inspirationimagesandsprites/guitarhero
-------

cloud jump (phaser)

nice design, just cannot jump at all lol

needs serious work, as I am unable to play this at all until I can jump across clouds!

This is an original game, and I cannot find images or sprites anywhere. I found inspiration though, you can see this inside the rebuildingoldgames/inspirationimagesandsprites/cloudjumper folder. 
-------

FOR THE NEW GAME - Code Breaker - New Flagship Game (PLANNED) into v2.5


Brick breaker/Block Breaker meets Matrix. Break through a wall of code to escape. React Canvas, 800x600.

- Code bricks (1HP green, 2HP yellow, 3HP red) arranged as code patterns
- Agent Smiths spawn from broken bricks, move downward - dodge or shoot
- 6 power-ups: Multi-ball, Wide Paddle, Laser, Bullet Time, Firewall, EMP
- Level progression: simple rows -> code patterns -> boss bricks
- Win: break through to the portal behind the wall
- 10 achievements


Please see rebuildingoldgames/inspirationimagesandsprites/blockbreakerbrickbreaker 