FROM mcr.microsoft.com/playwright:v1.64.1-noble

COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
# setting ENTRYPOINT resets the CMD inherited from the base image.
CMD ["/bin/bash"]
