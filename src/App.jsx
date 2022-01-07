import './App.css';
import {
  Row,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
} from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';
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

let getInitalContent = () => {
  let header = {
    alg: 'sr25519',
    typ: 'JW3T',
    add: 'ss58',
  };
  let payload = {
    add: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
  };

  let exp = Math.floor(Date.now() / 1000) + 24 * 3600; // expire in 24 hours
  let content = new JW3TContent(header, payload)
    .setAudience('uri:test')
    .setExpiration(exp);

  let h = JSON.stringify(content.header, null, 4);
  let p = JSON.stringify(content.payload, null, 4);
  return { header: h, payload: p };
};

let createToken = async (headerJson, payloadJson, signingAccount) => {
  let content = new JW3TContent(headerJson, payloadJson);
  let polkaJsSigner = new PolkaJsSigner(signingAccount);
  let jw3tSigner = new JW3TSigner(polkaJsSigner, content);
  let { base64Content, base64Sig } = await jw3tSigner.getSignature();
  return `${base64Content}.${base64Sig}`;
};

let verifyToken = async (token) => {
  let polkaJsVerifier = new PolkaJsVerifier();
  let jw3tVerifier = new JW3TVerifier(polkaJsVerifier);
  let content = await jw3tVerifier.verify(token);
  return content;
};

function getAccountDisplayStr(account) {
  let str = '';
  if (account?.meta?.name) str += `(${account?.meta?.name}) `;
  if (account?.address) str += `${stringShorten(account?.address)}`;
  return str;
}

function AccountDropdown({
  signingAccounts,
  selectedSigningAccount,
  selectHandler,
}) {
  signingAccounts = signingAccounts.filter((sa) => sa?.account?.address);
  let title = getAccountDisplayStr(selectedSigningAccount?.account);
  return (
    <DropdownButton
      id="dropdown-item-button"
      variant="transparent"
      className="border border-primary rounded"
      title={title}
      onSelect={(selectedIdx) =>
        selectHandler && selectHandler(signingAccounts[selectedIdx])
      }>
      {signingAccounts.map((sa, idx) => {
        let text = getAccountDisplayStr(sa?.account);
        return (
          <Dropdown.Item as="button" eventKey={idx}>
            {text}
          </Dropdown.Item>
        );
      })}
    </DropdownButton>
  );
}
function resetTextareaHeight(textareaRef) {
  if (textareaRef?.current) {
    textareaRef.current.style = { ...textareaRef.current.style, height: '0px' };
    const scrollHeight = textareaRef.current.scrollHeight || 0;
    textareaRef.current.style.height = scrollHeight + 'px';
  }
}
function App() {
  let { header: initHeader, payload: initPayload } = getInitalContent() || {};
  let [signingAccounts, setSigningAccounts] = useState([]);
  let [signingAccount, setSigningAccount] = useState();
  let [header, setHeader] = useState(initHeader);
  let [headerError, setHeaderError] = useState();
  let [payload, setPayload] = useState(initPayload);
  let [payloadError, setPayloadError] = useState();
  let [token, setToken] = useState('');
  let [tokenError, setTokenError] = useState();
  let [isValid, setIsValid] = useState();
  let headerTextareaRef = useRef();
  let payloadTextareaRef = useRef();
  let tokenTextareaRef = useRef();

  useEffect(() => {
    initializeAccounts().then((accounts) => {
      accounts && console.log(accounts[0]?.address || 'noaddress');
      setSigningAccounts(accounts);
      accounts?.[0]?.account?.address &&
        setPayloadAddress(accounts?.[0]?.account?.address);
      setSigningAccount(accounts[0]);
    });
  }, []);

  useEffect(() => {
    setHeaderError('');
    setPayloadError('');
    resetTextareaHeight(headerTextareaRef);
    resetTextareaHeight(payloadTextareaRef);

    setToken('');
    let headerJson;
    let payloadJson;
    let contentIsInvalid = false;
    try {
      headerJson = JSON.parse(header);
    } catch (err) {
      setHeaderError(err?.message || err);
      contentIsInvalid = true;
    }
    try {
      payloadJson = JSON.parse(payload);
    } catch (err) {
      setPayloadError(err?.message || err);
      contentIsInvalid = true;
    }
    if (!contentIsInvalid && signingAccount) {
      createToken(headerJson, payloadJson, signingAccount)
        .then((token) => setToken(token))
        .catch((err) => {
          setTokenError(err?.message || err);
        });
    }
  }, [signingAccount, header, payload]);

  useEffect(() => {
    setTokenError('');
    token &&
      verifyToken(token)
        .then((content) => {
          console.log(content);
          setIsValid(true);
        })
        .catch((err) => setTokenError(err?.message || err));
  }, [token]);

  const setPayloadAddress = (address) => {
    !payloadError &&
      setPayload((payload) => {
        let newPayload = payload;
        try {
          let payloadJson = JSON.parse(payload);
          payloadJson.add = address;
          newPayload = JSON.stringify(payloadJson, null, 4);
        } catch (err) {
          console.log(
            'can not change the payload address since payload is not a in valid json format.'
          );
        }
        return newPayload;
      });
  };
  const selectAccountHandler = (signingAccount) => {
    setSigningAccount(signingAccount);
    signingAccount?.account?.address &&
      setPayloadAddress(signingAccount?.account?.address);
  };

  return (
    <Container className="py-5">
      <Row>
        <Col xl="12" className="text-break d-flex flex-column py-2">
          <Form.Group className="my-2">
            <Form.Label>
              <strong>Header</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              ref={headerTextareaRef}
              className="w-100 fw-light"
              value={header}
              onChange={(e) => setHeader(e?.target?.value)}
            />
            {headerError && (
              <Form.Text className="text-danger">{headerError || ''}</Form.Text>
            )}
          </Form.Group>
          <Form.Group className="my-2">
            <Form.Label>
              <strong>Payload</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              ref={payloadTextareaRef}
              className="w-100 fw-light"
              value={payload}
              onChange={(e) => setPayload(e?.target?.value)}
            />
            {payloadError && (
              <Form.Text className="text-danger">{payloadError}</Form.Text>
            )}
          </Form.Group>
        </Col>
        <Col xl="12" className="d-flex justify-content-center py-2">
          <AccountDropdown
            signingAccounts={signingAccounts}
            selectedSigningAccount={signingAccount}
            selectHandler={(signingAccount) =>
              selectAccountHandler(signingAccount)
            }
          />
        </Col>
        <Col xl="12" className="text-break py-2">
          <Form.Group className="my-2">
            <Form.Label>
              <strong>Encoded JW3T</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              ref={tokenTextareaRef}
              style={{ resize: 'none' }}
              className="w-100 fw-light"
              value={token}
            />
            {tokenError && (
              <Form.Text className="text-danger">{tokenError}</Form.Text>
            )}
          </Form.Group>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
