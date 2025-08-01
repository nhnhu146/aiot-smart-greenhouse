---
applyTo: '**.ts,**.tsx'
---
# This file contains instructions for banning specific code patterns in TypeScript files.
## Mock data
- Avoid falling back to mock data if the frontend is connected to a real backend.
- Mock data can only be enabled by user setting, not by default or fallback.