import './App.css';
import { Row, Col, Container, Dropdown, DropdownButton } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import {
  JW3TContent,
  JW3TSigner,
  JW3TVerifier,
  PolkaJsSigner,
  PolkaJsVerifier,
} from 'jw3t';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { stringShorten } from '@polkadot/util';
import { loadSigningAccounts } from './extension';

let initializeAccounts = async () => {
  await cryptoWaitReady();
  return loadSigningAccounts();
};
let createToken = async (signingAccount) => {
  let header = {
    alg: 'sr25519',
    typ: 'JW3T',
    add: 'ss58',
  };
  let payload = {
    add: signingAccount?.account?.address,
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

function AccountDropdown({
  signingAccounts,
  selectedSigningAccount,
  selectHandler,
}) {
  let title = selectedSigningAccount?.account?.address
    ? stringShorten(selectedSigningAccount?.account?.address, 5)
    : '';
  signingAccounts = signingAccounts.filter((sa) => sa?.account?.address);
  return (
    <DropdownButton
      id="dropdown-item-button"
      title={title}
      onSelect={(selectedIdx) =>
        selectHandler && selectHandler(signingAccounts[selectedIdx])
      }>
      {signingAccounts.map((sa, idx) => {
        let text = sa.account.address;
        return (
          <Dropdown.Item as="button" eventKey={idx}>
            {text}
          </Dropdown.Item>
        );
      })}
    </DropdownButton>
  );
}
function App() {
  let [signingAccounts, setSigningAccounts] = useState([]);
  let [signingAccount, setSigningAccount] = useState();
  let [token, setToken] = useState('');
  let [{ header, payload }, setContent] = useState({});
  let [error, setError] = useState();
  useEffect(() => {
    initializeAccounts().then((accounts) => {
      accounts && console.log(accounts[0]?.address || 'noaddress');
      setSigningAccounts(accounts);
      setSigningAccount(accounts[0]);
    });
  }, []);

  useEffect(() => {
    signingAccount &&
      createToken(signingAccount)
        .then((token) => setToken(token))
        .catch((err) => alert(err));
  }, [signingAccount]);

  useEffect(() => {
    token &&
      verifyToken(token)
        .then((content) => {
          console.log(content);
          setContent(content);
        })
        .catch((err) => setError(err?.message || err));
  }, [token]);
  return (
    <Container className="py-5">
      <Row>
        <Col xl="12" className="text-break">
          <p className="w-100">{token}</p>
          <p className="w-100">{error}</p>
        </Col>
        <Col xl="12">
          <AccountDropdown
            signingAccounts={signingAccounts}
            selectedSigningAccount={signingAccount}
            selectHandler={(signingAccount) =>
              setSigningAccount(signingAccount)
            }
          />
        </Col>
        <Col xl="12" className="text-break d-flex flex-column">
          <textarea className="w-100" value={JSON.stringify(header)} />
          <textarea className="w-100" value={JSON.stringify(payload)} />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
