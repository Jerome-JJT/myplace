
APP_NAME	= place

COMPOSE_BASE		= -f ./docker-compose.yml
COMPOSE_DEV		= -f ./docker-compose.yml #-f ./docker-compose.dev.yml
COMPOSE_PROD	= -f ./docker-compose.yml -f ./docker-compose.override.yml

#Dev
DOCKER		= docker compose ${COMPOSE_DEV} -p ${APP_NAME}_dev


#Prod
# DOCKER		= docker compose ${COMPOSE_PROD} -p ${APP_NAME}

all:		start

build:
			${DOCKER} build

testenv:
		@echo $(hostname)
		@echo ${DOCKER}

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

logspostg:
			${DOCKER} logs db
logsf:
			${DOCKER} logs flyway
logsnginx:
			${DOCKER} logs nginx

flogsfront:
			${DOCKER} logs --tail 40 -ft front
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
runapi:
			${DOCKER} exec api bash
runfront:
			${DOCKER} exec front sh
runback:
			${DOCKER} exec back bash
runpostg:
			${DOCKER} exec postgres bash
rundb:
			${DOCKER} exec db psql --host=db --dbname=test_db --username=user -W
db: rundb




down:
			${DOCKER} down

clean:		down
					${DOCKER} down --volumes

re:			
					${MAKE} clean 
					${MAKE} all
					sleep 4
					${MAKE} migrate


.PHONY:		all build start ps logs flogs run api down clean re
