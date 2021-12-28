import logo from './logo.svg';
import './App.css';
import { useState, useEffect } from 'react';
import {
  JW3TContent,
  JW3TSigner,
  JW3TVerifier,
  PolkaJsSigner,
  PolkaJsVerifier,
} from 'jw3t';
import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate } from '@polkadot/util-crypto';
let createToken = async () => {
  let keyring = new Keyring({ type: 'ed25519' });
  let mnemonic = mnemonicGenerate();
  let account = keyring.createFromUri(mnemonic);
  let signingAccount = { account };
  let address = account.address;
  let header = {
    alg: 'ed25519',
    typ: 'JW3T',
    add: 'ss58',
  };
  let payload = {
    add: address,
  };

  let exp = Math.floor(Date.now() / 1000) + 24 * 3600; // expire in 24 hours
  let content = new JW3TContent(header, payload)
    .setAudience('uri:test')
    .setExpiration(exp);
  let polkaJsSigner = new PolkaJsSigner(signingAccount);
  let jw3tSigner = new JW3TSigner(polkaJsSigner, content);
  let { base64Content, base64Sig } = await jw3tSigner.getSignature();
  let jw3t = `${base64Content}.${base64Sig}`;
  return jw3t;
};

let verifyToken = async (token) => {
  let polkaJsVerifier = new PolkaJsVerifier();
  let jw3tVerifier = new JW3TVerifier(polkaJsVerifier);
  let content = await jw3tVerifier.verify(token);
  return content;
};

function App() {
  let [token, setToken] = useState('');
  let [{ header, payload }, setContent] = useState({});
  let [error, setError] = useState();
  useEffect(() => {
    createToken().then((token) => setToken(token));
  }, []);

  useEffect(() => {
    try {
      verifyToken(token).then((content) => {
        console.log(content);
        setContent(content);
      });
    } catch (err) {
      setError(err?.message || err);
    }
  }, [token]);
  return (
    <div>
      <p>{token}</p>
      <p>{JSON.stringify(header)}</p>
      <p>{JSON.stringify(payload)}</p>
    </div>
  );
}

export default App;
