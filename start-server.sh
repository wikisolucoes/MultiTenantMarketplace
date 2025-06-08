#!/bin/bash
echo "Starting WikiStore API Backend..."
cd server
export PORT=3001
export NODE_ENV=development
npm install
npm run start:dev