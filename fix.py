#!/usr/bin/env python3
import sys

REPO = "Hazyshades/Sendly-Test-Repo"

def main():
    if len(sys.argv) != 2:
        print("Usage: python fix.py <issue-number>", file=sys.stderr)
        sys.exit(1)
    
    issue_arg = sys.argv[1].strip().lstrip("#")
    if not issue_arg.isdigit() or int(issue_arg) <= 0:
        print(f"Error: Invalid issue number '{sys.argv[1]}'. Must be numeric.", file=sys.stderr)
        sys.exit(1)
        
    issue_num = int(issue_arg)
    print(f"fix {REPO}#{issue_num}")
    sys.exit(0)

if __name__ == "__main__":
    main()
