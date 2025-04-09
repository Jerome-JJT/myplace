include .env

APP_NAME	= place

COMPOSE_BASE		= -f ./docker-compose.yml
COMPOSE_DEV		= -f ./docker-compose.yml -f ./docker-compose.dev.yml
COMPOSE_PROD	= -f ./docker-compose.yml -f ./docker-compose.override.yml

#Dev
DOCKER		= docker compose ${COMPOSE_DEV} -p ${APP_NAME}_dev


#Prod
# DOCKER		= docker compose ${COMPOSE_PROD} -p ${APP_NAME}

ifeq ($(shell [ -e ./.prod ] && echo 1), 1)
	DOCKER		= docker compose ${COMPOSE_PROD} -p ${APP_NAME}
endif

all:		start

build:
			${DOCKER} build

start:
			${DOCKER} up -d --build


ps:
			${DOCKER} ps -a

logs:
			${DOCKER} logs
flogs:
			${DOCKER} logs --tail 40 -ft

logsfront:
			${DOCKER} logs front
logsback:
			${DOCKER} logs back
logspostg:
			${DOCKER} logs db
logsf:
			${DOCKER} logs flyway
logsnginx:
			${DOCKER} logs nginx

flogsfront:
			${DOCKER} logs --tail 40 -ft front
flogsback:
			${DOCKER} logs --tail 40 -ft back
flogspostg:
			${DOCKER} logs --tail 40 -ft db
flogsnginx:
			${DOCKER} logs --tail 40 -ft nginx

refront:
			${DOCKER} restart front
reback:
			${DOCKER} restart back
repostg:
			${DOCKER} restart db

runf:
			${DOCKER} exec flyway bash
runredis:
			${DOCKER} exec cache redis-cli --askpass
			@# -a password
			@# FLUSHALL
			@# KEYS *
			@# DBSIZE
runfront:
			${DOCKER} exec front sh
runback:
			${DOCKER} exec back bash
runpostg:
			${DOCKER} exec db bash
rundb:
			${DOCKER} exec db psql --host=db --dbname=${DATABASE_DB} --username=${DATABASE_USERNAME} -W
db: rundb




down:
			${DOCKER} down

clean:		down
					${DOCKER} down --volumes

re:			
					${MAKE} clean 
					${MAKE} all


stats:
			\wc -l front/src/*.tsx front/src/*/*.tsx front/src/*/*.ts
			\wc -l back/src/*.ts


.PHONY:		all build start ps logs flogs run api down clean re
