/**
 * Function to get access token from Amadeus
 */
const getAccessToken = async () => {
  const clientId = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_API_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Amadeus credentials. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET');
  }
  
  const tokenUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
};

/**
 * Function to search for flight offers using the Amadeus API.
 */
const executeFunction = async ({ originLocationCode, destinationLocationCode, departureDate, returnDate, adults = 2, max = 5 }) => {
  const url = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
  
  try {
    // Get a fresh access token
    console.log('Getting access token...');
    const accessToken = await getAccessToken();
    console.log('Got access token, length:', accessToken.length);
    
    // Construct the URL with query parameters
    const queryParams = new URLSearchParams({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults: adults.toString(),
      max: max.toString(),
    });
    
    if (returnDate) {
      queryParams.append('returnDate', returnDate);
    }

    // Set up headers with the access token
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Searching flights...');
    
    // Perform the fetch request
    const response = await fetch(`${url}?${queryParams.toString()}`, {
      method: 'GET',
      headers
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', JSON.stringify(errorData, null, 2));
      
      return { 
        error: 'Flight search failed',
        status: response.status,
        details: errorData
      };
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return { 
      error: 'An error occurred while searching for flight offers.',
      details: error.message
    };
  }
};

// Rest of the file remains the same...
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
        required: ['originLocationCode', 'destinationLocationCode', 'departureDate']
      }
    }
  }
};

export { apiTool };