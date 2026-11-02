"""Convenience entry point: python -m app.seed [--reset]."""

from app.db.seed import main

if __name__ == "__main__":
    main()
