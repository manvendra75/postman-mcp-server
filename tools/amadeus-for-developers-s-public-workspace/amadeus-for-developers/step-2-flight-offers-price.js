/**
 * Function to get flight offers pricing from Amadeus API.
 *
 * @param {Object} args - Arguments for the flight offers pricing.
 * @param {Array} args.flightOfferData - An array of flight offer objects to price.
 * @returns {Promise<Object>} - The result of the flight offers pricing request.
 */
const executeFunction = async ({ flightOfferData }) => {
  const url = 'https://test.api.amadeus.com/v1/shopping/flight-offers/pricing';
  const token = process.env.AMADEUS_FOR_DEVELOPERS_S_PUBLIC_WORKSPACE_API_KEY;
  const requestBody = {
    data: {
      type: "flight-offers-pricing",
      flightOffers: flightOfferData
    }
  };

  try {
    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'X-HTTP-Method-Override': 'GET'
    };

    // If a token is provided, add it to the Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
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
    console.error('Error fetching flight offers pricing:', error);
    return { error: 'An error occurred while fetching flight offers pricing.' };
  }
};

/**
 * Tool configuration for getting flight offers pricing from Amadeus API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_flight_offers_pricing',
      description: 'Get pricing for flight offers from Amadeus API.',
      parameters: {
        type: 'object',
        properties: {
          flightOfferData: {
            type: 'array',
            description: 'An array of flight offer objects to price.'
          }
        },
        required: ['flightOfferData']
      }
    }
  }
};

export { apiTool };