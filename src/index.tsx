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
   * Gens wpkh single sig wallet descriptor based on two Xprvs provided
   * One will be used as the external and one as the internal desc
   * @param XprvsWithPathsTuple A tuple with the first entry used as the external descriptor and the second for internal (change)
   * @param network
   */
  const getWalletDescriptorsFromXprvPaths = async (
    XprvsWithPathsTuple: [XprvsWithPaths, XprvsWithPaths],
    network: Network
  ): Promise<WalletDescriptors> => {
    const xprvsWithPathsJson = JSON.stringify(XprvsWithPathsTuple);
    const desc: string = await Bdk.descriptors_from_xprvs_wpaths_json(
      xprvsWithPathsJson,
      network
    );
    return JSON.parse(desc);
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
   * Generate a WPKH multisorted descriptor from MultSigConf
   * FIXME rename this to match what it does
   * @param multiSigConf
   */
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
