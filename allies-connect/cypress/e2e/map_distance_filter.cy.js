describe('Map Distance Filter Flow', () => {
  beforeEach(() => {
    // Intercept the backend calls to make map pins deterministic
    // This allows us to exactly test the Haversine radius math without depending on live dynamic DB data!
    cy.intercept('GET', '**/api/events', {
      statusCode: 200,
      body: [
        {
          event_id: 1,
          title: "Close Event",
          // Approx 33.785, -84.388 (Midtown Atlanta, right on West Peachtree)
          latitude: "33.7855",
          longitude: "-84.3880",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T14:00:00Z",
          street_address_1: "1105 West Peachtree St NW",
          city: "Atlanta",
          state: "GA",
          zip: "30309"
        },
        {
          event_id: 2,
          title: "Far Event",
          // Marietta (approx 15 miles away)
          latitude: "33.9526", 
          longitude: "-84.5499",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T14:00:00Z"
        }
      ]
    }).as('getEvents');

    cy.intercept('GET', '**/api/resources', {
      statusCode: 200,
      body: [
        {
          resource_id: 1,
          name: "Medium Distance Resource",
          category_name: "Food Assistance",
          // About 1 mile away from West Peachtree (Downtown)
          latitude: "33.765",
          longitude: "-84.390"
        }
      ]
    }).as('getResources');
  });

  it('filters out pins that are further than 2 miles away', () => {
    // Non-logged in user accesses maps page
    cy.visit('/maps');

    // Wait for the pins to load
    cy.wait('@getEvents');
    cy.wait('@getResources');

    // Initially, there should be 3 markers on the map
    // Initially, wait for the map UI to render
    cy.wait(500);

    // Click the Set My Location button (To trigger the address modal as specified by requirements)
    cy.get('button').contains('Set my location', { matchCase: false }).click();

    // The address modal should pop up. User enters the address
    cy.get('input[placeholder*="address" i], input[name*="address" i]').type('1105 West Peachtree, Atlanta GA');
    cy.get('button').contains('Save', { matchCase: false }).click();

    // Now, user applies the distance filter for 2 miles
    cy.get('input[type="number"]').clear().type('2');

    // After filtering is applied, we expect the map to only have 2 markers left 
    // The "Far Event" (15 miles out) should be dynamically stripped from the DOM or Google Maps cluster
    cy.contains('Far Event').should('not.exist');
    cy.contains('Close Event').should('exist');
  });
});
