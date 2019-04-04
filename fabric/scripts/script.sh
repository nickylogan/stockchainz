#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Stockchainz network end-to-end test"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
VERBOSE="$5"
: ${CHANNEL_NAME:="invchannel"}
: ${DELAY:="3"}
: ${LANGUAGE:="golang"}
: ${TIMEOUT:="10"}
: ${VERBOSE:="false"}
LANGUAGE=$(echo "$LANGUAGE" | tr [:upper:] [:lower:])
COUNTER=1
MAX_RETRY=10

CC_SRC_PATH="github.com/chaincode/"

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
	# Use peer0 of market1
	setGlobals 0 1

	set -x
	peer channel create -o orderer.stockchainz.com:7050 -c $CHANNEL_NAME \
		-f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
	res=$?
	set +x
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

joinChannel() {
	for market in 1 2 3; do
		peer=0
		joinChannelWithRetry $peer $market
		echo "===================== peer${peer}.market${market} joined channel '$CHANNEL_NAME' ===================== "
		sleep $DELAY
		echo
	done
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

## Set the anchor peers for each market in the channel
echo "Updating anchor peers for market1..."
updateAnchorPeers 0 1
echo "Updating anchor peers for market2..."
updateAnchorPeers 0 2
echo "Updating anchor peers for market2..."
updateAnchorPeers 0 3

## Install chaincode on peer0.market1 and peer0.market2
echo "Installing chaincode on peer0.market1..."
installChaincode 0 1
echo "Installing chaincode on peer0.market2..."
installChaincode 0 2

# Instantiate chaincode on peer0.market2
echo "Instantiating chaincode on peer0.market2..."
instantiateChaincode 0 2

# Query chaincode on peer0.market1
echo "Querying chaincode on peer0.market1..."
chaincodeQuery 0 1 100

# Invoke chaincode on peer0.market1 and peer0.market2
echo "Sending invoke transaction on peer0.market1 peer0.market2..."
chaincodeInvoke 0 1 0 2

## Install chaincode on peer0.market3
echo "Installing chaincode on peer0.market3..."
installChaincode 0 3

# Query on chaincode on peer0.market3, check if the result is 90
echo "Querying chaincode on peer1.market2..."
chaincodeQuery 0 3 90

echo
echo "========= All GOOD, stockchainz e2e execution completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
