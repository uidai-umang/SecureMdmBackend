const { getAuthClient } = require("./auth");

async function main() {
  try {
    const client = await getAuthClient();

    console.log("✅ Authentication successful");
    console.log(client.constructor.name);
  } catch (error) {
    console.error("❌ Authentication failed");
    console.error(error);
  }
}

main();