import dotenv from 'dotenv';
dotenv.config();

import {
  AptosClient,
  AptosAccount,
  HexString,
  TxnBuilderTypes,
  BCS,
} from 'aptos'

const NODE_URL = process.env['NODE_URL'] || '';
const FOR_ACCOUNT_ADDRESS = process.env['FOR_ACCOUNT_ADDRESS'] || '';
const FOR_ACCOUNT_PRIVATE_KEY = process.env['FOR_ACCOUNT_PRIVATE_KEY'] || '';
const TO_ACCOUNT_ADDRESS = process.env['TO_ACCOUNT_ADDRESS'] || '';
const TO_ACCOUNT_PRIVATE_KEY = process.env['TO_ACCOUNT_PRIVATE_KEY'] || '';

const client = new AptosClient(NODE_URL);

function hexStringToUint8Array(privateKeyHex: string) {
  const hexString = new HexString(privateKeyHex);
  return hexString.toUint8Array();
}

/**
 * Steps to use:
 * 1. Alice use account A to deploy package
 * 2. Bob prepare an empty account B
 * 3. Alice share account A's address and private key to Bob
 * 4. Bob use this script to rotate account A's private key to account B
 * 5. Now Bob has a roated account with A's address and B's private key (& public key)
 */
async function main() {
  const alice = new AptosAccount(hexStringToUint8Array(FOR_ACCOUNT_PRIVATE_KEY), FOR_ACCOUNT_ADDRESS);
  const bob = new AptosAccount(hexStringToUint8Array(TO_ACCOUNT_PRIVATE_KEY), TO_ACCOUNT_ADDRESS);

  console.log('=== Initial ForAccount(Alice) and ToAccount(Bob) ===');
  console.log(`Alice:`);
  console.log(alice.toPrivateKeyObject());
  console.log(`Bob:`);
  console.log(bob.toPrivateKeyObject());

  /// Rotate private key. Alice should be funded with some fee.
  const pendingTxn = await client.rotateAuthKeyEd25519(
    alice,
    bob.signingKey.secretKey
  );
  await client.waitForTransaction(pendingTxn.hash, {
    checkSuccess: true,
    timeoutSecs: 60
  });

  const origAddressHex = await client.lookupOriginalAddress(
    bob.address()
  );
  const origAddress = TxnBuilderTypes.AccountAddress.fromHex(origAddressHex);
  const originAddressString = HexString.fromUint8Array(
    BCS.bcsToBytes(origAddress)
  ).hex();

  const rotatedAlice = new AptosAccount(
    bob.signingKey.secretKey,
    originAddressString
  );
  console.log(`RotatedAlice: ${originAddressString}`);
  console.log(rotatedAlice.toPrivateKeyObject());
}

main()
  .then(
    () => console.log('done')
  )
  .catch(
    e =>  console.error('error', e)
  );