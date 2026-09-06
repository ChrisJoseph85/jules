async function run() {
  const res = await fetch('http://localhost:3006/api/jules/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "test",
      title: "test",
      sourceContext: { source: "test" }
    })
  });
  console.log(await res.json());
}
run();
