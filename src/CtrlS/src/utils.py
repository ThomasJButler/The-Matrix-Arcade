"""
Utility functions for the CtrlS text adventure game.
Contains shared functions used across all chapters.
"""

import time
import random
import os


def clear_screen():
    """Clears the console screen."""
    # for Windows
    if os.name == 'nt':
        _ = os.system('cls')
    # for macOS and Linux (here, os.name is 'posix')
    else:
        _ = os.system('clear')


def slow_type(text, speed=0.05):
    """A function to print text with a delay between each character for dramatic effect."""
    for char in text:
        print(char, end='', flush=True)
        time.sleep(speed)
    print("\n")  # Ensures each statement is on its own line for readability


def press_enter_to_continue():
    """Encouragement to move the story along"""
    input("\n(Your journey pauses but briefly. Press Enter to delve deeper into the odyssey.)\n")
    clear_screen()


def dramatic_pause():
    """Because every good story needs its dramatic pauses."""
    time.sleep(random.uniform(1, 3))  # Let the anticipation build


def end_game():
    """Function to gracefully exit the game"""
    print("\nYour journey ends here, but the adventure continues in your heart.")
    print("And also in any sequels we may develop.")
    input("\nPress Enter to bid farewell to this digital odyssey.")


def welcome_message():
    """Function to display welcome messages with a sprinkle of humor"""
    print("\nWelcome to 'Ctrl+S - The World Edition!' - By Thomas J Butler")
    print("The indie game where keyboards are mightier than swords.")
    print("Please check out my GitHub and LinkedIn profiles for more projects and to connect with me.")
    print("-"*60)
    print("Remember, in this world, your wit is your greatest weapon.")
    print("-"*60)
    time.sleep(2)  # Dramatic pause for effect