#!/usr/bin/env python3
"""Print the repository and issue number formatted for the fix CLI."""

import sys

REPO = "Hazyshades/Sendly-Test-Repo"
USAGE = "Usage: python fix.py <issue-number>"

def main():
    if len(sys.argv) != 2:
        print(USAGE, file=sys.stderr)
        return 1
    
    issue_arg = sys.argv[1].strip().lstrip("#")
    if not issue_arg.isdigit() or int(issue_arg) <= 0:
        print(f"Error: Invalid issue number '{sys.argv[1]}'. Must be numeric.", file=sys.stderr)
        return 1
        
    issue_num = int(issue_arg)
    print(f"fix {REPO}#{issue_num}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
