import os
import sys

def setup_env():
    print("Setting up environment...")
    os.makedirs("logs", exist_ok=True)
    os.makedirs("tmp", exist_ok=True)
    print("Environment setup complete")

if __name__ == "__main__":
    setup_env()
