# Forto Prep

A quick TS node server with REST API & Events Queue!

## Improvements?

Note that the RabbitMQ logic could be implemented using serverless architecture instead of being integrated into the Express server.

## /users (GET, POST)

A placeholder REST endpoint which queries the MongoDB, and returns the users.

- Open: `http://localhost:3000/users`
- Adding a new user:
  - `curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"name":"Barlas", "age":30}'`
 
## /queue (POST)

A placeholder RPC endpoint which consumes and publishes events through RabbitMQ.

- Example operation:
  - `curl -X POST http://localhost:3000/queue -H "Content-Type: application/json" -d '{"num": 5}'`

## Development

- `npm i`
- `npm start`
- `npm test`
