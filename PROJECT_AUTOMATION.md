# TrailersHub Automation Blueprint

## 1. Project Overview

TrailersHub (trailershub.org) is a Node.js + TypeScript application using Supabase as the database and Docker for deployment.

The project includes a manual TMDB import feature in the admin panel. We now want to implement safe and intelligent automation for importing movies.

---

## 2. Core Automation Objective

Automate TMDB imports so that:

- Latest movies are fetched automatically.
- Only movies with VALID official trailers are imported.
- Junk, placeholder, concept, or fan-made videos are never imported.
- The system runs safely on a schedule.
- No duplicate movies are inserted.
- Existing manual import functionality is never broken.

---

## 3. Strict TMDB Trailer Validation Rules

A movie must ONLY be imported if it has a valid trailer.

A trailer is valid ONLY if:

- site == "YouTube"
- type == "Trailer"
- official == true (if field exists)
- published_at exists (if available)
- name/title DOES NOT contain (case-insensitive):
  concept
  fan
  edit
  parody
  fake
  reaction
  remake
  leak
  unofficial

Preferred selection order:

1) official trailer containing "Official Trailer"
2) official trailer (type=Trailer)
3) fallback only if clearly official

If no valid trailer exists → DO NOT IMPORT MOVIE.

---

## 4. Future Release Protection

- Skip movies releasing more than 90 days in the future.
- Avoid importing unreleased hype movies with placeholder videos.

---

## 5. Deduplication Rules

- Use unique tmdb_id in database.
- Always upsert (never blindly insert).
- Never duplicate existing records.

---

## 6. Automation Job Requirements

The automated import job must:

- Be implemented as a Node/TypeScript job or script.
- Support CLI flags:
  --days=7
  --future-window=90
  --dry-run
- Log:
  - total checked
  - total skipped
  - total imported
- Handle API errors gracefully.
- Use environment variables for TMDB API key.
- Integrate cleanly with existing Supabase schema.
- Be safe for Docker or cron scheduling.

---

## 7. Scheduling Strategy

Automation must support:

- Cron-based execution on server
OR
- Docker-compatible scheduled job

It must not block the main server process.

---

## 8. Safety & Development Constraints

When modifying code:

- Follow existing project architecture.
- Reuse existing TMDB service logic if present.
- Do not break manual admin import feature.
- Write production-safe TypeScript.
- Never hardcode API keys.
- Always respect trailer validation rules above.

---

## 9. Master Automation Execution Prompt

Whenever implementing or modifying TMDB automation logic, Claude must follow this execution instruction:

"Read PROJECT_AUTOMATION.md completely.
Scan the repository to understand current TMDB import logic and Supabase schema.
Design and implement automation that strictly follows the validation, deduplication, and safety rules.
Do not simplify trailer filtering.
Add dry-run mode and logging.
Show all files created or modified.
Explain changes briefly before finalizing."

This instruction overrides casual suggestions.
