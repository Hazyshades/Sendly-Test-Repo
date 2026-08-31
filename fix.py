#!/usr/bin/env python3
import sys

REPO = "Hazyshades/Sendly-Test-Repo"

def main():
    if len(sys.argv) < 2:
        print(f"Usage: python fix.py <issue-number>", file=sys.stderr)
        sys.exit(1)

    if len(sys.argv) > 2:
        print(f"Error: Expected exactly one argument, got {len(sys.argv) - 1}.", file=sys.stderr)
        sys.exit(1)

    issue_arg = sys.argv[1].strip().lstrip("#")
    if not issue_arg.isdigit():
        print(f"Error: Invalid issue number '{sys.argv[1]}'. Must be a positive integer.", file=sys.stderr)
        sys.exit(1)

    issue_num = int(issue_arg)
    if issue_num <= 0:
        print(f"Error: Issue number must be a positive integer, got {issue_num}.", file=sys.stderr)
        sys.exit(1)

    print(f"fix {REPO}#{issue_num}")
    sys.exit(0)

if __name__ == "__main__":
    main()
