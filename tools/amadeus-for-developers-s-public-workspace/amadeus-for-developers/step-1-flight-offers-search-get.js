/**
 * Function to search for flight offers using the Amadeus API.
 *
 * @param {Object} args - Arguments for the flight offers search.
 * @param {string} args.originLocationCode - The IATA code of the origin location.
 * @param {string} args.destinationLocationCode - The IATA code of the destination location.
 * @param {string} args.departureDate - The departure date in YYYY-MM-DD format.
 * @param {string} args.returnDate - The return date in YYYY-MM-DD format.
 * @param {number} [args.adults=2] - The number of adults traveling.
 * @param {number} [args.max=5] - The maximum number of flight offers to return.
 * @returns {Promise<Object>} - The result of the flight offers search.
 */
const executeFunction = async ({ originLocationCode, destinationLocationCode, departureDate, returnDate, adults = 2, max = 5 }) => {
  const url = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
  const token = process.env.AMADEUS_FOR_DEVELOPERS_S_PUBLIC_WORKSPACE_API_KEY;
  try {
    // Construct the URL with query parameters
    const queryParams = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      returnDate,
      adults: adults.toString(),
      max: max.toString(),
    });

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Perform the fetch request
    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'GET',
      headers
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
    console.error('Error searching for flight offers:', error);
    return { error: 'An error occurred while searching for flight offers.' };
  }
};

/**
 * Tool configuration for searching flight offers using the Amadeus API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'search_flight_offers',
      description: 'Search for flight offers using the Amadeus API.',
      parameters: {
        type: 'object',
        properties: {
          originLocationCode: {
            type: 'string',
            description: 'The IATA code of the origin location.'
          },
          destinationLocationCode: {
            type: 'string',
            description: 'The IATA code of the destination location.'
          },
          departureDate: {
            type: 'string',
            description: 'The departure date in YYYY-MM-DD format.'
          },
          returnDate: {
            type: 'string',
            description: 'The return date in YYYY-MM-DD format.'
          },
          adults: {
            type: 'integer',
            description: 'The number of adults traveling.'
          },
          max: {
            type: 'integer',
            description: 'The maximum number of flight offers to return.'
          }
        },
        required: ['originLocationCode', 'destinationLocationCode', 'departureDate', 'returnDate']
      }
    }
  }
};

export { apiTool };