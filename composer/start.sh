./fabric-mgr.sh up && \
./card-mgr.sh bootstrap && \
./businessnet-mgr.sh install
if [ $? -eq 0 ]; then
    sleep 15s
    ./businessnet-mgr.sh start && \
    ./businessnet-mgr.sh import && \
    ./rest-mgr.sh start
fi

