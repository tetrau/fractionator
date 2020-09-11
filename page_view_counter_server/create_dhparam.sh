#!/bin/bash

cd /etc/ssl/certs
openssl dhparam -out dhparam.pem 4096