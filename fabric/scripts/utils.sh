#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/stockchainz.com/orderers/orderer.stockchainz.com/msp/tlscacerts/tlsca.stockchainz.com-cert.pem
PEER0_MARKET1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/market1.stockchainz.com/peers/peer0.market1.stockchainz.com/tls/ca.crt
PEER0_MARKET2_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/market2.stockchainz.com/peers/peer0.market2.stockchainz.com/tls/ca.crt
PEER0_MARKET3_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/market3.stockchainz.com/peers/peer0.market3.stockchainz.com/tls/ca.crt

# verify the result of the end-to-end test
verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to execute End-2-End Scenario ==========="
    echo
    exit 1
  fi
}

# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  CORE_PEER_LOCALMSPID="OrdererMSP"
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/stockchainz.com/orderers/orderer.stockchainz.com/msp/tlscacerts/tlsca.stockchainz.com-cert.pem
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/stockchainz.com/users/Admin@stockchainz.com/msp
}

setGlobals() {
  PEER=$1
  MARKET=$2
  if [ $MARKET -eq 1 ]; then
    CORE_PEER_LOCALMSPID="Market1MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_MARKET1_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/market1.stockchainz.com/users/Admin@market1.stockchainz.com/msp
    CORE_PEER_ADDRESS=peer0.market1.stockchainz.com:7051
  elif [ $MARKET -eq 2 ]; then
    CORE_PEER_LOCALMSPID="Market2MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_MARKET2_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/market2.stockchainz.com/users/Admin@market2.stockchainz.com/msp
    CORE_PEER_ADDRESS=peer0.market2.stockchainz.com:7051
  elif [ $MARKET -eq 3 ]; then
    CORE_PEER_LOCALMSPID="Market3MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_MARKET3_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/market3.stockchainz.com/users/Admin@market3.stockchainz.com/msp
    CORE_PEER_ADDRESS=peer0.market3.stockchainz.com:7051
  else
    echo "================== ERROR !!! MARKET Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

updateAnchorPeers() {
  PEER=$1
  MARKET=$2
  setGlobals $PEER $MARKET

  set -x
  peer channel update -o orderer.stockchainz.com:7050 -c $CHANNEL_NAME \
    -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep $DELAY
  echo
}

## Sometimes Join takes time hence RETRY at least 5 times
joinChannelWithRetry() {
  PEER=$1
  MARKET=$2
  setGlobals $PEER $MARKET

  set -x
  peer channel join -b $CHANNEL_NAME.block >&log.txt
  res=$?
  set +x
  cat log.txt
  if [ $res -ne 0 -a $COUNTER -lt $MAX_RETRY ]; then
    COUNTER=$(expr $COUNTER + 1)
    echo "peer${PEER}.market${MARKET} failed to join the channel, Retry after $DELAY seconds"
    sleep $DELAY
    joinChannelWithRetry $PEER $MARKET
  else
    COUNTER=1
  fi
  verifyResult $res "After $MAX_RETRY attempts, peer${PEER}.market${MARKET} has failed to join channel '$CHANNEL_NAME' "
}

installChaincode() {
  PEER=$1
  MARKET=$2
  setGlobals $PEER $MARKET
  VERSION=${3:-1.0}

  set -x
  peer chaincode install -n testcc -v ${VERSION} -l ${LANGUAGE} -p ${CC_SRC_PATH} >&log.txt
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode installation on peer${PEER}.market${MARKET} has failed"

  echo "===================== Chaincode is installed on peer${PEER}.market${MARKET} ===================== "
  echo
}

instantiateChaincode() {
  PEER=$1
  MARKET=$2
  setGlobals $PEER $MARKET
  VERSION=${3:-1.0}

  # while 'peer chaincode' command can get the orderer endpoint from the peer
  # (if join was successful), let's supply it directly as we know it using
  # the "-o" option
  set -x
  peer chaincode instantiate -o orderer.stockchainz.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    -C $CHANNEL_NAME -n testcc -l ${LANGUAGE} -v ${VERSION} -c '{"Args":["init","a","100","b","200"]}' \
      -P "OR ('Market1MSP.peer','Market2MSP.peer','Market3MSP.peer')" >&log.txt
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode instantiation on peer${PEER}.market${MARKET} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is instantiated on peer${PEER}.market${MARKET} on channel '$CHANNEL_NAME' ===================== "
  echo
}

upgradeChaincode() {
  PEER=$1
  MARKET=$2
  setGlobals $PEER $MARKET

  set -x
  peer chaincode upgrade -o orderer.stockchainz.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
    -C $CHANNEL_NAME -n testcc -v 2.0 -c '{"Args":["init","a","90","b","210"]}' -P "OR ('Market1MSP.peer','Market2MSP.peer','Market3MSP.peer')"
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode upgrade on peer${PEER}.market${MARKET} has failed"
  echo "===================== Chaincode is upgraded on peer${PEER}.market${MARKET} on channel '$CHANNEL_NAME' ===================== "
  echo
}

# fetchChannelConfig <channel_id> <output_json>
# Writes the current channel config for a given channel to a JSON file
fetchChannelConfig() {
  CHANNEL=$1
  OUTPUT=$2

  setOrdererGlobals

  echo "Fetching the most recent configuration block for the channel"
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel fetch config config_block.pb -o orderer.stockchainz.com:7050 -c $CHANNEL --cafile $ORDERER_CA
    set +x
  else
    set -x
    peer channel fetch config config_block.pb -o orderer.stockchainz.com:7050 -c $CHANNEL --tls --cafile $ORDERER_CA
    set +x
  fi

  echo "Decoding config block to JSON and isolating config to ${OUTPUT}"
  set -x
  configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${OUTPUT}"
  set +x
}

# signConfigtxAsPeerOrg <org> <configtx.pb>
# Set the peerOrg admin of an org and signing the config update
signConfigtxAsPeerOrg() {
  PEERMARKET=$1
  TX=$2
  setGlobals 0 $PEERMARKET
  set -x
  peer channel signconfigtx -f "${TX}"
  set +x
}

# createConfigUpdate <channel_id> <original_config.json> <modified_config.json> <output.pb>
# Takes an original and modified config, and produces the config update tx
# which transitions between the two
createConfigUpdate() {
  CHANNEL=$1
  ORIGINAL=$2
  MODIFIED=$3
  OUTPUT=$4

  set -x
  configtxlator proto_encode --input "${ORIGINAL}" --type common.Config >original_config.pb
  configtxlator proto_encode --input "${MODIFIED}" --type common.Config >modified_config.pb
  configtxlator compute_update --channel_id "${CHANNEL}" --original original_config.pb --updated modified_config.pb >config_update.pb
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
  echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL'", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
  configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${OUTPUT}"
  set +x
}

# parsePeerConnectionParameters $@
# Helper function that takes the parameters from a chaincode operation
# (e.g. invoke, query, instantiate) and checks for an even number of
# peers and associated org, then sets $PEER_CONN_PARAMS and $PEERS
parsePeerConnectionParameters() {
  # check for uneven number of peer and org parameters
  if [ $(($# % 2)) -ne 0 ]; then
    exit 1
  fi

  PEER_CONN_PARAMS=""
  PEERS=""
  while [ "$#" -gt 0 ]; do
    PEER="peer$1.market$2"
    PEERS="$PEERS $PEER"
    PEER_CONN_PARAMS="$PEER_CONN_PARAMS --peerAddresses $PEER.stockchainz.com:7051"
    if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "true" ]; then
      TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER$1_MARKET$2_CA")
      PEER_CONN_PARAMS="$PEER_CONN_PARAMS $TLSINFO"
    fi
    # shift by two to get the next pair of peer/org parameters
    shift
    shift
  done
  # remove leading space for output
  PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"
}

chaincodeQuery() {
  PEER=$1
  MARKET=$2
  setGlobals $PEER $MARKET
  EXPECTED_RESULT=$3
  echo "===================== Querying on peer${PEER}.market${MARKET} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to Query peer${PEER}.market${MARKET} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n testcc -c '{"Args":["query","a"]}' >&log.txt
    res=$?
    set +x
    test $res -eq 0 && VALUE=$(cat log.txt | awk '/Query Result/ {print $NF}')
    test "$VALUE" = "$EXPECTED_RESULT" && let rc=0
    # removed the string "Query Result" from peer chaincode query command
    # result. as a result, have to support both options until the change
    # is merged.
    test $rc -ne 0 && VALUE=$(cat log.txt | egrep '^[0-9]+$')
    test "$VALUE" = "$EXPECTED_RESULT" && let rc=0
  done
  echo
  cat log.txt
  if test $rc -eq 0; then
    echo "===================== Query successful on peer${PEER}.market${MARKET} on channel '$CHANNEL_NAME' ===================== "
  else
    echo "!!!!!!!!!!!!!!! Query result on peer${PEER}.market${MARKET} is INVALID !!!!!!!!!!!!!!!!"
    echo "================== ERROR !!! FAILED to execute End-2-End Scenario =================="
    echo
    exit 1
  fi
}

# chaincodeInvoke <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvoke() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.stockchainz.com:7050 -C $CHANNEL_NAME -n testcc $PEER_CONN_PARMS -c '{"Args":["invoke","a","b","10"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.stockchainz.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n testcc $PEER_CONN_PARMS -c '{"Args":["invoke","a","b","10"]}' >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}
