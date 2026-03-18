# T-Tail Treasure Hunt

A voice-controlled game for pediatric speech therapy focusing on final /t/ minimal pairs (Bee/Beet, Boo/Boot, Bow/Boat, Bye/Bite).

Children use their voice to navigate games — sharp "T!" sounds trigger jumps, sustained hums activate shields, and loud vocalizations trigger boosts. All audio processing is done client-side via the Web Audio API. No audio is recorded or transmitted.

## Setup

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. A microphone is required for gameplay.

## Game Modes

- **Treasure Map** — Practice individual minimal pairs
- **Match Quest** — Memory card matching with voice confirmation
- **Taily's Challenge** — Feed the fox mascot by saying words with a sharp "T!"
- **Story Island** — Unlock story panels by earning gems
- **EchoRush** — 3D endless runner controlled entirely by voice

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |
