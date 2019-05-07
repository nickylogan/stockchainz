#!/bin/bash

export PATH=${PWD}/bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false

function printHelp() {
  echo "Usage: "
  echo "  fabric-mgr.sh <mode> [-v <version>]"
  echo "    <mode> - one of 'up', 'down', 'restart', 'generate' or 'destroy'"
  echo "      - 'up' - bring up the network with docker-compose up"
  echo "      - 'down' - bring down the network with docker-compose down"
  echo "      - 'restart' - restart the network"
  echo "      - 'generate' - generate required certificates and genesis block"
  echo "      - 'destroy' - clear the network with docker-compose down"
  echo "  fabric-mgr.sh -h (print this message)"
}

function askProceed() {
  read -p "Continue? [Y/n] " ans
  case "$ans" in
  y | Y | "")
    echo "proceeding ..."
    ;;
  n | N)
    echo "exiting..."
    exit 1
    ;;
  *)
    echo "invalid response"
    askProceed
    ;;
  esac
}

function clearContainers() {
  CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /dev-peer.*.testcc.*/) {print $1}')
  if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f $CONTAINER_IDS
  fi
}

function removeUnwantedImages() {
  DOCKER_IMAGE_IDS=$(docker images | awk '($1 ~ /dev-peer.*.testcc.*/) {print $3}')
  if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" == " " ]; then
    echo "---- No images available for deletion ----"
  else
    docker rmi -f $DOCKER_IMAGE_IDS
  fi
}

function networkUp() {
  # generate artifacts if they don't exist
  if [ ! -d "crypto-config" ]; then
    generateCerts
    replacePrivateKey
    generateChannelArtifacts
  fi

  IMAGE_TAG=$IMAGETAG docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_CAS -f $COMPOSE_FILE_COUCH up -d 2>&1
  
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Unable to start network"
    exit 1
  fi

  # now run the end to end script
  docker exec cli scripts/script.sh $CHANNEL_NAME $CLI_DELAY $LANGUAGE $CLI_TIMEOUT $VERBOSE
  if [ $? -ne 0 ]; then
    echo "ERROR !!!! Test failed"
    exit 1
  fi
}

function networkDown() {
  IMAGE_TAG=$IMAGETAG docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_COUCH down --volumes --remove-orphans

  if [ -f ${COMPOSE_FILE_CAS} ]; then
    docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_CAS down --volumes
  fi

  # Don't remove the generated artifacts -- note, the ledgers are always removed
  if [ "$MODE" != "restart" ]; then
    # Bring down the network, deleting the volumes
    #Delete any ledger backups
    docker run -v $PWD:/tmp/first-network --rm hyperledger/fabric-tools:$IMAGETAG rm -Rf /tmp/first-network/ledgers-backup
    #Cleanup the chaincode containers
    clearContainers
    #Cleanup images
    removeUnwantedImages
    # remove orderer block and other channel configuration transactions and certs
    rm -rf channel-artifacts/*.block channel-artifacts/*.tx crypto-config ./org3-artifacts/crypto-config/ channel-artifacts/org3.json
    # remove the docker-compose yaml file that was customized to the example
    rm -f docker-compose-e2e.yaml
    rm -f docker-compose-cas.yaml
  fi
}

function replacePrivateKey() {
  # Copy the template to the file that will be modified to add the private key
  cp docker-compose-e2e-template.yaml docker-compose-e2e.yaml
  cp docker-compose-cas-template.yaml docker-compose-cas.yaml

  # The next steps will replace the template's contents with the
  # actual values of the private key file names for the two CAs.
  CURRENT_DIR=$PWD
  cd crypto-config/peerOrganizations/market1.stockchainz.com/ca/
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR"
  sed -i "s/CA1_PRIVATE_KEY/${PRIV_KEY}/g" docker-compose-e2e.yaml docker-compose-cas.yaml

  cd crypto-config/peerOrganizations/market2.stockchainz.com/ca/
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR"
  sed -i "s/CA2_PRIVATE_KEY/${PRIV_KEY}/g" docker-compose-e2e.yaml docker-compose-cas.yaml

  cd crypto-config/peerOrganizations/market3.stockchainz.com/ca/
  PRIV_KEY=$(ls *_sk)
  cd "$CURRENT_DIR"
  sed -i "s/CA3_PRIVATE_KEY/${PRIV_KEY}/g" docker-compose-e2e.yaml docker-compose-cas.yaml
}

function generateCerts() {
  which cryptogen
  if [ "$?" -ne 0 ]; then
    echo "cryptogen tool not found. exiting"
    exit 1
  fi
  echo
  echo "##########################################################"
  echo "##### Generate certificates using cryptogen tool #########"
  echo "##########################################################"

  if [ -d "crypto-config" ]; then
    rm -Rf crypto-config
  fi
  set -x
  cryptogen generate --config=./crypto-config.yaml
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate certificates..."
    exit 1
  fi
  echo
}

function generateChannelArtifacts() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    echo "configtxgen tool not found. exiting"
    exit 1
  fi

  echo "##########################################################"
  echo "#########  Generating Orderer Genesis block ##############"
  echo "##########################################################"
  
  set -x
  configtxgen -profile StockchainzOrdererGenesis \
    -outputBlock ./channel-artifacts/genesis.block
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate orderer genesis block..."
    exit 1
  fi
  echo
  echo "#################################################################"
  echo "### Generating channel configuration transaction 'channel.tx' ###"
  echo "#################################################################"
  set -x
  configtxgen -profile StockchainzChannel -outputCreateChannelTx \
    ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate channel configuration transaction..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for Market1MSP   #######"
  echo "#################################################################"
  set -x
  configtxgen -profile StockchainzChannel -outputAnchorPeersUpdate \
    ./channel-artifacts/Market1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Market1MSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for Market1MSP..."
    exit 1
  fi

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for Market2MSP   #######"
  echo "#################################################################"
  set -x
  configtxgen -profile StockchainzChannel -outputAnchorPeersUpdate \
    ./channel-artifacts/Market2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Market2MSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for Market2MSP..."
    exit 1
  fi
  echo

  echo
  echo "#################################################################"
  echo "#######    Generating anchor peer update for Market3MSP   #######"
  echo "#################################################################"
  set -x
  configtxgen -profile StockchainzChannel -outputAnchorPeersUpdate \
    ./channel-artifacts/Market3MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Market3MSP
  res=$?
  set +x
  if [ $res -ne 0 ]; then
    echo "Failed to generate anchor peer update for Market3MSP..."
    exit 1
  fi
  echo
}

function networkStop() {
  docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_COUCH -f $COMPOSE_FILE_CAS stop
}

function networkStart() {
  docker-compose -f $COMPOSE_FILE -f $COMPOSE_FILE_COUCH -f $COMPOSE_FILE_CAS start
}



# timeout duration - the duration the CLI should wait for a response from
# another container before giving up
CLI_TIMEOUT=10
# default for delay between commands
CLI_DELAY=3
# channel name defaults to "invchannel"
CHANNEL_NAME="invchannel"
# use this as the default docker-compose yaml definition
COMPOSE_FILE=docker-compose-cli.yaml
#
COMPOSE_FILE_COUCH=docker-compose-couch.yaml

COMPOSE_FILE_CAS=docker-compose-cas.yaml

# use golang as the default language for chaincode
LANGUAGE=golang
# default image tag
IMAGETAG="latest"
# default consensus type
CONSENSUS_TYPE="solo"

# Parse commandline args
if [ "$1" = "-m" ]; then # supports old usage, muscle memory is powerful!
  shift
fi
MODE=$1
shift

# Determine whether starting, stopping, restarting, generating or upgrading
if [ "$MODE" == "up" ]; then
  EXPMODE="Starting"
elif [ "$MODE" == "down" ]; then
  EXPMODE="Stopping"
elif [ "$MODE" == "restart" ]; then
  EXPMODE="Restarting"
elif [ "$MODE" == "destroy" ]; then
  EXPMODE="Destroying network"
elif [ "$MODE" == "generate" ]; then
  EXPMODE="Generating certs and genesis block"
elif [ "${MODE}" == "stop" ]; then # ie docker-compose stop
  EXPMODE="Stopping but preserving container state"
elif [ "${MODE}" == "start" ]; then # ie docker-compose start
  EXPMODE="Starting from previous stopped container state"
else
  printHelp
  exit 1
fi

while getopts "h?v" opt; do
  case "$opt" in
  h | \?)
    printHelp
    exit 0
    ;;
  v)
    VERBOSE=true
    ;;
  esac
done

# Announce what was requested

echo "${EXPMODE} for channel '${CHANNEL_NAME}' with CLI timeout of '${CLI_TIMEOUT}' seconds and CLI delay of '${CLI_DELAY}' seconds and using database 'couchdb', and using Fabric CAs"

# Ask for confirmation to proceed
askProceed

# Create the network using docker compose
if [ "${MODE}" == "up" ]; then
  networkUp
elif [ "${MODE}" == "down" ]; then ## Clear the network
  networkDown
elif [ "${MODE}" == "restart" ]; then ## Restart the network
  networkDown
  networkUp
elif [ "${MODE}" == "destroy" ]; then ## Restart the network
  networkDestroy
elif [ "${MODE}" == "generate" ]; then ## Generate Artifacts
  generateCerts
  replacePrivateKey
  generateChannelArtifacts
elif [ "${MODE}" == "stop" ]; then # do docker-compose stop
  networkStop
elif [ "${MODE}" == "start" ]; then # do docker-compose start
  networkStart
else
  printHelp
  exit 1
fi
