import fetch from 'node-fetch'; // Wait, let's not use node-fetch, just fetch
async function run() {
  const res = await fetch('http://127.0.0.1:4040/api/requests/http?limit=2');
  const data = await res.json();
  const r = data.requests[0];
  if (r.request?.body) {
    const bodyStr = Buffer.from(r.request.body, 'base64').toString('utf8');
    const bodyJson = JSON.parse(bodyStr);
    console.log('FULL WEBHOOK PAYLOAD FROM VAPI:');
    console.log(JSON.stringify(bodyJson, null, 2));
  }
}
run().catch(console.error);
