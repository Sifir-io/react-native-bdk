class SwiftResult {
    var hasResult:Bool = false;
    var error:Optional<String> = nil;
    init(call_result:ResultMessage){
        switch(call_result.tag){
        case Success:
            hasResult = true
            break;
        default:
            hasResult = false
            if let error_string = call_result.error {
                error = String.init(cString: error_string);
            } else {
                error = "unknown error"
            }
        }
    }
}

@objc(Bdk)
class Bdk: NSObject {
    var electrumWallet:Optional<OpaquePointer> = nil;
    
    @objc(get_xprvs:devPath:pass:seedWords:numchild:
    withResolver:withRejecter:)
    func get_xprvs(network:String,devPath:String,pass:String,seedWord:String,numChild:NSNumber,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        let xprvs = derive_xprvs(network,devPath,pass,seedWord,UInt(numChild)).pointee;
        let result = SwiftResult.init(call_result: xprvs.message);
        if result.hasResult {
            let xprvs = String.init(cString: xprvs.result.pointee!)
            resolve(xprvs);
        } else {
            reject("BDK.xprvs",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    
    @objc(xpubsWPaths_from_xprvsWithPaths:network:withResolver:withRejecter:)
    func xpubsWPaths_from_xprvsWithPaths(xprvWithPaths:String,network:String,resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock){
        let xpubsResult = Libsifir_btc_wallet.xprvs_w_paths_to_xpubs_w_paths(xprvWithPaths, network).pointee;
        let result = SwiftResult.init(call_result: xpubsResult.message);
        if result.hasResult {
            let xpubs = String.init(cString: xpubsResult.result.pointee!)
            resolve(xpubs);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
        
    }
    
    @objc(get_wallet_desc_from_any_desc_conf:withResolver:withRejecter:)
    func get_wallet_desc_from_any_desc_conf(desc_cfg:String,resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock){
        let descriptorsResult = Libsifir_btc_wallet.wallet_descriptors_from_any_descriptor_cfg(desc_cfg).pointee;
        let result = SwiftResult.init(call_result: descriptorsResult.message);
        if result.hasResult {
            let descriptors = String.init(cString: descriptorsResult.result.pointee!)
            resolve(descriptors);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    
    
    
    @objc(electrum_wallet_from_cfg:withResolver:withRejecter:)
    func electrum_wallet_from_cfg(wallet_cfg_json:String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        Libsifir_btc_wallet.start_logger();
        let temporaryDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory(),isDirectory: true)
        // this gives file:///Users/.../tmp/ so we remove the file:// prefix and trailing slash
        let path = String(temporaryDirectoryURL.absoluteString.dropFirst(7).dropLast());
        let HACK = wallet_cfg_json.replacingOccurrences(of: "%%%?%%%", with: path);
        let electrumWallet = electrum_wallet_from_wallet_cfg(HACK).pointee;
        let result = SwiftResult.init(call_result: electrumWallet.message);
        if result.hasResult {
            self.electrumWallet = electrumWallet.result!;
            resolve(true);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    
    @objc(get_wallet_address:withResolver:withRejecter:)
    func get_wallet_address(index:NSNumber,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        
        let addressResult = get_electrum_wallet_address(wallet,UInt32(truncating: index)).pointee;
        let result = SwiftResult.init(call_result: addressResult.message);
        if result.hasResult {
            let address = String.init(cString: addressResult.result.pointee!)
            resolve(address);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    @objc(get_wallet_balance:withResolver:withRejecter:)
    func get_wallet_balance(param:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        
        let addressResult = get_electrum_wallet_balance(wallet).pointee;
        let result = SwiftResult.init(call_result: addressResult.message);
        if result.hasResult {
            let balance = addressResult.result.pointee
            resolve(balance);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    @objc(shutdown_wallet:withRejecter:)
    func shutdown_wallet(resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock){
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        Libsifir_btc_wallet.drop_wallet(wallet)
        self.electrumWallet = Optional.none;
    }
    
    @objc(create_txn:withResolver:withRejecter:)
    func create_txn(txn:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock){
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        let createTxnResult = Libsifir_btc_wallet.create_tx(wallet, txn).pointee;
        let result = SwiftResult.init(call_result: createTxnResult.message);
        if result.hasResult {
            let txn = String.init(cString: createTxnResult.result.pointee!)
            resolve(txn);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
        
    }
    	 
    @objc(wallet_sign_psbt:withResolver:withRejecter:)
    func wallet_sign_psbt(b64Psbt:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock){
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        let createTxnResult = Libsifir_btc_wallet.sign_psbt(wallet, b64Psbt).pointee;
        let result = SwiftResult.init(call_result: createTxnResult.message);
        if result.hasResult {
            let txn = String.init(cString: createTxnResult.result.pointee!)
            resolve(txn);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
        
    }
    
    @objc(wallet_brodcast_psbt:withResolver:withRejecter:)
    func wallet_brodcast_psbt(b64Psbt:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock){
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        let broadcastResult = Libsifir_btc_wallet.broadcast_pbst(wallet, b64Psbt).pointee;
        let result = SwiftResult.init(call_result: broadcastResult.message);
        if result.hasResult {
            let txnId = String.init(cString: broadcastResult.result.pointee!)
            resolve(txnId);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    
    
    
    @objc(wallet_sync:withResolver:withRejecter:)
    func wallet_sync(forward:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock){
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        
        print("electrum_wallet_from_cfg: starting sync.. TODO Make me an async observer");
        let syncResult = Libsifir_btc_wallet.sync_electrum_wallet(wallet,100).pointee
        let result = SwiftResult.init(call_result: syncResult.message);
        if result.hasResult {
            resolve(true);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    
    
    
    @objc(decode_consensus_b4_psbt:withResolver:withRejecter:)
    func decode_consensus_b4_psbt(psbt:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock){
        
        let callResult = Libsifir_btc_wallet.consensus_b64_psbt_to_json_string(psbt).pointee
        
        let result = SwiftResult.init(call_result: callResult.message);
        if result.hasResult {
            let payload = String.init(cString: callResult.result.pointee!)
            resolve(payload);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "BDK", code: 99));
        }
    }
    
    
}
