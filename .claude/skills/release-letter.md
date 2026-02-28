# Create Release Letter

## When to use
Use this skill when the user wants to create a release letter for a new version of TimeLedger.

## Workflow

### Step 1: Check version
Read the current version from `package.json` and present it to the user. Ask them:
- Whether the current version is already correct for this release
- Or whether they want to set a new version

Use AskUserQuestion with these options:
- "Version is correct" — proceed directly to Step 3
- "Update version" — proceed to Step 2

### Step 2: Update version (if requested)
Ask the user for the new version string using AskUserQuestion with a free-text prompt like "What should the new version be? (current: X.Y.Z)".

Once received, update the `"version"` field in `package.json` using the Edit tool. Only change the version value, nothing else.

### Step 3: Generate release letter
Run the slash command `/generate-release-letter` using the Skill tool to generate the release letter based on the current state and the (potentially updated) version.

## Dependencies
- **Command:** `.claude/commands/generate-release-letter.md` — contains the prompt and guidelines used by the `/generate-release-letter` slash command invoked in Step 3.
