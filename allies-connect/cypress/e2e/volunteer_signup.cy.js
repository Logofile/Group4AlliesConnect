describe('Volunteer Signup Flow', () => {
  beforeEach(() => {
    // Intercept backend login endpoints to seamlessly simulate a logged-in Volunteer
    cy.intercept('POST', 'http://localhost:5000/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        user_id: 999,
        roles: ['volunteer']
      }
    }).as('loginRequest');

    cy.intercept('GET', '**/api/users/profile/999', {
      statusCode: 200,
      body: {
        user_id: 999,
        first_name: 'Test',
        last_name: 'Volunteer',
        email: 'volunteer@example.com'
      }
    }).as('profileRequest');

    // Intercept the events endpoint to predictably serve one Event
    cy.intercept('GET', '**/api/events', {
      statusCode: 200,
      body: [
        {
          event_id: 50,
          title: "Community Park Cleanup",
          start_datetime: "2030-01-01T12:00:00Z",
          end_datetime: "2030-01-01T16:00:00Z",
          category_name: "Environmental",
          city: "Atlanta",
          state: "GA",
          provider_name: "Test Organization",
          description: "Help us clean up the local park!"
        }
      ]
    }).as('getEvents');

    // Mock the backend volunteer-signups creation endpoint (Wait for the user to submit)
    cy.intercept('POST', '**/api/volunteer-signups', {
      statusCode: 201,
      body: {
        message: "Volunteer signup created successfully",
        signup_id: 1
      }
    }).as('signupRequest');
  });

  it('allows a volunteer to log in, view events, and sign up to volunteer', () => {
    // 1. Visit Login Page
    cy.visit('/login');

    // 2. Fill out the authentication form
    cy.get('input[name="username"]').type('test_volunteer');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('select').select('volunteer'); // Select 'Volunteer' role
    cy.get('button.btn-gold').contains('Login').click({ force: true });

    // Verify login network requests fired
    cy.wait('@loginRequest');
    cy.wait('@profileRequest');

    // We should be redirected to the volunteer dashboard automatically
    cy.url().should('include', '/volunteer');

    // 3. Navigate to the Events page
    cy.contains('Events').click(); // Click the navbar link
    cy.url().should('include', '/events');
    cy.wait('@getEvents');

    // 4. Find our mocked event on the page and click it to open the Event Details Modal
    cy.contains('Community Park Cleanup').should('be.visible').click();

    // 5. Assert the modal opens and contains the "Volunteer" button
    cy.get('.modal').should('be.visible');
    cy.get('.modal').contains('Test Organization');
    
    // Test the TDD Signup Flow
    cy.get('.modal').contains('Volunteer').click();

    // 6. Assert the front-end successfully triggered a backend creation request for user 999
    cy.wait('@signupRequest').its('request.body').should('have.property', 'user_id', 999);

    // 7. Assert that the UI provides visual feedback of success to the user
    // (This ensures the developer builds a success popup / alert during implementation!)
    cy.contains('Successfully signed up', { matchCase: false }).should('be.visible');
  });
});
