# Rockset shortlinks

## A small Redis-based URL Redirector

Forked from: https://github.com/Detry322/redisred

Redisred is released under the MIT license. Heavily reduced and restyled for Rockset use.

## How to get up and running

1. Make sure you have `redis`, `node`, and `npm` installed.
2. Run `npm install`.
3. (Optional) Set the `PORT` and `REDIS_URL` environment variables.

## How to run the app locally

To start:

1. `npm run start-redis`
2. `npm start`

To stop:
1. `Ctrl+C` to stop `npm start`
2. `npm run stop-redis`
