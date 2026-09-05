fetch('http://127.0.0.1:3000/api/jules/sessions?pageSize=10', {
  headers: {
    'Accept-Encoding': 'gzip, deflate, br'
  }
})
  .then(res => res.json())
  .then(async data => {
    const sessions = data.sessions || [];
    for (const session of sessions) {
      const actRes = await fetch(`http://127.0.0.1:3000/api/jules/sessions/${session.id}/activities?pageSize=50`);
      const actData = await actRes.json();
      for (const act of (actData.activities || [])) {
        if (act.systemStateUpdate) {
          console.log(JSON.stringify(act));
        }
      }
    }
  })
  .catch(err => console.error(err));
