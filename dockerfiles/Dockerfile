# build stage
FROM  docker.io/node:16 AS build
ARG TARGET

COPY . /root
WORKDIR /root

RUN yarn install
RUN yarn build:${TARGET}
# RUN yarn deploy:k3s:commit

# final stage
FROM  docker.io/node:16

COPY --from=build /root/build /opt/friday
COPY --from=build /root/.env /opt/friday/.env

WORKDIR /opt/friday

CMD node standalone.js
