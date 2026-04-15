describe('Guest Attend Event Flow', () => {
  beforeEach(() => {
    // Intercept the events endpoint to predictably serve one Event
    cy.intercept('GET', '**/api/events', {
      statusCode: 200,
      body: [
        {
          event_id: 88,
          title: "Public Education Seminar",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T16:00:00Z",
          category_name: "Educational Workshop",
          city: "Atlanta",
          state: "GA",
          provider_name: "Education Alliance",
          description: "A free seminar open to the public!"
        }
      ]
    }).as('getEvents');

    // Assume there is an endpoint or external redirect to handle attendee registration
    cy.intercept('POST', '**/api/events/attend', {
      statusCode: 200,
      body: { message: "Attendance registered successfully" }
    }).as('attendRequest');
  });

  it('allows a non-logged-in user to view an event and mark themselves as attending', () => {
    // 1. Navigate directly to the Events page
    cy.visit('/events');
    cy.wait('@getEvents');

    // 2. Find our mocked event on the page and click it to open the Event Details Modal
    cy.contains('Public Education Seminar').should('be.visible').click();

    // 3. Assert the modal opens and contains the "Attend Event" button
    cy.get('.modal').should('be.visible');
    cy.get('.modal').contains('Education Alliance');
    
    // 4. Test the TDD Attend Flow (Testing the button that hasn't been implemented yet)
    cy.get('.modal').contains('Attend Event', { matchCase: false }).click();

    // 5. Assert that the UI provides visual feedback of success to the guest user 
    //    OR opens an attendee registration form. 
    //    (This ensures the developer builds out the attendee UX workflow!)
    cy.contains('Successfully', { matchCase: false }).should('be.visible');
  });
});
