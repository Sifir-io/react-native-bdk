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
  get_wallet_desc_from_multi_sig_conf(multi_sig_cfg: string): Promise<string>;
  get_wallet_desc_from_any_desc_conf(desc_conf: string): Promise<string>;
  xpubsWPaths_from_xprvsWithPaths(
    xprvWithPaths: string,
    network: string
  ): Promise<string>;
  electrum_wallet_from_cfg(wallet_cfg_json: string): Promise<boolean>;
  get_wallet_address(index: number): Promise<string>;
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
  phrase: string;
  master_xprv: ExtendedPrivKey;
  xprv_w_paths: XprvsWithPaths[];
}

// MultiSig
//
/**
 * Public Xpubs, Paths and Fingerprints used in a multisig wallet config
 */
export interface MultiSigXpub {
  Xpub: XpubsWithPaths;
}

/**
 * Private Xprvs, Paths and Fingerprints used in a multisig wallet config
 */
export interface MultiSigXprv {
  Xprv: XprvsWithPaths;
}
type MultiSigKey = MultiSigXpub | MultiSigXprv;

/**
 * Config used to generate a MultiSig Wallet descriptor
 */
export interface MultiSigCfg {
  /**
   * Array of Xpubs and Xprvs used to generate a multi sig wallet descriptor
   */
  descriptors: MultiSigKey[];
  network: Network;
  /**
   * Minimum quorom required for signing a txn
   */
  quorom: number;
}
// Wallet Descriptor Cfgs
// Possible configurations we can send down to create wallet descriptors of our choise

interface WpkhDescCfg {
  Wpkh: [[XprvsWithPaths, XprvsWithPaths], Network];
}
interface WshMultiSortedCfg {
  WshMultiSorted: MultiSigCfg;
}

type AnyDescriptorCfg = WpkhDescCfg | WshMultiSortedCfg;

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

/**
 * Consesus serialized and base64 encoded PSBT
 */
export type SerializedPsbt = string;

export type CreateTxnResult = { psbt: Psbt; txnDetails: TxnDetails };
export type SerializedCreateTxnResult = {
  psbt: SerializedPsbt;
  txnDetails: TxnDetails;
};

export type SignPsbtResult = { psbt: Psbt; finished: boolean };
export type SerializedSignPsbtResult = {
  psbt: SerializedPsbt;
  finished: boolean;
};

interface BDKNativeModule extends NativeModulesStatic {
  Bdk: BdkType;
}
const { Bdk } = NativeModules as BDKNativeModule;

const bdk = () => {
  let hasWallet: boolean = false;

  /**
   * Generates a new BIP39 based seed and derived Xprvs based on the provided Paths.
   * If "seedWords" are provided they will be used to seed the masterXprv and dervice the xPrvs
   * @param network
   * @param devPath The derivation path for the derived Xprvs in a string format ex: "m/44/0'/0'"
   * @param pass A password to protect the seed
   * @param seedWords If provided will be used to generate the seed, ie used to restore a Bip39 wallet
   * @param numchild Number of *normal* (not hardend) children from the derivation path to dervie and return
   * ex: for a devPath of "m/44/0'/0'" if numChild=2 is provided the returned xPrvs will have paths "m/44/0'/0'/0" and "m/44/0'/0'/1"
   */
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

  /**
   * Initialize and electrum wallet based on passed Config
   * @param walletCfg
   */
  const getElectrumWalletFromCfg = async (walletCfg: WalletCfg) => {
    if (hasWallet) {
      throw 'Wallet already init, use shutdown';
    }
    const walletCfgJson = JSON.stringify(walletCfg);
    hasWallet = await Bdk.electrum_wallet_from_cfg(walletCfgJson);
    return hasWallet;
  };

  const getNewWalletAddress = async () => {
    if (!hasWallet) {
      throw 'Wallet not-init, call getElectrumWalletFromCfg first';
    }
    return await Bdk.get_wallet_address(1);
  };
  const getLastUsedWalletAddress = async () => {
    if (!hasWallet) {
      throw 'Wallet not-init, call getElectrumWalletFromCfg first';
    }
    return await Bdk.get_wallet_address(0);
  };
  const getWalletBalance = async (param: string) => {
    if (!hasWallet) {
      throw 'Wallet not-init, call getElectrumWalletFromCfg first';
    }
    return await Bdk.get_wallet_balance(param);
  };
  /**
   * Convert a private XPrvsWithPaths tuple into a public Xpub with paths that can be shared
   * @param xprvWithPaths
   * @param network
   */
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
  /**
   * Generate a WSH multisorted descriptor from MultSigConf
   * @param multiSigConf
   */
  const getWshMultiSortedWalletDescriptorsFromMultiSigConf = async (
    multiSigConf: MultiSigCfg
  ): Promise<WalletDescriptors> => {
    const json = JSON.stringify({
      WshMultiSorted: { ...multiSigConf },
    } as AnyDescriptorCfg);
    const desc: string = await Bdk.get_wallet_desc_from_any_desc_conf(json);
    return JSON.parse(desc);
  };
  /**
   * Gens WPKH single sig wallet descriptor based on two Xprvs provided
   * One will be used as the external and one as the internal desc
   * @param XprvsWithPathsTuple A tuple with the first entry used as the external descriptor and the second for internal (change)
   * @param network
   */
  const getWpkhWalletDescriptorsFromXprvPaths = async (
    XprvsWithPathsTuple: [XprvsWithPaths, XprvsWithPaths],
    network: Network
  ): Promise<WalletDescriptors> => {
    const json = JSON.stringify({
      Wpkh: [XprvsWithPathsTuple, network],
    } as AnyDescriptorCfg);
    const desc: string = await Bdk.get_wallet_desc_from_any_desc_conf(json);
    return JSON.parse(desc);
  };

  const createTxn = async (
    txn: WalletTxn
  ): Promise<SerializedCreateTxnResult> => {
    if (hasWallet) {
      throw 'Wallet already init, use shutdown';
    }
    const txnString = JSON.stringify(txn);
    const txnResult: string = await Bdk.create_txn(txnString);
    return JSON.parse(txnResult);
  };
  const signPsbt = async (
    b64Psbt: SerializedPsbt
  ): Promise<SerializedSignPsbtResult> => {
    if (hasWallet) {
      throw 'Wallet already init, use shutdown';
    }
    const signResult = await Bdk.wallet_sign_psbt(b64Psbt);
    return JSON.parse(signResult);
  };
  const broadcastPsbt = async (b64Psbt: SerializedPsbt): Promise<TxnId> => {
    if (hasWallet) {
      throw 'Wallet already init, use shutdown';
    }
    const txnId = await Bdk.wallet_brodcast_psbt(b64Psbt);
    return txnId;
  };
  const deserPsbt = async (psbtb64: SerializedPsbt): Promise<Psbt> => {
    const psbt = await Bdk.decode_consensus_b4_psbt(psbtb64);
    console.error(psbt);
    return JSON.parse(psbt);
  };
  return {
    getElectrumWalletFromCfg,
    getXpubsWPathsFromXprvsWithPaths,
    genXprvs,
    getNewWalletAddress,
    getLastUsedWalletAddress,
    getWalletBalance,
    getWpkhWalletDescriptorsFromXprvPaths,
    getWshMultiSortedWalletDescriptorsFromMultiSigConf,
    createTxn,
    sync: Bdk.wallet_sync,
    signPsbt,
    broadcastPsbt,
    deserPsbt,
  };
};

export default bdk;
