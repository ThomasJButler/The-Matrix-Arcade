import Phaser from 'phaser';
import { BaseScene } from '../../../../../lib/phaser/scenes/BaseScene';
import { MATRIX_COLORS, MATRIX_FONTS } from '../../../../../lib/phaser/types';
import { CTRLS_SCENE_KEYS, CTRLS_REGISTRY_KEYS } from '../config';
import type { CtrlSGameItem } from '../types';

const PANEL_WIDTH = 560;
const PANEL_HEIGHT = 440;
const ROW_HEIGHT = 34;
const MAX_VISIBLE = 8;
// R83.CTRLS.14 — crisp text resolution. See NarrativeScene for full rationale.
const TEXT_RESOLUTION = 2;

const TYPE_COLOURS: Record<CtrlSGameItem['type'], string> = {
  quest: MATRIX_COLORS.YELLOW_HEX,
  consumable: MATRIX_COLORS.PRIMARY_HEX,
  collectible: MATRIX_COLORS.CYAN_HEX,
  special: MATRIX_COLORS.MAGENTA_HEX,
};

const TYPE_GLYPH: Record<CtrlSGameItem['type'], string> = {
  quest: '◆',
  consumable: '●',
  collectible: '★',
  special: '✦',
};

/**
 * Phaser-native inventory panel. Launched in parallel on top of NarrativeScene.
 * Reads `inventory` from the Phaser registry — React side writes session state
 * in on every update (see CtrlSWorld/index.tsx).
 */
export class CtrlSInventoryScene extends BaseScene {
  private selectedIndex = 0;
  private scrollOffset = 0;
  private items: CtrlSGameItem[] = [];
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private detailName?: Phaser.GameObjects.Text;
  private detailDescription?: Phaser.GameObjects.Text;
  private detailMeta?: Phaser.GameObjects.Text;
  private emptyText?: Phaser.GameObjects.Text;
  private keyHandler?: (event: KeyboardEvent) => void;
  private panelX = 0;
  private panelY = 0;

  constructor() {
    super(CTRLS_SCENE_KEYS.INVENTORY);
  }

  init(): void {
    const stored = this.registry.get(CTRLS_REGISTRY_KEYS.INVENTORY);
    this.items = Array.isArray(stored) ? (stored as CtrlSGameItem[]) : [];
    this.selectedIndex = 0;
    this.scrollOffset = 0;
  }

  create(): void {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    this.panelX = (width - PANEL_WIDTH) / 2;
    this.panelY = (height - PANEL_HEIGHT) / 2;

    const backdrop = this.add.graphics();
    backdrop.fillStyle(MATRIX_COLORS.BACKGROUND, 0.85);
    backdrop.fillRect(0, 0, width, height);

    const panel = this.add.graphics();
    panel.lineStyle(2, MATRIX_COLORS.PRIMARY, 1);
    panel.fillStyle(MATRIX_COLORS.BACKGROUND, 0.95);
    panel.fillRoundedRect(this.panelX, this.panelY, PANEL_WIDTH, PANEL_HEIGHT, 8);
    panel.strokeRoundedRect(this.panelX, this.panelY, PANEL_WIDTH, PANEL_HEIGHT, 8);

    this.add
      .text(this.panelX + 24, this.panelY + 18, 'INVENTORY', {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '12px',
        color: MATRIX_COLORS.PRIMARY_HEX,
      })
      .setResolution(TEXT_RESOLUTION);

    this.add
      .text(
        this.panelX + PANEL_WIDTH - 24,
        this.panelY + 18,
        `${this.items.length} items`,
        {
          fontFamily: MATRIX_FONTS.PRIMARY,
          fontSize: '10px',
          color: MATRIX_COLORS.DIM_GREEN_HEX,
        },
      )
      .setOrigin(1, 0)
      .setResolution(TEXT_RESOLUTION);

    if (this.items.length === 0) {
      this.renderEmptyState();
    } else {
      this.renderRows();
      this.renderDetail();
    }

    this.add
      .text(
        this.panelX + PANEL_WIDTH / 2,
        this.panelY + PANEL_HEIGHT - 22,
        '↑↓ browse   ESC / I close',
        {
          fontFamily: MATRIX_FONTS.PRIMARY,
          fontSize: '8px',
          color: MATRIX_COLORS.DIM_GREEN_HEX,
        },
      )
      .setOrigin(0.5, 0.5)
      .setResolution(TEXT_RESOLUTION);

    this.bindKeyboard();
  }

  private renderEmptyState(): void {
    this.emptyText = this.add.text(
      this.panelX + PANEL_WIDTH / 2,
      this.panelY + PANEL_HEIGHT / 2,
      'Inventory is empty.\nSolve puzzles to earn items.',
      {
        fontFamily: MATRIX_FONTS.MONO,
        fontSize: '12px',
        color: MATRIX_COLORS.DIM_GREEN_HEX,
        align: 'center',
        lineSpacing: 6,
      },
    );
    this.emptyText.setOrigin(0.5, 0.5);
    this.emptyText.setResolution(TEXT_RESOLUTION);
  }

  private renderRows(): void {
    const startX = this.panelX + 24;
    const startY = this.panelY + 52;
    const visible = this.items.slice(this.scrollOffset, this.scrollOffset + MAX_VISIBLE);

    this.rowTexts.forEach((t) => t.destroy());
    this.rowTexts = [];

    visible.forEach((item, i) => {
      const absoluteIndex = i + this.scrollOffset;
      const selected = absoluteIndex === this.selectedIndex;
      const glyph = TYPE_GLYPH[item.type];
      const qty = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : '';
      const label = `${selected ? '▶' : ' '} ${glyph} ${item.name}${qty}`;

      const row = this.add.text(startX, startY + i * ROW_HEIGHT, label, {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '11px',
        color: selected ? MATRIX_COLORS.PRIMARY_HEX : TYPE_COLOURS[item.type],
      });
      row.setResolution(TEXT_RESOLUTION);
      this.rowTexts.push(row);
    });
  }

  private renderDetail(): void {
    const current = this.items[this.selectedIndex];
    if (!current) return;

    const detailX = this.panelX + 24;
    const detailY = this.panelY + PANEL_HEIGHT - 130;
    const detailWidth = PANEL_WIDTH - 48;

    this.detailName?.destroy();
    this.detailDescription?.destroy();
    this.detailMeta?.destroy();

    this.detailName = this.add.text(detailX, detailY, current.name, {
      fontFamily: MATRIX_FONTS.PRIMARY,
      fontSize: '12px',
      color: TYPE_COLOURS[current.type],
    });
    this.detailName.setResolution(TEXT_RESOLUTION);

    this.detailMeta = this.add.text(
      detailX,
      detailY + 18,
      `${current.type.toUpperCase()}${current.usable ? ' · USABLE' : ''}`,
      {
        fontFamily: MATRIX_FONTS.PRIMARY,
        fontSize: '9px',
        color: MATRIX_COLORS.DIM_GREEN_HEX,
      },
    );
    this.detailMeta.setResolution(TEXT_RESOLUTION);

    this.detailDescription = this.add.text(detailX, detailY + 34, current.description, {
      fontFamily: MATRIX_FONTS.MONO,
      fontSize: '11px',
      color: MATRIX_COLORS.MEDIUM_GREEN_HEX,
      wordWrap: { width: detailWidth },
      lineSpacing: 2,
    });
    this.detailDescription.setResolution(TEXT_RESOLUTION);
  }

  private bindKeyboard(): void {
    this.keyHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key;

      if (key === 'Escape' || key === 'i' || key === 'I') {
        event.preventDefault();
        this.closeAndResume();
        return;
      }

      if (this.items.length === 0) return;

      if (key === 'ArrowUp') {
        event.preventDefault();
        this.navigate(-1);
        return;
      }
      if (key === 'ArrowDown') {
        event.preventDefault();
        this.navigate(1);
      }
    };

    window.addEventListener('keydown', this.keyHandler);
  }

  private navigate(direction: number): void {
    const next = Phaser.Math.Clamp(
      this.selectedIndex + direction,
      0,
      this.items.length - 1,
    );
    if (next === this.selectedIndex) return;
    this.selectedIndex = next;

    if (next < this.scrollOffset) {
      this.scrollOffset = next;
    } else if (next >= this.scrollOffset + MAX_VISIBLE) {
      this.scrollOffset = next - MAX_VISIBLE + 1;
    }

    this.playSound('menu');
    this.renderRows();
    this.renderDetail();
  }

  private closeAndResume(): void {
    this.emitGameEvent({
      type: 'pause',
      data: { action: 'inventoryClosed' },
    });
    this.scene.stop();
    this.scene.resume(CTRLS_SCENE_KEYS.NARRATIVE);
  }

  protected handleExit(): void {
    this.closeAndResume();
  }

  shutdown(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = undefined;
    }
    this.rowTexts = [];
    super.shutdown();
  }
}
