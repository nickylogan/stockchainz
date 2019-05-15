#!/bin/bash

ENV_FILE=".env"
REST_CONTAINER_IMAGE="stockchainz/composer-rest-server"


function printHelp() {
    echo "Usage: "
    echo "  rest-mgr.sh <mode> [-v <version>]"
    echo "    <mode> - one of 'generate', 'start', 'stop', or 'build'"
    echo "      - 'generate' - generate rest admin identities"
    echo "      - 'start' - bring up the rest server"
    echo "      - 'stop' - bring down the rest server"
    echo "      - 'build' - build the rest server"
    echo "  rest-mgr.sh -h (print this message)"
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

function createRestAdmins() {
    # check if admin cards exist
    for market in 1 2 3; do
        ADMIN_CARD=admin${market}@stockchainz
        if [ -z $(composer card list -q | grep ${ADMIN_CARD}) ]; then
            echo "ERROR !!! Card ${ADMIN_CARD} not found"
            exit 1
        fi
    done
    
    for market in 1 2 3; do
        RESTADMIN_ID="restadmin${market}"
        RESTADMIN_CONNECTION_DIR="$HOME/.composer/cards/${RESTADMIN_ID}@stockchainz"

        composer participant add -c admin${market}@stockchainz \
            -d "{\"\$class\":\"org.hyperledger.composer.system.NetworkAdmin\", \"participantId\":\"${RESTADMIN_ID}\"}"
        if [ $? -ne 0 ]; then
            echo "Error in adding participant ${RESTADMIN_ID}"
            exit 1
        fi

        composer identity issue -c admin${market}@stockchainz -x \
            -f ../cards/${RESTADMIN_ID}.card \
            -u ${RESTADMIN_ID} \
            -a "resource:org.hyperledger.composer.system.NetworkAdmin#${RESTADMIN_ID}"
        if [ $? -ne 0 ]; then
            echo "Error in issuing identity for ${RESTADMIN_ID}"
            exit 1
        fi

        composer card import -f ../cards/${RESTADMIN_ID}.card
        if [ $? -ne 0 ]; then
            echo "Error in importing card ${RESTADMIN_ID}"
            exit 1
        fi

        composer network ping -c ${RESTADMIN_ID}@stockchainz
        if [ $? -ne 0 ]; then
            echo "Error in pinging network card ${RESTADMIN_ID}"
            exit 1
        fi
        
        cp -p ${RESTADMIN_CONNECTION_DIR}/connection.json /tmp/

        sed -i 's/localhost:7050/orderer.stockchainz.com:7050/' /tmp/connection.json
        
        sed -i 's/localhost:7051/peer0.market1.stockchainz.com:7051/' /tmp/connection.json
        sed -i 's/localhost:8051/peer0.market2.stockchainz.com:7051/' /tmp/connection.json
        sed -i 's/localhost:9051/peer0.market3.stockchainz.com:7051/' /tmp/connection.json
        
        sed -i 's/localhost:7054/ca.market1.stockchainz.com:7054/' /tmp/connection.json
        sed -i 's/localhost:8054/ca.market2.stockchainz.com:7054/' /tmp/connection.json
        sed -i 's/localhost:9054/ca.market3.stockchainz.com:7054/' /tmp/connection.json

        cp -p /tmp/connection.json ${RESTADMIN_CONNECTION_DIR}
    done
}


function checkPrereqs() {
    # check if env.txt exists
    if [ ! -f ${ENV_FILE} ]; then
        echo "ERROR !!! ${ENV_FILE} not found"
        exit 1
    fi
}

function build() {
    cd docker-images
    docker build -t ${REST_CONTAINER_IMAGE} .
    res=$?
    cd ..
    if [ $res -ne 0 ]; then
        echo "Error in building rest container"
        exit 1
    fi
}

function start() {
    if [ -z $(composer card list -q | grep "restadmin") ]; then
        createRestAdmins
    fi

    # start docker compose
    docker-compose up -d

    if [ $? -ne 0 ]; then
        echo "Error in spinning up rest server containers"
        exit 1
    fi
}

function stop() {
    docker-compose down

    if [ $? -ne 0 ]; then
        echo "Error in stopping rest server containers"
        exit 1
    fi
}

MODE=$1
shift

if [ "$MODE" == "generate" ]; then
    echo "Generating rest admin identities"
elif [ "$MODE" == "start" ]; then
    echo "Starting rest server"
elif [ "$MODE" == "stop" ]; then
    echo "Stopping rest server"
elif [ "$MODE" == "build" ]; then
    echo "Building DockerFile"
else
    printHelp
    exit 1
fi

while getopts "h?" opt; do
    case "$opt" in
    h | \?)
      printHelp
      exit 0
      ;;
    esac
done

checkPrereqs

if [ "$MODE" == "generate" ]; then
    createRestAdmins
elif [ "$MODE" == "start" ]; then
    start
elif [ "$MODE" == "stop" ]; then
    stop
elif [ "$MODE" == "build" ]; then
    build
else
    printHelp
    exit 1
fi
