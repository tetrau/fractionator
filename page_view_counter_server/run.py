#!/usr/bin/env python3
import subprocess
import os
import sys

hostname = sys.argv[1]
cwd = os.path.abspath(os.path.dirname(sys.argv[0]))
nginx_conf_file = os.path.join(cwd, "nginx.conf")
final_nginx_conf_file = os.path.join(cwd, "nginx.{}.conf".format(hostname))
page_view_counter_file = os.path.join(cwd, "fractionator_page_view_counter")

with open(nginx_conf_file, "r") as nginx_conf_fh:
    with open(final_nginx_conf_file, "w+") as final_nginx_conf_fh:
        final_nginx_conf_fh.write(
            nginx_conf_fh.read()
            .replace("%REACT_APP_PAGE_VIEW_COUNT_HOSTNAME%", hostname)
        )

subprocess.run([
    "docker", "run", "-d", "-p", "443:443",
    "-v", "/etc/letsencrypt:/etc/letsencrypt:ro",
    "-v", "{}:/etc/nginx/nginx.conf:ro".format(final_nginx_conf_file),
    "-v", "{}:/usr/share/nginx/html/fractionator_page_view_counter:ro".format(page_view_counter_file),
    "-v", "/etc/ssl/certs/dhparam.pem:/etc/ssl/certs/dhparam.pem:ro",
    "nginx:latest"
])
