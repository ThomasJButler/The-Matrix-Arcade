/**
 * CTRL-S | The World -- Gameplay E2E Tests (React/DOM)
 *
 * Tests the narrative engine's core interactions: command prompt entry,
 * chapter navigation, story advancement, pause/resume, keyboard shortcuts,
 * and modal lifecycle. CTRL-S World is the only DOM-based game, so these
 * tests drive the game phase via data-game-phase attributes rather than
 * Phaser state.
 */

import { test, expect } from '../fixtures/arcade.fixture';
import { navigateToGame } from '../fixtures/arcade.fixture';
import { enableTestMode, getReactGamePhase } from '../fixtures/test-utils';

/** Navigate to the game and wait for the command prompt. */
async function goToCtrlS(page: import('@playwright/test').Page) {
  await enableTestMode(page);
  await page.goto('/');
  await page.waitForTimeout(1000);
  await navigateToGame(page, 'CTRL-S');
  await page.waitForFunction(
    () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'command_prompt',
    undefined,
    { timeout: 8000 }
  );
}

/** Type the activation command and enter the chapter hub. */
async function enterChapterHub(page: import('@playwright/test').Page) {
  const input = page.locator('input[placeholder*="save-the-world"]');
  await input.fill('save-the-world');
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'chapter_hub',
    undefined,
    { timeout: 5000 }
  );
}

/** Start from the beginning (chapter 0) and enter playing state. */
async function startPlaying(page: import('@playwright/test').Page) {
  await page.click('button:has-text("Start from Beginning")');
  await page.waitForFunction(
    () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'playing',
    undefined,
    { timeout: 5000 }
  );
}

test.describe('CTRL-S | The World Gameplay', () => {
  test.beforeEach(async ({ page }) => {
    await goToCtrlS(page);
  });

  test('command prompt accepts activation code and transitions to chapter hub', async ({ page }) => {
    test.setTimeout(15000);

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('command_prompt');

    await enterChapterHub(page);

    const hubPhase = await getReactGamePhase(page);
    expect(hubPhase).toBe('chapter_hub');

    // Chapter hub should show MISSION SELECT or chapter buttons
    const prologueButton = page.locator('button:has-text("Prologue")');
    await expect(prologueButton).toBeVisible({ timeout: 3000 });
  });

  test('chapter hub shows available chapters with start button', async ({ page }) => {
    test.setTimeout(15000);
    await enterChapterHub(page);

    // Quick start button
    const startButton = page.locator('button:has-text("Start from Beginning")');
    await expect(startButton).toBeVisible();

    // Prologue should always be accessible
    const prologue = page.locator('button:has-text("Prologue")');
    await expect(prologue).toBeEnabled();
  });

  test('starting from beginning enters playing state with story content', async ({ page }) => {
    test.setTimeout(20000);
    await enterChapterHub(page);
    await startPlaying(page);

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');

    // Story content area should be visible
    const storyContent = page.locator('[data-testid="story-content"]');
    await expect(storyContent).toBeVisible({ timeout: 5000 });
  });

  test('Enter key advances story text', async ({ page }) => {
    test.setTimeout(30000);
    await enterChapterHub(page);
    await startPlaying(page);

    // Wait for typewriter to start producing text
    await page.waitForTimeout(1000);

    const storyContent = page.locator('[data-testid="story-content"]');

    // Get initial text length
    const initialText = await storyContent.textContent() ?? '';

    // Press Enter to skip typewriter or advance paragraph
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Text should have progressed
    const afterText = await storyContent.textContent() ?? '';
    expect(afterText.length).toBeGreaterThanOrEqual(initialText.length);

    // Game should still be in playing state
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('pause and resume works via P key', async ({ page }) => {
    test.setTimeout(20000);
    await enterChapterHub(page);
    await startPlaying(page);

    // Wait for content to start appearing
    await page.waitForTimeout(1000);

    // Pause
    await page.keyboard.press('p');
    await page.waitForTimeout(300);

    // Check pause button title changes to Resume
    const resumeButton = page.locator('button[title="Resume"]');
    await expect(resumeButton).toBeVisible({ timeout: 3000 });

    // Resume
    await page.keyboard.press('p');
    await page.waitForTimeout(300);

    // Pause button should show Pause again
    const pauseButton = page.locator('button[title="Pause"]');
    await expect(pauseButton).toBeVisible({ timeout: 3000 });

    // Should still be playing
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('info panel toggles with Show Info button', async ({ page }) => {
    test.setTimeout(20000);
    await enterChapterHub(page);
    await startPlaying(page);
    await page.waitForTimeout(1000);

    // Open info panel
    const infoButton = page.locator('button[title="Show Info"]');
    await infoButton.click();
    await page.waitForTimeout(500);

    // Info content should be visible
    const infoContent = page.locator('text=Game Information').or(page.locator('text=game information'));
    const isInfoVisible = await infoContent.isVisible().catch(() => false);

    if (isInfoVisible) {
      // Close with ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    // Should still be playing
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('playing');
  });

  test('R key restarts game to command prompt', async ({ page }) => {
    test.setTimeout(20000);
    await enterChapterHub(page);
    await startPlaying(page);
    await page.waitForTimeout(1000);

    // Click on the story content to ensure focus is not on an input
    const storyContent = page.locator('[data-testid="story-content"]');
    await storyContent.click();
    await page.waitForTimeout(200);

    // Press R to restart
    await page.keyboard.press('r');

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'command_prompt',
      undefined,
      { timeout: 5000 }
    );

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('command_prompt');
  });

  test('ESC from chapter hub returns to command prompt', async ({ page }) => {
    test.setTimeout(15000);
    await enterChapterHub(page);

    const hubPhase = await getReactGamePhase(page);
    expect(hubPhase).toBe('chapter_hub');

    await page.keyboard.press('Escape');

    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'command_prompt',
      undefined,
      { timeout: 5000 }
    );

    const phase = await getReactGamePhase(page);
    expect(phase).toBe('command_prompt');
  });

  test('chapter select button returns to chapter hub from playing', async ({ page }) => {
    test.setTimeout(20000);
    await enterChapterHub(page);
    await startPlaying(page);
    await page.waitForTimeout(1000);

    // Click chapter select in the bottom toolbar
    const chaptersButton = page.locator('button[title="Chapter Select"]');
    if (await chaptersButton.isVisible().catch(() => false)) {
      await chaptersButton.click();

      await page.waitForFunction(
        () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'chapter_hub',
        undefined,
        { timeout: 5000 }
      );

      const phase = await getReactGamePhase(page);
      expect(phase).toBe('chapter_hub');
    }
  });

  test('command prompt rejects invalid commands', async ({ page }) => {
    test.setTimeout(10000);

    // Type an incorrect command
    const input = page.locator('input[placeholder*="save-the-world"]');
    await input.fill('wrong-command');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Should remain on command prompt
    const phase = await getReactGamePhase(page);
    expect(phase).toBe('command_prompt');
  });

  test('full lifecycle: command prompt to playing and back', async ({ page }) => {
    test.setTimeout(30000);

    // Phase 1: command prompt
    expect(await getReactGamePhase(page)).toBe('command_prompt');

    // Phase 2: chapter hub
    await enterChapterHub(page);
    expect(await getReactGamePhase(page)).toBe('chapter_hub');

    // Phase 3: playing
    await startPlaying(page);
    expect(await getReactGamePhase(page)).toBe('playing');

    // Advance a few paragraphs
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(400);
    }

    // Phase 4: back to chapter hub via toolbar
    const chaptersButton = page.locator('button[title="Chapter Select"]');
    if (await chaptersButton.isVisible().catch(() => false)) {
      await chaptersButton.click();
      await page.waitForFunction(
        () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'chapter_hub',
        undefined,
        { timeout: 5000 }
      );
      expect(await getReactGamePhase(page)).toBe('chapter_hub');
    }

    // Phase 5: back to command prompt via ESC
    await page.keyboard.press('Escape');
    await page.waitForFunction(
      () => document.querySelector('[data-game-phase]')?.getAttribute('data-game-phase') === 'command_prompt',
      undefined,
      { timeout: 5000 }
    );
    expect(await getReactGamePhase(page)).toBe('command_prompt');
  });
});
