const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const PROVIDERS = {
  google: {
    clientId: process.env.OAUTH_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  facebook: {
    clientId: process.env.OAUTH_FACEBOOK_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.OAUTH_FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_CLIENT_SECRET,
    authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
  },
  github: {
    clientId: process.env.OAUTH_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
  },
};

function getCallbackUrl(provider) {
  const baseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl.replace(/\/$/, '')}/api/users/oauth/${provider}/callback`;
}

function getAllowedReturnTo(value) {
  if (value === 'coli://auth') return value;
  const webOrigin = process.env.OAUTH_WEB_ORIGIN;
  if (!webOrigin || !value) return null;
  try {
    const requested = new URL(value);
    const allowed = new URL(webOrigin);
    return requested.origin === allowed.origin && ['http:', 'https:'].includes(requested.protocol)
      ? `${allowed.origin}/`
      : null;
  } catch {
    return null;
  }
}

function readCookie(req, name) {
  const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function clearStateCookie(res) {
  res.set('Set-Cookie', 'coli_oauth_state=; HttpOnly; SameSite=Lax; Path=/api/users/oauth; Max-Age=0');
}

async function getProviderIdentity(provider, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
  if (provider === 'google') {
    const { data } = await axios.get('https://openidconnect.googleapis.com/v1/userinfo', { headers });
    if (!data.email_verified) throw new Error('Google did not verify this email address.');
    return { id: data.sub, name: data.name, email: data.email };
  }
  if (provider === 'facebook') {
    const { data } = await axios.get('https://graph.facebook.com/me?fields=id,name,email', { headers });
    if (!data.email) throw new Error('Facebook did not provide a verified email address.');
    return { id: data.id, name: data.name, email: data.email };
  }

  const [{ data: profile }, { data: emails }] = await Promise.all([
    axios.get('https://api.github.com/user', { headers }),
    axios.get('https://api.github.com/user/emails', { headers }),
  ]);
  const email = emails.find((entry) => entry.primary && entry.verified)?.email;
  if (!email) throw new Error('GitHub did not provide a verified primary email address.');
  return { id: String(profile.id), name: profile.name || profile.login, email };
}

router.get('/:provider', (req, res) => {
  const { provider } = req.params;
  const config = PROVIDERS[provider];
  if (!config) return res.status(404).json({ success: false, error: 'Unsupported sign-in provider.' });
  if (!config.clientId || !config.clientSecret) {
    return res.status(503).json({ success: false, error: `${provider} sign-in is not configured on the server.` });
  }

  const returnTo = getAllowedReturnTo(req.query.returnTo) || process.env.COLI_AUTH_REDIRECT_URL || 'coli://auth';
  const state = jwt.sign({ provider, nonce: crypto.randomBytes(24).toString('hex'), returnTo }, JWT_SECRET, { expiresIn: '10m' });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.set('Set-Cookie', `coli_oauth_state=${encodeURIComponent(state)}; HttpOnly; SameSite=Lax; Path=/api/users/oauth; Max-Age=600${secure}`);

  const authorization = new URL(config.authorizeUrl);
  authorization.searchParams.set('client_id', config.clientId);
  authorization.searchParams.set('redirect_uri', getCallbackUrl(provider));
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('state', state);
  if (provider === 'google') authorization.searchParams.set('scope', 'openid email profile');
  if (provider === 'facebook') authorization.searchParams.set('scope', 'email,public_profile');
  if (provider === 'github') authorization.searchParams.set('scope', 'read:user user:email');
  res.redirect(authorization.toString());
});

router.get('/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const config = PROVIDERS[provider];
  const stateCookie = readCookie(req, 'coli_oauth_state');
  clearStateCookie(res);

  try {
    if (!config || !config.clientId || !config.clientSecret) throw new Error('This sign-in provider is not configured.');
    if (!req.query.state || !stateCookie || req.query.state !== stateCookie) throw new Error('Sign-in state validation failed. Please try again.');
    const state = jwt.verify(String(req.query.state), JWT_SECRET);
    if (state.provider !== provider) throw new Error('Sign-in provider validation failed.');
    if (req.query.error || !req.query.code) throw new Error('Sign-in was cancelled or denied.');

    const tokenResponse = await axios.post(config.tokenUrl, new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: String(req.query.code),
      redirect_uri: getCallbackUrl(provider),
      grant_type: 'authorization_code',
    }).toString(), { headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (!tokenResponse.data.access_token) throw new Error('The provider did not return an access token.');

    const identity = await getProviderIdentity(provider, tokenResponse.data.access_token);
    const email = String(identity.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) throw new Error('The provider did not return a usable verified email address.');

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({ name: identity.name || email.split('@')[0], email, passwordHash: null });
    }
    const token = jwt.sign({ userId: user.uuid || user.id }, JWT_SECRET, { expiresIn: '7d' });
    const redirect = new URL(state.returnTo || process.env.COLI_AUTH_REDIRECT_URL || 'coli://auth');
    redirect.searchParams.set('token', token);
    return res.redirect(redirect.toString());
  } catch (error) {
    console.error(`[OAuth] ${provider} callback failed:`, error.message);
    let returnTo = process.env.COLI_AUTH_REDIRECT_URL || 'coli://auth';
    try {
      const state = req.query.state && jwt.verify(String(req.query.state), JWT_SECRET);
      if (state?.provider === provider && state.returnTo) returnTo = state.returnTo;
    } catch {}
    const redirect = new URL(returnTo);
    redirect.searchParams.set('error', error.message || 'Sign-in failed.');
    return res.redirect(redirect.toString());
  }
});

module.exports = router;