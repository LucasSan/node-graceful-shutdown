import http from "http";
import { once } from "events";

// curl -X POST —-data '{"nome": "lucas", "age": 33}' localhost:3000
async function handler(req, res) {
  try {
    const data = JSON.parse(await once(req, "data"));
    console.log("received: ", data);
    res.writeHead(200);
    res.end(JSON.stringify(data));

    setTimeout(() => {
      throw new Error("will be handled on uncaught");
    }, 1000);

    await Promise.reject("will be handled on 'catch'");
    Promise.reject("will be handled on unhandledRejection");
  } catch (error) {
    console.error("ERROR:", error.stack);
    res.writeHead(500);
    res.end();
  }
}

const server = http.createServer(handler);
server.listen(3000).on("listening", () => {
  console.log("server running at 3000");
});

// uncaught exceptions
process.on("uncaughtException", (error, origin) => {
  console.log(`${origin} signal received. ${error}`);
});

// uncaught rejections
process.on("unhandledRejection", (error) => {
  console.log(`unhandledRejection signal received. ${error}`);
});

// Graceful shutdown
const gracefulShutdown = (event) => {
  return (code) => {
    console.log(`${event} signal received with ${code}`);
    // close server and database connection
    // user in middle of transaction will be waited to finish it
    server.close(() => {
      console.log("http server closed");
      console.log("DB connection closed");
      process.exit(code);
    });
  };
};

// CTRL + C
process.on("SIGINT", gracefulShutdown("SIGINT"));

// kill pid
process.on("SIGTERM", gracefulShutdown("SIGTERM"));

process.on("exit", (code) => {
  console.log(`process exit with code ${code}`);
});
