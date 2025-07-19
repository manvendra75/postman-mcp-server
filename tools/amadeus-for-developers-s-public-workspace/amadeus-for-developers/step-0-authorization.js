/**
 * Function to request an access token from the Amadeus API.
 *
 * @param {Object} args - Arguments for the token request.
 * @param {string} args.client_id - Your API Key.
 * @param {string} args.client_secret - Your API Secret.
 * @returns {Promise<Object>} - The response containing the access token.
 */
const executeFunction = async ({ client_id, client_secret }) => {
  const url = 'https://test.api.amadeus.com/v1/security/oauth2/token';
  const accessToken = ''; // will be provided by the user

  const body = new URLSearchParams({
    client_id,
    client_secret,
    grant_type: 'client_credentials'
  });

  try {
    // Perform the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error requesting access token:', error);
    return { error: 'An error occurred while requesting the access token.' };
  }
};

/**
 * Tool configuration for requesting an access token from the Amadeus API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'request_access_token',
      description: 'Request an access token from the Amadeus API.',
      parameters: {
        type: 'object',
        properties: {
          client_id: {
            type: 'string',
            description: 'Your API Key.'
          },
          client_secret: {
            type: 'string',
            description: 'Your API Secret.'
          }
        },
        required: ['client_id', 'client_secret']
      }
    }
  }
};

export { apiTool };