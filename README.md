# StreamTitles

Real-time speech recognition and translation overlay for streamers.

## Architecture

- **Panel** (`http://server:7890`) — стример открывает в браузере, настраивает языки и визуал
- **Overlay** (`http://server:7890/overlay`) — OBS добавляет как Browser Source, титры появляются автоматически

## Features

- Распознавание речи через Web Speech API
- Перевод через LibreTranslate (публичные серверы) + MyMemory fallback
- Настраиваемый визуал (шрифт, цвет, позиция, размер)
- Кэш переводов (localStorage)
- WebSocket ретрансляция от панели к оверлеям

## Quick Start

### Server (Linux)

```bash
# Install dependencies
npm install
cd ui && npm install && cd ..

# Start
npm run dev
```

### LibreTranslate (optional, Linux)

```bash
docker run -d --name libretranslate -p 5000:5000 --restart unless-stopped libretranslate/libretranslate
```

## Structure

```
├── main.js                 # Electron main process
├── src/
│   └── overlayServer.js    # Express + WebSocket server (port 7890)
├── overlay/
│   ├── standalone.html     # Control panel
│   └── obs-overlay.html    # OBS Browser Source overlay
├── ui/                     # React settings UI (port 3000)
└── package.json
```

## Tech Stack

- Electron + React
- Express + WebSocket (ws)
- Web Speech API (STT)
- LibreTranslate / MyMemory API (translation)
