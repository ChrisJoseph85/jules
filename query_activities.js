fetch('http://localhost:3006/api/jules/sessions?pageSize=10')
  .then(res => res.json())
  .then(async data => {
    const sessions = data.sessions || [];
    for (const session of sessions) {
      const actRes = await fetch(`http://localhost:3006/api/jules/sessions/${session.id}/activities?pageSize=50`);
      const actData = await actRes.json();
      for (const act of (actData.activities || [])) {
        console.log(Object.keys(act));
      }
    }
  })
  .catch(err => console.error(err));
