# Stockchainz

This implementation shows how inventory management can be done on a blockchain using Hyperledger Composer and Fabric.

A group marketplaces agreed to share merchants' inventory data, so that the item count is synced up acrossed the network. To achieve this, they decided to create a blockchain network tracking inventory data. Common inventory transactions are recorded and spread throughout the network.

## Getting Started

### Prerequisites

#### VirtualBox

Download and install VirtualBox from [here](https://www.virtualbox.org/wiki).

#### Vagrant

Download and install Vagrant from [here](https://www.vagrantup.com).

#### `vagrant-disksize`

[`vagrant-disksize`](https://github.com/sprotheroe/vagrant-disksize/) is a plugin to easily resize the VM's disksize via Vagrant (make sure that Vagrant is already installed beforehand). Run the command below to install the plugin:

```sh
vagrant plugin install vagrant-disksize
```

### Setting up

#### Booting up the VM

All of the other dependencies are already provisioned in the vagrant configuration. Boot up the machine by running the following command in this directory:

```sh
vagrant up
```

SSH into the machine by running:

```sh
> vagrant ssh
...
vagrant@ubuntu-xenial:~$ _
```

#### Configuring the REST server

Change directory into `rest-server`. Inside, you should see a directory called `docker-images`. Build the container first by running:

```sh
./rest-mgr.sh build
```

You can safely ignore `npm ERR` or `WARN` messages. In its internals, the bash script builds the provided `Dockerfile` in the `rest-server/docker-images` directory.

Inside this directory, you should see a file called `.env.example`. Duplicate the file and rename it to `.env`. The file should look something like this:

```sh
COMPOSE_PROJECT_NAME=net
GOOGLE_OAUTH_CLIENTID1=
GOOGLE_OAUTH_SECRET1=
GOOGLE_OAUTH_CLIENTID2=
GOOGLE_OAUTH_SECRET2=
GOOGLE_OAUTH_CLIENTID3=
GOOGLE_OAUTH_SECRET3=
SUCCESS_REDIRECT_URL1=/
FAILURE_REDIRECT_URL1=/
SUCCESS_REDIRECT_URL2=/
FAILURE_REDIRECT_URL2=/
SUCCESS_REDIRECT_URL3=/
FAILURE_REDIRECT_URL3=/
```

As you can see, there are `GOOGLE_OAUTH_*`  variables. Set this using your own Google OAuthv2 client id and secret (create **three** client IDs). You can read about the details [here](https://hyperledger.github.io/composer/latest/tutorials/google_oauth2_rest)

##### *Market1*

```sh
Authorized JavaScript origins:

* http://localhost:3000
* http://api-market1-stockchainz.serveo.net

Authorized Redirect URIs:

* http://localhost:3000/auth/google
* http://localhost:3000/auth/google/callback
* http://api-market1-stockchainz.serveo.net/auth/google
* http://api-market1-stockchainz.serveo.net/auth/google/callback
```

##### *Market2*

```sh
Authorized JavaScript origins:

* http://localhost:4000
* http://api-market2-stockchainz.serveo.net

Authorized Redirect URIs:

* http://localhost:4000/auth/google
* http://localhost:4000/auth/google/callback
* http://api-market2-stockchainz.serveo.net/auth/google
* http://api-market2-stockchainz.serveo.net/auth/google/callback
```

##### *Market3*

```sh
Authorized JavaScript origins:

* http://localhost:5000
* http://api-market2-stockchainz.serveo.net

Authorized Redirect URIs:

* http://localhost:5000/auth/google
* http://localhost:5000/auth/google/callback
* http://api-market3-stockchainz.serveo.net/auth/google
* http://api-market3-stockchainz.serveo.net/auth/google/callback
``` 

Replace the variables in `.env`, so that it looks like the following:

```sh
COMPOSE_PROJECT_NAME=net
# Replace with your OAuth client id and secrets
GOOGLE_OAUTH_CLIENTID1=XXXXX
GOOGLE_OAUTH_SECRET1=XXXXX
GOOGLE_OAUTH_CLIENTID2=XXXXX
GOOGLE_OAUTH_SECRET2=XXXXX
GOOGLE_OAUTH_CLIENTID3=XXXXX
GOOGLE_OAUTH_SECRET3=XXXXX

SUCCESS_REDIRECT_URL1=https://stockchainz.github.io/market1-app/
FAILURE_REDIRECT_URL1=https://stockchainz.github.io/market1-app/
SUCCESS_REDIRECT_URL2=https://stockchainz.github.io/market2-app/
FAILURE_REDIRECT_URL2=https://stockchainz.github.io/market2-app/
SUCCESS_REDIRECT_URL3=https://stockchainz.github.io/market3-app/
FAILURE_REDIRECT_URL3=https://stockchainz.github.io/market3-app/
```

#### Spinning up the network

Start the whole network by executing `start.sh`:

```sh
$ ./start.sh
...
@@@@@ SET UP FINISHED @@@@@
```

#### Playing with the web app

The live version of the web app can be accessed on these links:

* `https://stockchainz.github.io/market1-app/`
* `https://stockchainz.github.io/market2-app/`
* `https://stockchainz.github.io/market3-app/`

If you are to access it, you should see a "Cannot connect to server" message. This is because the API can't be accessed by the web app. To open the API endpoints publicly, do the following commands in six different terminals:

* `ssh -R api-market1-stockchainz:80:localhost:3000 serveo.net`
* `ssh -R account-market1-stockchainz:80:localhost:3005 serveo.net`
* `ssh -R api-market2-stockchainz:80:localhost:4000 serveo.net`
* `ssh -R account-market2-stockchainz:80:localhost:4005 serveo.net`
* `ssh -R api-market3-stockchainz:80:localhost:5000 serveo.net`
* `ssh -R account-market3-stockchainz:80:localhost:5005 serveo.net`

Once all of them are ready, you can access the web apps through the provided links.

**IMPORTANT:** The SSH session will be terminated if no requests are being received. If you need to access the API again, simply restart the relevant command.


#### Stopping the network

The network can be torn down by running the script `./stop.sh` in the `composer` directory:

```sh
$ ./stop.sh
...
@@@@@ TEAR DOWN FINISHED @@@@@
```


## Running the tests

There are three automated tests, one of which is automatically done when the Fabric infrastructure is built.

**IMPORTANT:** The following tests require [Node](https://nodejs.org/en/) to be installed on the machine. The testing environment ***MUST*** be either Linux or Mac OS.

### Testing the Hyperledger Composer business network

Change directory into the `business-network` directory. Install npm dependencies by running the following command:

```sh
npm install
```

**IMPORTANT:** The npm dependencies require a Linux/Mac OS environment

Once installed, run tests by executing

```sh
npm test
```

### Testing the REST API

For this test, the Fabric network must be already up and running. It is best that the blockchain network is still clean slate.

Create four test Google accounts. Each of these corresponds with four different participants of the blockchain network.

Change directory into the `rest-server` directory. Install npm dependencies first by running:

```sh
npm install
```

**IMPORTANT:** If the REST containers are running, stop them first by executing the following command. Note that everytime the `.env` file changes, the REST containers must be restarted.

```sh
./rest-mgr.sh stop
```

After following the instructions in ***"Configuring the REST Server"*** above, a `.env` file is produced. For testing, replace the values of `*_REDIRECT_URL*` with `/` (change them back to the original values once the test is done).

Start up the REST containers by running:

```sh
./rest-mgr.sh start
```

#### Access tokens

Inside `rest-server/test` there is a `.env.example` file. Duplicate the file and rename it to `.env`.

Wait for a few minutes and access the following URLs in the browser:

* `http://localhost:3000/auth/google`
* `http://localhost:4000/auth/google`
* `http://localhost:5000/auth/google`

Log in with one of the previously created Google account. You will be redirected to `/explorer` in the browser. Show the access token and copy it into the `.env` file in the `test` directory. Replace the values of variables `SELLER1_TOKEN1`, `SELLER1_TOKEN2`, and `SELLER1_TOKEN3` with the tokens obtained from `:3000`, `:4000`, and `:5000` respectively.

Clear the browser session and log in with the other accounts. Do the same thing for other `*_TOKEN*` variables.

#### Test

From the `rest-server` directory, run the following command to execute the tests:

```sh
npm test
```

