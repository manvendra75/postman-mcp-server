/**
 * Function to create flight orders using the Amadeus API.
 *
 * @param {Object} args - Arguments for creating flight orders.
 * @param {Array} args.flightOfferPriceData - The flight offer price data to be included in the order.
 * @param {Object} args.traveler - The traveler information including name, date of birth, gender, and contact details.
 * @param {Object} args.contact - The contact information for the booking.
 * @returns {Promise<Object>} - The result of the flight order creation.
 */
const executeFunction = async ({ flightOfferPriceData, travelers, contacts }) => {
  const url = 'https://test.api.amadeus.com/v1/booking/flight-orders';
  const token = process.env.AMADEUS_FOR_DEVELOPERS_S_PUBLIC_WORKSPACE_API_KEY;

  const requestBody = {
    data: {
      type: "flight-order",
      flightOffers: flightOfferPriceData,
      travelers: travelers,
      remarks: {
        general: [
          {
            subType: "GENERAL_MISCELLANEOUS",
            text: "ONLINE BOOKING FROM INCREIBLE VIAJES"
          }
        ]
      },
      ticketingAgreement: {
        option: "DELAY_TO_CANCEL",
        delay: "6D"
      },
      contacts: contacts
    }
  };

  try {
    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json'
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
    console.error('Error creating flight order:', error);
    return { error: 'An error occurred while creating the flight order.' };
  }
};

/**
 * Tool configuration for creating flight orders using the Amadeus API.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'create_flight_order',
      description: 'Create a flight order using the Amadeus API.',
      parameters: {
        type: 'object',
        properties: {
          flightOfferPriceData: {
            type: 'array',
            description: 'The flight offer price data to be included in the order.'
          },
          travelers: {
            type: 'array',
            description: 'An array of traveler objects containing traveler information.'
          },
          contacts: {
            type: 'array',
            description: 'An array of contact objects containing contact information for the booking.'
          }
        },
        required: ['flightOfferPriceData', 'travelers', 'contacts']
      }
    }
  }
};

export { apiTool };