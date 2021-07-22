import { NativeModules, NativeModulesStatic } from 'react-native';

type BdkType = {
  get_xprvs(
    network: Network,
    devPath: DerivationPath,
    pass: string,
    seedWords?: string,
    numchild?: number
  ): Promise<string>;
  descriptors_from_xprvs_wpaths_json(
    xprvs_wpaths_vec_json_str: string,
    network: Network
  ): Promise<string>;
  get_wallet_desc_from_multi_sig_conf(multi_sig_cfg: String): Promise<string>;
  xpubsWPaths_from_xprvsWithPaths(
    xprvWithPaths: String,
    network: String
  ): Promise<string>;
  electrum_wallet_from_cfg(wallet_cfg_json: string): Promise<boolean>;
  get_new_wallet_address(param: string): Promise<string>;
  get_wallet_balance(param: string): Promise<number>;
};

type ExtendedPrivKey = string;
type ExtendedPubKey = string;
type DerivationPath = string;
type Fingerprint = string;
type Descriptor = string;

export enum Network {
  Mainnet = 'bitcoin',
  Testnet = 'testnet',
}
export interface WalletDescriptors {
  network: Network;
  external: Descriptor;
  internal: Descriptor;
  public: string;
}
export interface WalletCfg {
  name: string;
  descriptors: WalletDescriptors;
  address_look_ahead: number;
  db_path?: string;
}

export type XprvsWithPaths = [ExtendedPrivKey, DerivationPath, Fingerprint];
export type XpubsWithPaths = [ExtendedPubKey, DerivationPath, Fingerprint];

export interface DerivedBip39Xprvs {
  phrase: String;
  master_xprv: ExtendedPrivKey;
  xprv_w_paths: XprvsWithPaths[];
}

export interface MultiSigXpub {
  Xpub: XpubsWithPaths;
}
export interface MultiSigXprv {
  Xprv: XprvsWithPaths;
}
type MultiSigKey = MultiSigXpub | MultiSigXprv;

export interface MultiSigCfg {
  descriptors: MultiSigKey[];
  network: Network;
  quorom: number;
}

interface BDKNativeModule extends NativeModulesStatic {
  Bdk: BdkType;
}
const { Bdk } = NativeModules as BDKNativeModule;

const bdk = () => {
  let hasWallet: boolean = false;

  const genXprvs = async (
    network: Network,
    devPath: DerivationPath,
    pass: string,
    seedWords: string = '',
    numchild: number = 2
  ): Promise<DerivedBip39Xprvs> => {
    const xprvs = await Bdk.get_xprvs(
      network,
      devPath,
      pass,
      seedWords,
      numchild
    );
    return JSON.parse(xprvs);
  };
  const getWalletDescriptorsFromXprvPaths = async (
    xprvsWithPaths: XprvsWithPaths[],
    network: Network
  ): Promise<WalletDescriptors> => {
    const xprvsWithPathsJson = JSON.stringify(xprvsWithPaths);
    const desc: string = await Bdk.descriptors_from_xprvs_wpaths_json(
      xprvsWithPathsJson,
      network
    );
    return JSON.parse(desc);
  };

  const getElectrumWalletFromCfg = async (walletCfg: WalletCfg) => {
    if (hasWallet) {
      throw 'Wallet already init, use shutdown';
    }
    const walletCfgJson = JSON.stringify(walletCfg);
    hasWallet = await Bdk.electrum_wallet_from_cfg(walletCfgJson);
    return hasWallet;
  };

  const getNewWalletAddress = async (param: string) => {
    if (!hasWallet) {
      throw 'Wallet not-init, call getElectrumWalletFromCfg first';
    }
    return await Bdk.get_new_wallet_address(param);
  };
  const getWalletBalance = async (param: string) => {
    if (!hasWallet) {
      throw 'Wallet not-init, call getElectrumWalletFromCfg first';
    }
    return await Bdk.get_wallet_balance(param);
  };
  const getXpubsWPathsFromXprvsWithPaths = async (
    xprvWithPaths: XprvsWithPaths,
    network: Network
  ): Promise<XprvsWithPaths> => {
    const xprvsWithPathsJson = JSON.stringify(xprvWithPaths);
    const desc: string = await Bdk.xpubsWPaths_from_xprvsWithPaths(
      xprvsWithPathsJson,
      network
    );
    console.error('puibsss', desc);
    return JSON.parse(desc);
  };
  const getWalletDescriptorsFromMultiSigConf = async (
    multiSigConf: MultiSigCfg
  ): Promise<WalletDescriptors> => {
    const json = JSON.stringify(multiSigConf);
    const desc: string = await Bdk.get_wallet_desc_from_multi_sig_conf(json);
    return JSON.parse(desc);
  };
  return {
    getElectrumWalletFromCfg,
    getWalletDescriptorsFromXprvPaths,
    getXpubsWPathsFromXprvsWithPaths,
    genXprvs,
    getNewWalletAddress,
    getWalletBalance,
    getWalletDescriptorsFromMultiSigConf,
  };
};

export default bdk;
