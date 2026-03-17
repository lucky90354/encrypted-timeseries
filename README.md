# Encrypted Timeseries

# What this repo includes

- `src/emitter.js` — generates a randomized batch of messages every 10 seconds and sends them to the listener.

- `src/listener.js` — receives encrypted streams, decrypts them, validates the checksum (`secret_key`), saves valid records into MongoDB, and broadcasts updates via Socket.IO.

- `src/frontend.js` + `public/index.html` — a small dashboard that connects over WebSockets and shows incoming records + success rate.

- `src/shared/crypto.js` — SHA-256 checksum + AES-256-CTR encryption/decryption.

- `__tests__/crypto.test.js` — basic unit tests for hashing + encryption.

------------------------------

#  How to run (local development)

# 1) Prerequisites
------------------------------
- Node.js `>= 18`
- A running **MongoDB** instance (default URI: `mongodb://127.0.0.1:27017`)

> Optionally, create a `.env` file in the repo root and set values (see `.env.example`).

# 2) Install dependencies
------------------------------
bash
------------------------------
npm install


# 3) Start the services
------------------------------
Start the listener (receives encrypted streams + writes to MongoDB + publishes WebSocket updates):

bash
------------------------------
npm run start:listener


Start the frontend dashboard:

bash
------------------------------
npm run start:frontend


Start the emitter (sends a new encrypted stream every 10 seconds):

bash
------------------------------
npm run start:emitter


> Open the dashboard at: `http://localhost:3000`
------------------------------

# Run with Docker
------------------------------
Make sure you have Docker & Docker Compose installed.

From the project root:
------------------------------
bash
------------------------------
docker-compose up --build


This starts:
- **mongo** on `localhost:27017`
- **app** (listener+emitter+frontend) exposing:
  - `5000` for the encrypted socket listener
  - `4000` for WebSocket updates
  - `3000` for the dashboard UI

To stop:

bash
------------------------------
docker-compose down



# Run tests
------------------------------
npm test


# How it works (high level)

1. **Emitter** generates a random number of messages (49–499). Each message:
   - Picks random `name`, `origin`, `destination` from `data.json`
   - Computes `secret_key = sha256(JSON.stringify({name, origin, destination}))`
   - Encrypts the payload using **AES-256-CTR** (passphrase in `config.js` / `.env`)
   - Sends a `|`-delimited stream to the listener.

2. **Listener** receives the stream, decrypts each segment, validates the `secret_key`, and saves valid records grouped by minute into MongoDB.

3. **Frontend** connects to Listener via Socket.IO and displays records + success rate in real time.

# Configuration

You can override defaults by setting environment variables (either via `.env` or your shell):

- `AES_PASSPHRASE` — encryption key used by emitter and listener
- `SOCKET_PORT` — port emitter uses to connect to listener (default 5000)
- `WS_PORT` — WebSocket server port (default 4000)
- `FRONTEND_PORT` — dashboard port (default 3000)
- `MONGODB_URI` — MongoDB connection string




.env file content


AES_PASSPHRASE=HR6Zt85PZOf1dDxRlFMtsy5cL5mYGtjd
SOCKET_PORT=5000
WS_PORT=4000
FRONTEND_PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/encrypted_timeseries