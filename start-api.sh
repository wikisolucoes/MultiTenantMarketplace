#!/bin/bash
echo "Starting WikiStore API Backend..."
cd api
export PORT=3001
export NODE_ENV=development
npm run start:dev