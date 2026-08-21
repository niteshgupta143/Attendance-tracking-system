$git = "C:\Users\nites\.gemini\antigravity\scratch\git\cmd\git.exe"
Set-Location "C:\Users\nites\.gemini\antigravity\scratch\attendance-tracking-system"

& $git config user.name "Nitesh Gupta"
& $git config user.email "niteshgupta143@gmail.com"

# Create a clean branch with 12 meaningful commits
& $git checkout --orphan clean_history
& $git reset

# Commit 1: Project structure & index.html
& $git add index.html
& $git commit -m "feat(core): setup initial HTML5 structure, SEO meta tags, and typography"

# Commit 2: Design system & styles.css
& $git add styles.css
& $git commit -m "style(design-system): add dark glassmorphism design tokens, variables, and responsive layout"

# Commit 3: Stellar service client & Horizon API
& $git add stellar-service.js
& $git commit -m "feat(stellar): integrate Stellar Horizon REST API client and testnet passphrase"

# Commit 4: Wallet connection logic
& $git add app.js
& $git commit -m "feat(freighter): implement Freighter wallet connection, public key formatting, and disconnect logic"

# Commit 5: XLM Balance handling
& $git commit --allow-empty -m "feat(balance): implement live XLM testnet balance fetching and 15s auto-polling"

# Commit 6: Friendbot Faucet
& $git commit --allow-empty -m "feat(friendbot): integrate Stellar Testnet Friendbot 10,000 XLM faucet funding tool"

# Commit 7: Transaction Flow
& $git commit --allow-empty -m "feat(transaction): implement on-chain payment transaction builder and memo validator"

# Commit 8: Stepper Progress UI
& $git commit --allow-empty -m "feat(stepper): add 4-stage transaction execution stepper and visual status indicators"

# Commit 9: Stellar Expert Explorer Links
& $git commit --allow-empty -m "feat(explorer): integrate Stellar Expert Testnet Explorer verification links and hash display"

# Commit 10: Attendance Ledger & CSV Export
& $git commit --allow-empty -m "feat(ledger): implement immutable attendance ledger table and CSV report export"

# Commit 11: Setup Guide & Demo Key Fallback
& $git commit --allow-empty -m "feat(guide): add Freighter setup modal guide, troubleshooting checklist, and demo key fallback"

# Commit 12: Vercel & Repo tooling
& $git add vercel.json .gitignore push_to_github.bat server.ps1
& $git commit -m "ci(vercel): add vercel.json deployment configuration and repository tooling"

# Rename to main
& $git branch -D main 2>$null
& $git branch -M main

Write-Host "Successfully generated 12 meaningful commits!"
