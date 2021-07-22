#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(Bdk, NSObject)

RCT_EXTERN_METHOD(get_xprvs:(NSString*)network
                  devPath:(NSString*)devPath
                  pass:(NSString*)pass
                  seedWords:(NSString*)seedWords
                  numchild:(nonnull NSNumber*)numChild
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(descriptors_from_xprvs_wpaths_json:(NSString*)xprvs_wpaths_vec_json_str
                  network:(NSString*)network
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)



RCT_EXTERN_METHOD(electrum_wallet_from_cfg:(NSString*)wallet_cfg_json
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get_new_wallet_address:(NSString*)param
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get_wallet_balance:(NSString*)param
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(get_wallet_desc_from_multi_sig_conf:(NSString*)multi_sig_cfg
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(xpubsWPaths_from_xprvsWithPaths:(NSString*)xprvWithPaths
                  network:(NSString*)network
                  withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)

@end
