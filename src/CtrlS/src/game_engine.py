"""
CtrlS Game Engine
Main controller for the text-based adventure game.
Loads and executes chapters sequentially.
"""

import importlib
import sys
import os
from pathlib import Path

# Add the src directory to the path so we can import utils
sys.path.append(str(Path(__file__).parent))

from utils import welcome_message, end_game, clear_screen, press_enter_to_continue


class GameEngine:
    """Main game controller that manages the adventure."""

    def __init__(self):
        self.current_chapter = 1
        self.max_chapters = 5  # Based on ch1.py through ch5.py
        self.game_state = {
            'player_name': '',
            'inventory': [],
            'progress': {}
        }

    def load_chapter(self, chapter_num):
        """Dynamically load a chapter module."""
        try:
            module_name = f"chapters.ch{chapter_num}"
            chapter_module = importlib.import_module(module_name)
            return chapter_module
        except ImportError as e:
            print(f"Error loading chapter {chapter_num}: {e}")
            return None

    def run_chapter(self, chapter_num):
        """Execute a specific chapter."""
        print(f"\n{'='*60}")
        print(f"LOADING CHAPTER {chapter_num}")
        print(f"{'='*60}")

        chapter_module = self.load_chapter(chapter_num)
        if not chapter_module:
            print(f"Chapter {chapter_num} could not be loaded. Skipping...")
            return False

        # Look for a main function in the chapter
        if hasattr(chapter_module, 'main'):
            chapter_module.main()
        # Fallback to common function names
        elif hasattr(chapter_module, f'chapter_{chapter_num}'):
            getattr(chapter_module, f'chapter_{chapter_num}')()
        elif hasattr(chapter_module, f'ch{chapter_num}_main'):
            getattr(chapter_module, f'ch{chapter_num}_main')()
        else:
            print(f"No main function found in chapter {chapter_num}")
            return False

        return True

    def save_progress(self):
        """Save current game state (placeholder for future implementation)."""
        # This could save to a file in the future
        pass

    def load_progress(self):
        """Load saved game state (placeholder for future implementation)."""
        # This could load from a file in the future
        pass

    def start_game(self):
        """Main game loop."""
        clear_screen()
        welcome_message()
        press_enter_to_continue()

        # Main game loop
        for chapter in range(1, self.max_chapters + 1):
            print(f"\n--- Beginning Chapter {chapter} ---")

            success = self.run_chapter(chapter)
            if not success:
                print("Game encountered an error. Ending...")
                break

            # Save progress after each chapter
            self.current_chapter = chapter + 1
            self.save_progress()

            # Give player a moment between chapters
            if chapter < self.max_chapters:
                press_enter_to_continue()

        # Game completed
        print("\n" + "="*60)
        print("ADVENTURE COMPLETED!")
        print("="*60)
        end_game()


def main():
    """Entry point for the game."""
    game = GameEngine()
    game.start_game()


if __name__ == "__main__":
    main()