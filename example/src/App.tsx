import React, { useEffect } from 'react';

import { StyleSheet, View, Text, Button } from 'react-native';
import Bdk, {
  Network,
  DerivedBip39Xprvs,
  WalletDescriptors,
  WalletCfg,
  XprvsWithPaths,
  MultiSigCfg,
  XpubsWithPaths,
  SpendChangePolicy,
  FeeType,
  WalletTxn,
  // Psbt,
  TxnDetails,
  Base64String,
} from 'react-native-bdk';

const bdk = Bdk();
export default function App() {
  const [xPrvs, setXPrvs] = React.useState<DerivedBip39Xprvs>();
  const [xPubs] = React.useState<XpubsWithPaths[]>([]);
  // const [xPubs, setXpubs] = React.useState<XpubsWithPaths[]>([]);
  const [walletDesc, setWalletDesc] = React.useState<WalletDescriptors>();
  // const [isWalletInit] = React.useState<boolean>(false);
  const [isWalletInit, setIsWalletInit] = React.useState<boolean>(false);
  const [address, setAddress] = React.useState<string>('');
  const [balance, setBalance] = React.useState<number>(0);
  // txn
  const [txnDetails, setTxnDetails] = React.useState<TxnDetails>();
  const [psbt, setPsbt] = React.useState<Base64String>();
  //
  const [isFinalizedPsbt, setIsFinalizedPsbt] = React.useState<boolean>(false);
  // ref
  const syncIntervalRef = React.useRef<ReturnType<typeof setInterval>>();
  const signedRef = React.useRef<boolean>(false);

  const genNewWpkhDescriptors = async ({
    network,
    derivationPath,
    password,
  }: {
    network: Network;
    derivationPath: string;
    password: string;
  }) => {
    const keys = await bdk.genXprvs(network, derivationPath, password);
    const descriptors = await bdk.getWalletDescriptorsFromXprvPaths(
      keys.xprv_w_paths,
      network
    );
    setXPrvs(keys);
    setWalletDesc(descriptors);
    return { keys, descriptors };
  };

  //
  // multi Sig
  const createMulitSig = () => {
    if (!xPrvs || !xPubs) return;
    let cfg: MultiSigCfg = {
      // TODO desriptors should be renamed to extendedKeys
      descriptors: [
        ...xPubs.map((pub) => ({ Xpub: pub })),
        ...xPrvs.xprv_w_paths.map(([xprv, _, fp]) => ({
          // change full path to xprv with relative path
          Xprv: [xprv, 'm/0', fp] as XprvsWithPaths,
        })),
      ],
      network: Network.Mainnet,
      quorom: 2,
    };
    bdk
      .getWalletDescriptorsFromMultiSigConf(cfg)
      .then((desc) => setWalletDesc(desc));
  };

  useEffect(() => {
    if (!walletDesc) return;
    const walletCfg: WalletCfg = {
      name: 'wallet_' + Date.now(),
      descriptors: walletDesc,
      db_path: '%%%?%%%',
      address_look_ahead: 10,
      server_uri: 'ssl://electrum.blockstream.info:60002',
    };
    // const walletCfg: WalletCfg = JSON.parse(adriana_wallet);
    console.log('effect', walletCfg);
    bdk
      .getElectrumWalletFromCfg(walletCfg)
      .then((desc) => setIsWalletInit(desc));
  }, [walletDesc]);

  /**
   * Get balance and Address */
  useEffect(() => {
    if (!isWalletInit) return;
    bdk.getNewWalletAddress('TODO:someJsonCfg').then(setAddress);
    bdk.getWalletBalance('TODO:someJsonCfg').then(setBalance);

    if (!syncIntervalRef.current) {
      console.log('starting sync timeout...');
      syncIntervalRef.current = setInterval(() => {
        console.log('timeout');
        bdk
          .sync('10')
          .then((_) => bdk.getWalletBalance('pop'))
          .then((b) => setBalance(b));
      }, 15000);
    }
  }, [isWalletInit]);

  /**
   * Create a txn */
  useEffect(() => {
    if (!address?.length || !isWalletInit) return;
    const txn: WalletTxn = {
      recipients: [[address, 1000]],
      fee: 1,
      fee_type: FeeType.Absolute,
      spend_change: SpendChangePolicy.Yes,
      enable_rbf: true,
    };
    bdk.createTxn(txn).then(({ psbt: p, txnDetails: t }) => {
      setTxnDetails(t);
      bdk
        .deserPsbt(p)
        .then((deser) => console.log('create psbt:', console.log(deser)));
      setPsbt(p);
    });
  }, [isWalletInit, address]);
  //
  // Sign psbt
  useEffect(() => {
    if (!isWalletInit || !psbt) return;

    if (signedRef.current) return;

    bdk.signPsbt(psbt).then(({ psbt: p, finished }) => {
      signedRef.current = true;
      setPsbt(p);
      bdk
        .deserPsbt(p)
        .then((deser) => console.log('sign psbt:', { finished, deser }));
      setIsFinalizedPsbt(finished);
    });
  }, [isWalletInit, psbt]);

  return (
    <View style={styles.container}>
      <Button
        title="Gen Wpkh wallet"
        onPress={() =>
          genNewWpkhDescriptors({
            network: Network.Mainnet,
            derivationPath: "m/44/0'/0'",
            password: '123',
          })
        }
      >
        Gen New WPKH seed & Descriptors
      </Button>
      {/*<Text>Xprvs: {JSON.stringify(xPrvs)}</Text> */}
      {/*<Text>XPubs: {JSON.stringify(xPubs)}</Text> */}
      {/* <Text>Wallet Desc: {JSON.stringify(walletDesc)}</Text> */}
      <Text>Wallet is {`${isWalletInit ? 'Ready' : 'Syncing..'}`}</Text>
      {!!isWalletInit && <Text>{balance}</Text>}
      {!!address?.length && <Text>{`bitcoin:${address}`}</Text>}
      {!!psbt && (
        <Text
          style={{ color: isFinalizedPsbt ? 'green' : 'red' }}
        >{`psbt :${psbt}`}</Text>
      )}
      {!!txnDetails && <Text>{`txnDetails :${txnDetails}`}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
