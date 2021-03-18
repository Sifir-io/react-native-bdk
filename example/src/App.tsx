import React, { useEffect } from 'react';

import { StyleSheet, View, Text } from 'react-native';
import Bdk, {
  Network,
  DerivedBip39Xprvs,
  WalletDescriptors,
  WalletCfg,
} from 'react-native-bdk';

const bdk = Bdk();
export default function App() {
  const [xPrvs, setXPrvs] = React.useState<DerivedBip39Xprvs>();
  const [walletDesc, setWalletDesc] = React.useState<WalletDescriptors>();
  const [isWalletInit, setIsWalletInit] = React.useState<boolean>(false);
  const [address, setAddress] = React.useState<string>('');
  const [balance, setBalance] = React.useState<number>(0);

  useEffect(() => {
    bdk
      .genXprvs(Network.Mainnet, "m/44'/0'/0'", 'mypass')
      .then((xprvs) => setXPrvs(xprvs));
  }, []);

  useEffect(() => {
    if (!xPrvs) return;
    bdk
      .getWalletDescriptorsFromXprvPaths(xPrvs.xprv_w_paths, Network.Mainnet)
      .then((desc) => setWalletDesc(desc));
  }, [xPrvs]);

  useEffect(() => {
    if (!walletDesc) return;
    const walletCfg: WalletCfg = {
      name: 'examplewallet333358',
      descriptors: walletDesc,
      db_path: '%%%?%%%',
      address_look_ahead: 0,
    };
    bdk
      .getElectrumWalletFromCfg(walletCfg)
      .then((desc) => setIsWalletInit(desc));
  }, [walletDesc]);

  useEffect(() => {
    bdk.getNewWalletAddress('TODO:someJsonCfg').then(setAddress);
    bdk.getWalletBalance('TODO:someJsonCfg').then(setBalance);
  }, [isWalletInit]);

  return (
    <View style={styles.container}>
      <Text>Xprvs: {JSON.stringify(xPrvs)}</Text>
      <Text>Wallet Desc: {JSON.stringify(walletDesc)}</Text>
      <Text>Wallet is {`${isWalletInit ? 'Ready' : 'Syncing..'}`}</Text>
      {!!isWalletInit && <Text>{balance}</Text>}
      {!!address?.length && <Text>{`bitcoin:${address}`}</Text>}
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
