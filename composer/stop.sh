./fabric-mgr.sh destroy && \
./card-mgr.sh clear && \
./rest-mgr.sh stop && \
docker rm $(docker ps -aq)

echo "@@@@@ TEAR DOWN FINISHED @@@@@"