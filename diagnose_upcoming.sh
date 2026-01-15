#!/bin/bash
echo "=== DIAGNOSING UPCOMING TRAILERS ISSUE ==="
echo ""
echo "1. Checking if UpcomingSection component exists in bundle:"
docker exec movietrailers-api sh -c "grep -l 'UpcomingSection\|upcomingTrailers\|setUpcomingTrailers' /app/dist/assets/*.js 2>/dev/null | head -3"
echo ""
echo "2. Checking if fetch is being called in bundle:"
docker exec movietrailers-api sh -c "grep -o '/upcoming' /app/dist/assets/*.js 2>/dev/null | head -5"
echo ""
echo "3. Testing API endpoint directly:"
curl -s http://localhost:3001/upcoming | head -20
echo ""
echo "4. Checking database for upcoming trailers:"
docker exec movietrailers-db psql -U movieapp -d movietrailers -c "SELECT COUNT(*) FROM upcoming_trailers WHERE is_released = false;" 2>/dev/null || echo "Cannot query database"
echo ""
echo "5. Checking if component file is on server:"
ls -la /root/trailerhub/src/components/UpcomingSection.tsx
echo ""
echo "6. Checking useEffect in component:"
grep -A 5 "useEffect" /root/trailerhub/src/components/UpcomingSection.tsx | head -10
echo ""
echo "7. Checking served files for component:"
grep -l "UpcomingSection" /var/www/movietrailers/assets/*.js 2>/dev/null | head -1

