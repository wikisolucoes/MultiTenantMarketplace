#!/bin/bash
echo "Starting WikiStore Frontend Client..."
cd client
export VITE_API_URL=http://localhost:3001
export NODE_ENV=development
npm install
npm run dev