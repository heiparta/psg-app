FROM nodesource/trusty:0.12.4

COPY . /app

RUN cd /app; npm install; npm install -g nodemon

RUN cd /app; ./node_modules/.bin/gulp js

EXPOSE 8000

WORKDIR /app
CMD ["nodemon", "server.js"]

