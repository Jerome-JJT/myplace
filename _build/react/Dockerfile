FROM node:lts-alpine3.20

COPY start.sh /
RUN dos2unix /start.sh

# CMD ["sleep", "infinity"]
CMD ["sh", "/start.sh"]