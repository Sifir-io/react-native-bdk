#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(Bdk, NSObject)

RCT_EXTERN_METHOD(get_xprvs:(NSString*)network
                  devPath:(NSString*)devPath
                  pass:(NSString*)pass
                  seedWords:(NSString*)seedWords
                  numchild:(nonnull NSNumber*)numChild
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(electrum_wallet_from_cfg:(NSString*)wallet_cfg_json
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get_wallet_address:(nonnull NSNumber*)index
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get_wallet_balance:(NSString*)param
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get_wallet_desc_from_any_desc_conf:(NSString*)desc_cfg
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(xpubsWPaths_from_xprvsWithPaths:(NSString*)xprvWithPaths
                  network:(NSString*)network
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(shutdown_wallet:(NSString*)(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(create_txn:(NSString*)txn
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(wallet_sync:(NSString*)forward
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)


RCT_EXTERN_METHOD(wallet_sign_psbt:(NSString*)b64Psbt
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(wallet_brodcast_psbt:(NSString*)b64Psbt
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(decode_consensus_b4_psbt:(NSString*)b64Psbt
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

@end

