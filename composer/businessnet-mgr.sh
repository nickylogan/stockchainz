#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BNA_DIR="${DIR}"/../business-network/dist

NET_NAME=stockchainz
VERSION=$( node -p -e "require('../business-network/package.json').version" )

function printHelp() {
    echo "Usage: "
    echo "  businessnet-mgr.sh <mode>"
    echo "    <mode> - one of 'install', 'start'"
    echo "      - 'install' - installs the business network archive"
    echo "      - 'start' - spins up the business network"
    echo
    echo "  businessnet-mgr.sh -h (print this message)"
}

function install() {
    for market in 1 2 3; do
        CARD_NAME=PeerAdmin@stockchainz-market${market}
        set -x
        composer network install -c ${CARD_NAME} -a ${BNA_DIR}/${NET_NAME}.bna
        res=$?
        set +x
        if [ $res -ne 0 ]; then
            echo "Error installing network archive on market ${market}. Exiting..."
            exit 1
        fi
    done

    set -x
    composer network upgrade -c PeerAdmin@stockchainz-market1 -n ${NET_NAME} -V ${VERSION}
    res=$?
    set +x
    if [ $res -ne 0 ]; then
        echo "Error upgrading network ${NET_NAME} to version ${VERSION}. Exiting..."
        exit 1
    fi
}

function start() {
    for market in 1 2 3; do
        CARD_NAME=PeerAdmin@stockchainz-market${market}
        echo "Requesting identity of ${CARD_NAME}"
        set -x
        composer identity request -c ${CARD_NAME} -u admin -s adminpw -d "${DIR}"/identities/admin${market}
        res=$?
        set +x
        if [ $res -ne 0 ]; then
            echo "Error requesting identities of ${CARD_NAME}. Exiting..."
            exit 1
        fi
        echo "Succesfully retrieved ${CARD_NAME}'s identity'"
    done

    echo "Starting network..."
    set -x
    composer network start -c PeerAdmin@stockchainz-market1 -n ${NET_NAME} -V ${VERSION} \
    -o endorsementPolicyFile="${DIR}"/endorsement-policy.json \
    -A admin1 -C "${DIR}"/identities/admin1/admin-pub.pem \
    -A admin2 -C "${DIR}"/identities/admin2/admin-pub.pem \
    -A admin3 -C "${DIR}"/identities/admin3/admin-pub.pem
    res=$?
    set +x
    if [ $res -ne 0 ]; then
        echo "Error in starting network..."
        exit 1
    fi
    echo "Network started"

    for market in 1 2 3; do
        echo "Creating card for admin${market}"
        set -x
        composer card create -p "${DIR}/connection-market${market}.json" -u admin${market} -n ${NET_NAME} \
        -c "${DIR}"/identities/admin${market}/admin-pub.pem \
        -k "${DIR}"/identities/admin${market}/admin-priv.pem \
        -f "${DIR}"/cards/admin${market}@${NET_NAME}.card
        res=$?
        set +x
        if [ $res -ne 0 ]; then
            echo "Error creating card of admin${market}. Exiting..."
            exit 1
        fi
        
        echo "Importing card for admin${market}"
        set -x
        composer card import -f "${DIR}"/cards/admin${market}@${NET_NAME}.card
        res=$?
        set +x
        if [ $res -ne 0 ]; then
            echo "Error importing card of admin${market}. Exiting..."
            exit 1
        fi
        
        echo "Pinging card for admin${market}"
        composer network ping -c admin${market}@${NET_NAME}
        res=$?
        if [ $res -ne 0 ]; then
            echo "Error pinging card of admin${market}. Exiting..."
            exit 1
        fi
    done
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

    # Check if peer admin cards are installed
    for market in 1 2 3; do
        CARD_NAME=PeerAdmin@stockchainz-market${market}
        if ! composer card list -c ${CARD_NAME} >/dev/null; then
            echo "Error: card ${CARD_NAME} not found"
            exit 1
        fi
    done
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


if [ "$MODE" == "install" ]; then
    checkPrereqs
    install
elif [ "$MODE" == "start" ]; then
    checkPrereqs
    start
else
    printHelp
    exit 1
fi
