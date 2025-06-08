#!/bin/bash
echo "Starting WikiStore Frontend Client..."
cd client
export VITE_API_URL=http://localhost:3001
npm run dev