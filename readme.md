# Local-First EMR with Distributed Syncing

A proof-of-concept electronic medical records system demonstrating local-first architecture with real-time distributed synchronization.

## Features
- 🏥 Patient and visit management
- 📱 Offline-first operation
- 🔄 Real-time sync across multiple clients
- ⚡ Conflict resolution
- 🔐 Local data privacy

## Architecture
- **Frontend**: React + SQLite (local storage)
- **Backend**: Express.js + PocketBase
- **Sync**: Server-sent events + REST API