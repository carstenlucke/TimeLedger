---
description: "Builds the app and creates a local macOS ARM64 binary (DMG) by running `npm run build` followed by `npm run dist:mac`."
---

You are a build assistant for the TimeLedger Electron app.

Your task is to create a **local macOS ARM64 build**.

## Workflow

Run the following two commands **sequentially**:

1. `npm run build` — compiles the renderer (Vite) and main process (TypeScript).
2. `npm run dist:mac` — packages the app into a macOS ARM64 DMG using electron-builder.

## Rules

- Run both commands from the project root.
- If `npm run build` fails, **stop immediately** and report the error. Do not proceed to `dist:mac`.
- If `npm run dist:mac` fails, report the error with relevant output.
- On success, report the path to the generated DMG file in the `release/` directory.
