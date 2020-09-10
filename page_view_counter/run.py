#!/usr/bin/env python3
import subprocess
import os
import sys

cwd = os.path.abspath(os.path.dirname(sys.argv[0]))
nginx_conf_file = os.path.join(cwd, "nginx.conf")
page_view_counter_file = os.path.join(cwd, "fractionator_page_view_counter")

subprocess.run([
    "docker", "run", "-d", "-p", "443:443",
    "-v", "/etc/letsencrypt:/etc/letsencrypt:ro",
    "-v", "{}:/etc/nginx/nginx.conf:ro".format(nginx_conf_file),
    "-v", "{}:/usr/share/nginx/html/fractionator_page_view_counter:ro".format(page_view_counter_file),
    "-v", "/etc/ssl/certs/dhparam.pem:/etc/ssl/certs/dhparam.pem:ro",
    "nginx:latest"
])
