# Who Wrote It? — The 1v1 Sentence Duel

A two-machine, LAN-only party game. One player writes a sentence, the other
guesses whether it came from the human across the table or from Claude.
Exactly 5 rounds are played; the higher score wins, and a tied score is a draw.

**You write. They guess. Was it you or AI?**

---

## Architecture at a glance

```
Private LAN (router / hotspot)
        |
   +----+----+
   |         |
Laptop 1  Laptop 2
 SERVER    CLIENT
http://192.168.x.x:3000/writer   (or opened locally as localhost)
http://192.168.x.x:3000/guesser
```

- **One process, one port.** `server/index.ts` is a custom Node HTTP server
  that attaches Socket.IO and hands everything else to Next.js. This is
  necessary because Socket.IO needs a persistent connection that plain
  Next.js API routes can't provide.
- **Server-authoritative game state.** All game logic — role assignment,
  topic selection, the human/AI coin flip, scoring, win detection — lives in
  `server/game.ts`, entirely in memory. The browser only ever sends a
  sentence or a guess; it never decides anything.
- **The only external call** is to the Anthropic API, made server-side from
  `lib/anthropic.ts`. Your API key never reaches the browser.
- **No database, no auth, no cloud hosting.** Everything resets when the
  server restarts — that's intentional for a two-laptop exhibition booth.

---

## One-time setup

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and paste your real ANTHROPIC_API_KEY
```

---

## Running the exhibition booth

**1. Connect both laptops to the same Wi-Fi network or a mobile hotspot.**

**2. On Laptop 1 (the server machine):**

```bash
npm run dev
```

This binds to `0.0.0.0:3000`, so it's reachable from other devices on the
network, not just from `localhost`.

**3. Find Laptop 1's LAN IP address.**

- macOS: `ipconfig getifaddr en0` (or `en1` if on Wi-Fi via a different
  interface)
- Windows: `ipconfig` and look for the `IPv4 Address` under your active
  adapter
- Linux: `hostname -I` or `ip addr show`

You'll get something like `192.168.50.10`.

**4. On Laptop 1, open the Writer screen locally:**

```
http://localhost:3000/writer
```

**5. On Laptop 2, open the Guesser screen using Laptop 1's LAN IP:**

```
http://192.168.50.10:3000/guesser
```

The first browser tab to connect becomes the **Writer**; the second becomes
the **Guesser**. This is decided by the server, not by which URL you typed —
so it lines up naturally with step 4/5 above as long as you open them in
that order.

**6. Play.** Topic appears on both screens → Writer types a sentence and
hits Enter → server secretly decides Human or AI (generating a Claude
sentence if needed) → Guesser sees one sentence and picks **Human** or
**AI** → both screens reveal the answer and the score → next round starts
automatically → all 5 rounds finish → highest score wins (ties are draws) → **Play Again** resets for the next pair.

### If Laptop 2 can't connect

- Make sure both laptops are on the *same* network (not one on Wi-Fi and one
  on Ethernet through a different router).
- Check Laptop 1's firewall isn't blocking incoming connections on port
  3000 (macOS may prompt "Allow incoming connections" the first time — allow
  it).
- Some public/campus Wi-Fi networks isolate devices from each other for
  security. If so, use a personal mobile hotspot or a private travel router
  instead.

---

## Production mode (optional, for a long exhibition day)

```bash
npm run build
npm run start
```

`start` still runs the same custom server on `0.0.0.0`, just using the
optimized Next.js production build.

---

## Project structure

```
who-wrote-it/
├── app/
│   ├── page.tsx           # role-select landing page
│   ├── writer/page.tsx    # Writer client logic + UI
│   └── guesser/page.tsx   # Guesser client logic + UI
├── components/            # Scoreboard, TopicDisplay, SentenceInput,
│                           # GuessButtons, Reveal, DuelStatus
├── lib/
│   ├── socket.ts           # client-side Socket.IO singleton
│   └── anthropic.ts        # server-side Claude call (never imported client-side)
├── server/
│   ├── index.ts            # custom HTTP server + Socket.IO attach, binds 0.0.0.0
│   ├── game.ts              # server-authoritative duel state machine
│   └── topics.ts            # topic list + picker
├── types/
│   └── game.ts              # shared types + Socket.IO event payload shapes
├── .env.local.example
└── README.md
```

## Socket.IO event reference

| Event | Direction | Payload |
|---|---|---|
| `duel:joined` | server → client | `{ role }` |
| `duel:status` | server → client | connection/state snapshot |
| `round:start` | server → both | `{ topic, round }` |
| `writer:submit` | client → server | `{ sentence }` |
| `writer:waiting` | server → writer | — |
| `guess:ready` | server → guesser | `{ topic, sentence, round }` (never includes `source`) |
| `guesser:guess` | client → server | `{ guess: "human" \| "ai" }` |
| `round:reveal` | server → both | `{ source, sentence, correct, scores, round }` |
| `duel:finished` | server → both | `{ winner, scores }` |
| `duel:reset` | client → server | — |

## What's deliberately not here

No database, no accounts, no cloud deploy, no Redis, no Docker. This is a
two-laptop, in-memory, LAN-only exhibition game — simplicity was chosen over
scalability on purpose.
