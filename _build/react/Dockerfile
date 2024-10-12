FROM node:18-alpine

COPY start.sh /
RUN dos2unix /start.sh

# CMD ["sleep", "infinity"]
CMD ["sh", "/start.sh"]