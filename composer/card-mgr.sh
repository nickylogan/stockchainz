#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function printHelp() {
    echo "Usage: "
    echo "  card-mgr.sh <mode>"
    echo "    <mode> - one of 'bootstrap', 'generate', 'clear'"
    echo "      - 'bootstrap' - generate and import network cards"
    echo "      - 'generate' - generate required connection profiles and network cards"
    echo "      - 'clear' - clears all previously created network cards and connection profiles"
    echo "  card-mgr.sh -h (print this message)"
}

function createConnectionProfile() {
    MARKET=$1
    echo "+-----------------------------------------------------------+"
    echo "|          Creating connection profile for market${MARKET}          |"
    echo "+-----------------------------------------------------------+"
    CONNECTION_PROFILE=connection-market${MARKET}.json
    cp connection.template.json $CONNECTION_PROFILE

    CURRENT_DIR=$PWD
    
    for m in 1 2 3; do
        cd "${DIR}"/fabric/crypto-config/peerOrganizations/market${m}.stockchainz.com/peers/peer0.market${m}.stockchainz.com/tls
        CERT=$(awk 'NF {sub(/\r/, ""); printf "%s\\\\n",$0;}' ca.crt)
        cd "$CURRENT_DIR"
        sed -i "s|INSERT_MARKET${m}_CA_CERT|${CERT}|g" $CONNECTION_PROFILE
        
        cd "${DIR}"/fabric/crypto-config/peerOrganizations/market${m}.stockchainz.com/ca/
        CERT=$(awk 'NF {sub(/\r/, ""); printf "%s\\\\n",$0;}' *.pem)
        cd "$CURRENT_DIR"
        sed -i "s|INSERT_CA${m}_CA_CERT|${CERT}|g" $CONNECTION_PROFILE
    done

    cd "${DIR}"/fabric/crypto-config/ordererOrganizations/stockchainz.com/orderers/orderer.stockchainz.com/tls
    CERT=$(awk 'NF {sub(/\r/, ""); printf "%s\\\\n",$0;}' ca.crt)
    cd "$CURRENT_DIR"
    sed -i "s|INSERT_ORDERER_CA_CERT|${CERT}|g" $CONNECTION_PROFILE

    sed -i "s/INSERT_MARKET_NAME/Market${MARKET}/g" $CONNECTION_PROFILE

    echo "==== Connection profile for market${MARKET} successfully created ===="
    echo
}

function createCard() {
    MARKET=$1
    CONNECTION_PROFILE=connection-market${MARKET}.json

    MSP_DIR="${DIR}"/fabric/crypto-config/peerOrganizations/market${MARKET}.stockchainz.com/users/Admin@market${MARKET}.stockchainz.com/msp
    CERT="${MSP_DIR}"/signcerts/A*.pem
    PRIV_KEY="${MSP_DIR}"/keystore/*_sk

    CARD_NAME=PeerAdmin@stockchainz-market${MARKET}

    mkdir -p "${DIR}"/cards

    echo "+-----------------------------------------------------------+"
    echo "|        Creating PeerAdmin@stockchainz-market${MARKET} card        |"
    echo "+-----------------------------------------------------------+"
    echo
    composer card create -p $CONNECTION_PROFILE -u PeerAdmin -c $CERT -k $PRIV_KEY \
        -r PeerAdmin -r ChannelAdmin -f "${DIR}"/cards/${CARD_NAME}.card
    res=$?
    if [ $res -ne 0 ]; then
        echo "Failed to generate card ${CARD_NAME}..."
        exit 1
    fi
    echo "====== PeerAdmin@stockchainz-market${MARKET}.card successfully created ======"
    echo
}

function import() {
    MARKET=$1
    CARD_NAME=PeerAdmin@stockchainz-market${MARKET}

    echo "+-----------------------------------------------------------+"
    echo "|       Importing PeerAdmin@stockchainz-market${MARKET} card        |"
    echo "+-----------------------------------------------------------+"
    echo
    composer card import -f "${DIR}"/cards/${CARD_NAME}.card --card ${CARD_NAME}
    res=$?
    if [ $res -ne 0 ]; then
        echo "Failed to import card ${CARD_NAME}..."
        exit 1
    fi
    echo "====== PeerAdmin@stockchainz-market${MARKET}.card successfully imported ====="
    echo
}

function checkPrereqs() {
    # check that the composer command exists at a version >v0.16
    COMPOSER_VERSION=$(composer --version 2>/dev/null)
    COMPOSER_RC=$?

    if [ $COMPOSER_RC -eq 0 ]; then
        AWKRET=$(echo $COMPOSER_VERSION | awk -F. '{if ($2<20) print "1"; else print "0";}')
        if [ $AWKRET -eq 1 ]; then
            echo Cannot use $COMPOSER_VERSION version of composer with fabric 1.2, v0.20 or higher is required
            exit 1
        else
            echo Using composer-cli at $COMPOSER_VERSION
        fi
    else
        echo 'No version of composer-cli has been detected, you need to install composer-cli at v0.20 or higher'
        exit 1
    fi
}

function generate() {
    if [ ! -d "${DIR}"/fabric/crypto-config ]; then
        echo "crypto-config not found. Run './fabric-mgr.sh generate' first"
        exit 1
    fi

    for market in 1 2 3; do
        createConnectionProfile $market
        createCard $market
    done

    echo
    echo "====== PeerAdmin cards successfully created  ======"
}

function bootstrap() {
    if [ $(ls -1 ./cards/ 2>/dev/null | wc -l) -eq 0 ]; then
        generate
    fi

    for m in 1 2 3; do
        import $m
    done

    echo
    echo "====== PeerAdmin cards successfully imported  ======"
}

function clear() {
    composer card list -q | while read -r card; do
        composer card delete -c $card
        res=$?
        if [ $res -ne 0 ]; then
            echo "Failed to delete card ${CARD_NAME}..."
            exit 1
        fi
    done

    if [ -d "${DIR}/cards" ]; then
        find "${DIR}"/cards -type f -name 'PeerAdmin*.card' -delete
        find "${DIR}"/cards -type f -name 'admin*.card' -delete
        find "${DIR}"/cards -type f -name 'restadmin*.card' -delete
    fi

    find ${DIR} -type f -name 'connection-*.json' -delete

    echo
    echo "============ PeerAdmin cards successfully cleared ============="
}

MODE=$1
shift

while getopts "h?" opt; do
    case "$opt" in
    h | \?)
        printHelp
        exit 0
        ;;
    esac
done

checkPrereqs

if [ "$MODE" == "bootstrap" ]; then
    bootstrap
elif [ "$MODE" == "generate" ]; then
    generate
elif [ "$MODE" == "clear" ]; then
    clear
else
    printHelp
    exit 1
fi
