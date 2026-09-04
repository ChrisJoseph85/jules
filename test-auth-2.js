const fetch = require('node:fetch');

async function test() {
  const url = 'https://jules.googleapis.com/v1alpha/sessions';
  const res = await fetch(url, { headers: { 'x-goog-api-key': 'test' } });
  console.log(await res.text());
}

test();
