# CardSnap AI 📇

A mobile-first web app for field sales professionals and networkers — 
scan a business card at an event, extract the contact details instantly 
with AI, add context (where you met, relationship type, notes), and 
save it to your personal contact database.

No more lost cards. No manual data entry. Your network, organized.

## The problem it solves
You walk out of a conference with 30 visiting cards. By Monday, 
you've forgotten who half of them are. CardSnap captures the card 
*and* the context — at the moment you meet them.

## Features
- 📸 Snap or upload a business card image
- 🤖 AI extracts name, title, company, email, phone automatically
- 🏷️ Tag the relationship — client, partner, prospect, investor
- 📍 Log where and when you met them
- 💾 Saves to your personal contact database (Supabase)
- 📱 Runs as a web app on iOS and Android (PWA-ready)

## Tech stack
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth + database)
- Built with Lovable

## Status
✅ Core scanning and contact saving — working  
✅ Event/relationship tagging — working  
🔄 Razorpay payment integration — in progress (premium tier)  
🔄 Native iOS/Android packaging — roadmap  

## Run locally
```bash
git clone https://github.com/iivik/cardsnap-ai
cd cardsnap-ai
cp .env.example .env
# Add your Supabase credentials to .env
npm install
npm run dev
```

## Background
Built by a 25-year enterprise sales veteran who kept losing track of 
contacts after events. If you spend time at conferences and still 
rely on a pile of cards or a Notes app, this is for you.
