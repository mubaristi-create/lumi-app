import { createPrivateKey, sign } from 'node:crypto';
const fail = message => { console.error(message); process.exit(1); };
try {
  const { ASC_KEY_ID: kid, ASC_ISSUER_ID: iss, ASC_PRIVATE_KEY: pem, IOS_BUNDLE_ID: bundle } = process.env;
  if (!/^[A-Z0-9]{10}$/.test(kid || '') || !/^[0-9a-f-]{36}$/i.test(iss || '') || !pem || !bundle) fail('App Store Connect API secrets or bundle ID are missing/invalid.');
  const key = createPrivateKey(pem.replace(/\r/g, ''));
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') fail('An ES256 Team API private key is required.');
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: 'ES256', kid, typ: 'JWT' }) + '.' + encode({ iss, iat: now, exp: now + 300, aud: 'appstoreconnect-v1' });
  const token = unsigned + '.' + sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  const url = new URL('https://api.appstoreconnect.apple.com/v1/apps');
  url.searchParams.set('filter[bundleId]', bundle);
  url.searchParams.set('limit', '1');
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok) fail('Apple API authorization check failed (HTTP ' + response.status + '). No response/token logged.');
  const body = await response.json();
  if (!Array.isArray(body.data) || !body.data.some(app => app.attributes?.bundleId === bundle)) fail('API key does not have access to the configured Lumi app.');
  console.log('Apple API authentication and access to the configured Lumi app verified.');
} catch {
  fail('Apple API verification could not complete. Check key configuration and Apple service availability; credentials withheld.');
}
