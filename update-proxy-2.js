const fs = require('fs');
const file = 'app/api/jules/[...path]/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the response header copying logic again. NextJS's `NextResponse`
// with `arrayBuffer` handles content encoding issues correctly.
// Let's make sure we aren't doing any explicit header copying for response that breaks things.
content = content.replace(/const newHeaders = new Headers\(\);\s*response\.headers\.forEach\(\(value, key\) => \{\s*[\s\S]*?\s*\}\);\s*return new NextResponse\(responseBuffer, \{\s*status: response\.status,\s*headers: newHeaders,\s*\}\);/, `const newHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip content-encoding if node-fetch already decompressed it.
      // Next.js handles re-compressing if the client accepts it.
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(lowerKey)) {
        newHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBuffer, {
      status: response.status,
      headers: newHeaders,
    });`);

fs.writeFileSync(file, content);
