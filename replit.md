# VEILCHAT

A premium secure messaging mobile app — futuristic, minimal, and trustworthy. Think next-generation WhatsApp + Signal aesthetic with a matte black / neon cyan design system.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Expo app runs via the `artifacts/veilchat: expo` workflow

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native) with Expo Router
- API: Express 5
- State: React Context + AsyncStorage
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/veilchat/` — Expo mobile app
- `artifacts/veilchat/app/` — Expo Router screens
- `artifacts/veilchat/app/(auth)/` — Login, OTP, Profile Setup screens
- `artifacts/veilchat/app/(tabs)/` — Main 5-tab layout (Chats, Status, Calls, Contacts, Settings)
- `artifacts/veilchat/app/chat/[id].tsx` — Individual chat screen
- `artifacts/veilchat/context/AuthContext.tsx` — Auth state + AsyncStorage
- `artifacts/veilchat/context/ChatContext.tsx` — Chat/contact state with mock data
- `artifacts/veilchat/constants/colors.ts` — VEILCHAT design tokens
- `artifacts/api-server/` — Express backend

## Design System

- Background: `#0A0A0A` (matte black)
- Card: `#111827` (dark blue-grey)
- Accent: `#00F5D4` (neon cyan)
- Text: `#E5E7EB`
- Font: Inter (400/500/600/700)
- Always dark mode (`userInterfaceStyle: "dark"`)

## Architecture decisions

- Frontend-only for Phase 1: all data stored in AsyncStorage with mock contacts/messages
- Modular context architecture ready for real backend (Socket.IO, JWT auth) in Phase 2
- Auth flow: Phone → OTP → Profile Setup → Main tabs
- Mock auto-replies simulate a live chat feel
- Inverted FlatList for chat (correct pattern for messaging UIs)

## Product

5-tab secure messenger:
1. **Chats** — conversation list with unread badges, search
2. **Status** — story-style status updates with fullscreen viewer
3. **Calls** — call history with in-app voice call UI
4. **Contacts** — alphabetically grouped, searchable
5. **Settings** — profile, notifications, privacy, theme, logout

## User preferences

- Built with Expo (React Native), not Flutter
- Always dark UI — matte black (#0A0A0A) with neon cyan (#00F5D4) accents
- Premium, minimal, futuristic aesthetic — NOT hacker/spying style

## Gotchas

- Demo OTP code is `123456`
- Auto-replies simulate chat activity after ~1.5s delay
- Backend (Socket.IO, real auth) is Phase 2 — not yet implemented

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `expo` skill for Expo-specific patterns
