exports.handler = async (event) => {
  // Log the event argument for debugging and for use in local development.
  console.log("EVENT: ", JSON.stringify(event, undefined, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
};
