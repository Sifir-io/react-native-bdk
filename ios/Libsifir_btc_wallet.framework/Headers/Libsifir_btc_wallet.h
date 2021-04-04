#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include "./sifir-types.h"

typedef enum ResultMessage_Tag {
  Success,
  Error,
} ResultMessage_Tag;

typedef struct ResultMessage {
  ResultMessage_Tag tag;
  union {
    struct {
      char *error;
    };
  };
} ResultMessage;

typedef struct BoxedResult_OwnedTorService {
  OwnedTorService *result;
  struct ResultMessage message;
} BoxedResult_OwnedTorService;

typedef struct BoxedResult_TcpSocksStream {
  TcpSocksStream *result;
  struct ResultMessage message;
} BoxedResult_TcpSocksStream;

#if defined(TOR_DAEMON)
typedef struct Observer {
  void *context;
  void (*on_success)(char*, const void*);
  void (*on_err)(char*, const void*);
} Observer;
#endif

typedef struct BoxedResult_____c_char {
  char **result;
  struct ResultMessage message;
} BoxedResult_____c_char;

typedef struct BoxedResult_ElectrumSledWallet {
  ElectrumSledWallet *result;
  struct ResultMessage message;
} BoxedResult_ElectrumSledWallet;

typedef struct BoxedResult_u64 {
  uint64_t *result;
  struct ResultMessage message;
} BoxedResult_u64;

typedef struct BoxedResult_bool {
  bool *result;
  struct ResultMessage message;
} BoxedResult_bool;

#if defined(TOR_DAEMON)
struct BoxedResult_OwnedTorService *get_owned_TorService(const char *data_dir,
                                                         uint16_t socks_port,
                                                         uint64_t bootstrap_timeout_ms);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Get the status of a OwnedTorService
 */
char *get_status_of_owned_TorService(OwnedTorService *owned_client);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Start a proxied TcpStream
 */
struct BoxedResult_TcpSocksStream *tcp_stream_start(const char *target,
                                                    const char *proxy,
                                                    uint64_t timeout_ms);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Send a Message over a tcpStream
 */
struct ResultMessage *tcp_stream_on_data(TcpSocksStream *stream, struct Observer observer);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Send a Message over a tcpStream
 */
struct ResultMessage *tcp_stream_send_msg(TcpSocksStream *stream,
                                          const char *msg,
                                          uint64_t timeout);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Destroy and release TcpSocksStream which will drop the connection
 */
void tcp_stream_destroy(TcpSocksStream *stream);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Destroy a cstr
 */
void destroy_cstr(char *c_str);
#endif

#if defined(TOR_DAEMON)
/**
 *# Safety
 * Destroy and release ownedTorBox which will shut down owned connection and shutdown daemon
 */
void shutdown_owned_TorService(OwnedTorService *owned_client);
#endif

#if defined(BTC_WALLET)
struct BoxedResult_____c_char *derive_xprvs(const char *network,
                                            const char *derive_path,
                                            const char *password,
                                            const char *seed_phrase,
                                            uintptr_t num_child);
#endif

#if defined(BTC_WALLET)
struct BoxedResult_____c_char *descriptors_from_xprvs_wpaths_vec(const char *vec_xprvs_with_paths_json,
                                                                 const char *network);
#endif

#if defined(BTC_WALLET)
struct BoxedResult_ElectrumSledWallet *electrum_wallet_from_wallet_cfg(const char *wallet_cfg_json);
#endif

#if defined(BTC_WALLET)
struct BoxedResult_u64 *get_electrum_wallet_balance(ElectrumSledWallet *electrum_wallet);
#endif

#if defined(BTC_WALLET)
struct BoxedResult_____c_char *get_electrum_wallet_new_address(ElectrumSledWallet *electrum_wallet);
#endif

#if defined(BTC_WALLET)
struct BoxedResult_bool *sync_electrum_wallet(ElectrumSledWallet *electrum_wallet,
                                              uint32_t max_address_count);
#endif

#if defined(BTC_WALLET)
/**
 * Generates a finalized txn from CreateTxn json
 */
struct BoxedResult_____c_char *create_tx(ElectrumSledWallet *wallet, const char *tx);
#endif

#if defined(BTC_WALLET)
/**
 *# Safety
 * Destroy a cstr
 */
void destroy_cstr(char *c_str);
#endif

#if defined(BTC_WALLET)
void drop_wallet(ElectrumSledWallet *wallet);
#endif
