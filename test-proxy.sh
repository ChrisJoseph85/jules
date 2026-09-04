export JULES_API_KEY=test
curl -sS -v -H "Accept-Encoding: gzip, deflate, br" http://localhost:3000/api/jules/sources > output.txt
cat output.txt
