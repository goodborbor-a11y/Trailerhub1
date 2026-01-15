#!/bin/bash
echo "=== DIAGNOSING ROUTE ISSUES ==="
echo ""
echo "1. Checking if page files exist on server:"
ls -la /root/trailerhub/src/pages/Movies.tsx
ls -la /root/trailerhub/src/pages/Upcoming.tsx
ls -la /root/trailerhub/src/pages/Trending.tsx
ls -la /root/trailerhub/src/pages/Categories.tsx
echo ""
echo "2. Checking App.tsx imports:"
grep -n "import.*Movies\|import.*Upcoming\|import.*Trending\|import.*Categories" /root/trailerhub/src/App.tsx
echo ""
echo "3. Checking App.tsx routes:"
grep -n "path=\"/movies\"\|path=\"/upcoming\"\|path=\"/trending\"\|path=\"/categories\"" /root/trailerhub/src/App.tsx
echo ""
echo "4. Checking built dist folder:"
ls -la /root/trailerhub/dist/ 2>/dev/null | head -20 || echo "Dist folder not found in project root"
echo ""
echo "5. Checking container dist folder:"
docker exec movietrailers-api ls -la /app/dist/ 2>/dev/null | head -20 || echo "Cannot access container dist"
echo ""
echo "6. Checking if routes are in built JS bundle:"
docker exec movietrailers-api grep -o "movies\|upcoming\|trending\|categories" /app/dist/assets/*.js 2>/dev/null | head -10 || echo "Cannot search bundle"
echo ""
echo "7. Checking for TypeScript/build errors:"
docker exec movietrailers-api cat /app/dist/index.html 2>/dev/null | head -30 || echo "Cannot read index.html"

