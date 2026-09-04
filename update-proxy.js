const fs = require('fs');
const file = 'app/api/jules/[...path]/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the header copying logic
content = content.replace(/const headers = new Headers\(\);\s*\/\/ Copy incoming headers[\s\S]*?\/\/ Inject our API key securely\s*headers\.set\('x-goog-api-key', apiKey\);/, `const headers = new Headers();
    // Only forward safe headers and use the API key
    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('content-type', contentType);
    }
    const accept = request.headers.get('accept');
    if (accept) {
      headers.set('accept', accept);
    }
    headers.set('x-goog-api-key', apiKey);`);

// Replace the response header copying logic to strip content-encoding
content = content.replace(/const newHeaders = new Headers\(\);\s*response\.headers\.forEach\(\(value, key\) => \{\s*newHeaders\.set\(key, value\);\s*\}\);/, `const newHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // node fetch decompresses the body, so we must not forward these
      if (lowerKey !== 'content-encoding' && lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding') {
        newHeaders.set(key, value);
      }
    });`);

fs.writeFileSync(file, content);
