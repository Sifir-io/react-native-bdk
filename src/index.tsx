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
  create_txn(txn: string): Promise<string>;
  wallet_sync(forward: string): Promise<boolean>;
  wallet_sign_psbt(b64Psbt: string): Promise<string>;
  wallet_brodcast_psbt(b64Psbt: string): Promise<string>;
  decode_consensus_b4_psbt(b64Psbt: string): Promise<string>;
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
  server_uri: string | null;
}

export type XprvsWithPaths = [ExtendedPrivKey, DerivationPath, Fingerprint];
export type XpubsWithPaths = [ExtendedPubKey, DerivationPath, Fingerprint];

export interface DerivedBip39Xprvs {
  phrase: String;
  master_xprv: ExtendedPrivKey;
  xprv_w_paths: XprvsWithPaths[];
}

// MultiSig
//
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

// Txns
//
export type Address = string;
export type Amount = number;
export type TxnRcpt = [Address, Amount];
export type TxnId = string;
export enum FeeType {
  Absolute = 'Abs',
  Rate = 'Rate',
}
export enum SpendChangePolicy {
  Yes = 'Yes',
  No = 'No',
  OnlyChange = 'OnlyChange',
}

export interface WalletTxn {
  recipients: TxnRcpt[];
  fee_type: FeeType;
  fee: number;
  spend_change: SpendChangePolicy;
  enable_rbf: boolean;
}

// TODO Build this type out from bdk::TransactionDetails
export interface TxnDetails {
  transaction?: {
    version: number;
    lock_time: number;
    input: any[];
    output: any[];
  };
  txnId: string;
  recieved: number;
  sent: number;
  fee?: number;
  confirmation_time?: number;
  verified?: boolean;
}

// TODO build this type out from bdk::ParitallySignedTransaction
export interface Psbt {
  global: any;
  inputs: any[];
  outputs: any[];
}
export type Base64String = string;

export type CreateTxnResult = { psbt: Psbt; txnDetails: TxnDetails };
export type SerializedCreateTxnResult = {
  psbt: Base64String;
  txnDetails: TxnDetails;
};

export type SignPsbtResult = { psbt: Psbt; finished: boolean };
export type SerializedSignPsbtResult = {
  psbt: Base64String;
  finished: boolean;
};

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
    return JSON.parse(desc);
  };
  const getWalletDescriptorsFromMultiSigConf = async (
    multiSigConf: MultiSigCfg
  ): Promise<WalletDescriptors> => {
    const json = JSON.stringify(multiSigConf);
    const desc: string = await Bdk.get_wallet_desc_from_multi_sig_conf(json);
    return JSON.parse(desc);
  };

  const createTxn = async (
    txn: WalletTxn
  ): Promise<SerializedCreateTxnResult> => {
    const txnString = JSON.stringify(txn);
    const txnResult: string = await Bdk.create_txn(txnString);
    return JSON.parse(txnResult);
  };
  // FIXME base64 derialize psbt to get SignPsbtResult
  // What kind of serialization is used ? Bytes ?
  const signPsbt = async (
    b64Psbt: Base64String
  ): Promise<SerializedSignPsbtResult> => {
    const signResult = await Bdk.wallet_sign_psbt(b64Psbt);
    return JSON.parse(signResult);
  };
  const broadcastPsbt = async (b64Psbt: Base64String): Promise<TxnId> => {
    const txnId = await Bdk.wallet_brodcast_psbt(b64Psbt);
    return txnId;
  };
  const deserPsbt = async (psbtb64: string): Promise<Psbt> => {
    const psbt = await Bdk.decode_consensus_b4_psbt(psbtb64);
    console.error(psbt);
    return JSON.parse(psbt);
  };
  return {
    getElectrumWalletFromCfg,
    getWalletDescriptorsFromXprvPaths,
    getXpubsWPathsFromXprvsWithPaths,
    genXprvs,
    getNewWalletAddress,
    getWalletBalance,
    getWalletDescriptorsFromMultiSigConf,
    createTxn,
    sync: Bdk.wallet_sync,
    signPsbt,
    broadcastPsbt,
    deserPsbt,
  };
};

export default bdk;
