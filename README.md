Lucky Seat Game - Modular Domain-Driven Backend API
A scalable, secure, feature-modular Node.js / Express / MongoDB backend designed around Domain Slicing.
Architecture Layout
Each business feature lives in its own module inside src/modules/:
auth: Registration, login, JWT token issuance, cookie handling.
users: User profiles, user blocking, admin user listing.
games: Public game browsing, game status tracking.
seats: Dynamic seat generation, race-condition-proof seat reservations.
notifications: User alert center for game announcements and winner announcements.
admin: Game creation, Cloudinary prize image uploads, winner selection, admin stats.
Setup Instructions
Install dependencies:
code
Bash
npm install
Configure environment variables:
code
Bash
cp .env.example .env
Seed the default Administrator account:
code
Bash
npm run seed:admin
Start development server:
code
Bash
npm run dev
