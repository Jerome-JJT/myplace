FROM node:lts-alpine3.20
WORKDIR /app

# RUN apk update
# RUN apk upgrade
RUN apk add bash
# RUN apk add vim nano

RUN apk add python3 pixman-dev cairo-dev pango-dev make g++

COPY start.sh /
RUN dos2unix /start.sh

# CMD ["sleep", "infinity"]
CMD ["sh", "/start.sh"]