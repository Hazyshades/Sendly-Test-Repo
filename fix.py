#!/usr/bin/env python3
"""Print the repository and issue number formatted for the fix CLI."""

import sys

REPO = "Hazyshades/Sendly-Test-Repo"
USAGE = "Usage: python fix.py <issue-number>"


def main() -> int:
    args = sys.argv[1:]
    if len(args) != 1:
        print(USAGE, file=sys.stderr)
        return 1

    issue_arg = args[0].strip().lstrip("#")
    if not issue_arg.isdigit():
        print(USAGE, file=sys.stderr)
        return 1

    issue_num = int(issue_arg)
    if issue_num <= 0:
        print(USAGE, file=sys.stderr)
        return 1

    print(f"fix {REPO}#{issue_num}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
