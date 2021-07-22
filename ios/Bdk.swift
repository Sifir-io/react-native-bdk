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
            reject("BDK.xprvs",result.error,NSError.init(domain: "TOR", code: 99));
        }
    }
    
    @objc(descriptors_from_xprvs_wpaths_json:network:withResolver:withRejecter:)
    func descriptors_from_xprvs_wpaths_json (xprvs_wpaths_vec_json_str:String,network:String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        let descriptors = descriptors_from_xprvs_wpaths_vec(xprvs_wpaths_vec_json_str,network).pointee;
        let result = SwiftResult.init(call_result: descriptors.message);
        if result.hasResult {
            let descriptors = String.init(cString: descriptors.result.pointee!)
            resolve(descriptors);
        } else {
            reject("BDK.xprvs",result.error,NSError.init(domain: "TOR", code: 99));
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
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "TOR", code: 99));
        }
        
    }
    @objc(get_wallet_desc_from_multi_sig_conf:withResolver:withRejecter:)
    func get_wallet_desc_from_multi_sig_conf(multi_sig_cfg:String,resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock){
        let descriptorsResult = Libsifir_btc_wallet.descriptors_from_multi_sig_conf(multi_sig_cfg).pointee;
        let result = SwiftResult.init(call_result: descriptorsResult.message);
        if result.hasResult {
            let descriptors = String.init(cString: descriptorsResult.result.pointee!)
            resolve(descriptors);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "TOR", code: 99));
        }
    }
    
    
    @objc(electrum_wallet_from_cfg:withResolver:withRejecter:)
    func electrum_wallet_from_cfg(wallet_cfg_json:String, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        let temporaryDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory(),isDirectory: true)
        // this gives file:///Users/.../tmp/ so we remove the file:// prefix and trailing slash
        let path = String(temporaryDirectoryURL.absoluteString.dropFirst(7).dropLast());
        let HACK = wallet_cfg_json.replacingOccurrences(of: "%%%?%%%", with: path);
        let electrumWallet = electrum_wallet_from_wallet_cfg(HACK).pointee;
        let result = SwiftResult.init(call_result: electrumWallet.message);
        if result.hasResult {
            self.electrumWallet = electrumWallet.result!;
            print("electrum_wallet_from_cfg: starting sync.. TODO Make me an async observer");
            sync_electrum_wallet(self.electrumWallet, 100);
            print("electrum_wallet_from_cfg: sync done.");
            resolve(true);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "TOR", code: 99));
        }
    }
    
    @objc(get_new_wallet_address:withResolver:withRejecter:)
    func get_new_wallet_address(param:String,resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        guard let wallet = self.electrumWallet else {
            reject("BDK.electrum_wallet","Wallet not init, call electrum_wallet_from_cfg first",NSError.init(domain: "BDK", code: 99));
            return;
        }
        
        let addressResult = get_electrum_wallet_new_address(wallet).pointee;
        let result = SwiftResult.init(call_result: addressResult.message);
        if result.hasResult {
            let address = String.init(cString: addressResult.result.pointee!)
            resolve(address);
        } else {
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "TOR", code: 99));
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
            reject("BDK.electrum_wallet",result.error,NSError.init(domain: "TOR", code: 99));
        }
    }
    
    
    
    
}
