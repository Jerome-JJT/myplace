FROM node:lts-alpine3.20
WORKDIR /app

RUN apk update
RUN apk upgrade
RUN apk add bash vim nano

COPY start.sh /
RUN dos2unix /start.sh

# CMD ["sleep", "infinity"]
CMD ["sh", "/start.sh"]