import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp';
import { Keyring } from '@polkadot/keyring';
export const loadSigningAccounts = async () => {
  let keyring = new Keyring({ type: 'sr25519' });
  let signingAccounts = [];
  let testAccounts = [
    '//Alice',
    '//Bob',
    '//Charlie',
    '//Dave',
    '//Eve',
    '//Fredie',
  ];
  for (let testAccount of testAccounts) {
    signingAccounts.push({
      account: keyring.createFromUri(testAccount, {
        name: testAccount.slice(2),
      }),
    });
  }
  const injectedExt = await web3Enable('jw3t debugger');
  console.log(injectedExt);
  if (injectedExt.length === 0) {
    // no extension installed, or the user did not accept the authorization
    // in this case we should inform the use and give a link to the extension
    console.log('no signer extension was found');
    return signingAccounts;
  } else {
    const extAccounts = await web3Accounts();

    console.log(extAccounts);

    for (const extAccount of extAccounts) {
      const injectedAcct = {
        address: extAccount.address,
        meta: {
          ...extAccount.meta,
          isInjected: true,
        },
        type: extAccount.type,
      };
      const account = keyring.addFromAddress(
        injectedAcct.address,
        injectedAcct.meta,
        null,
        injectedAcct.type
      );
      if (account?.address) {
        const injector = await web3FromAddress(account.address);
        signingAccounts.push({ account, signer: injector.signer });
      }
    }
    return signingAccounts;
  }
};
