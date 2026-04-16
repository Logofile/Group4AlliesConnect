describe('Volunteer Edit Availability Flow', () => {
  beforeEach(() => {
    let mockSchedule = [
      { day_of_week: "Monday", available: false, start_time: "09:00", end_time: "17:00" },
      { day_of_week: "Tuesday", available: false, start_time: "09:00", end_time: "17:00" },
      { day_of_week: "Wednesday", available: false, start_time: "09:00", end_time: "17:00" },
      { day_of_week: "Thursday", available: false, start_time: "09:00", end_time: "17:00" },
      { day_of_week: "Friday", available: false, start_time: "09:00", end_time: "17:00" },
      { day_of_week: "Saturday", available: false, start_time: "09:00", end_time: "17:00" },
      { day_of_week: "Sunday", available: false, start_time: "09:00", end_time: "17:00" },
    ];

    // 1. Intercept Login
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        message: 'Login successful',
        user_id: 888,
        roles: ['volunteer']
      }
    }).as('loginRequest');

    // 2. Intercept Profile
    cy.intercept('GET', '**/api/users/profile/888', {
      statusCode: 200,
      body: {
        user_id: 888,
        first_name: 'Avail',
        last_name: 'Test',
        email: 'avail@example.com'
      }
    }).as('profileRequest');

    // 3. Intercept Availability (Dynamic)
    cy.intercept('GET', '**/api/volunteers/888/availability', (req) => {
      req.reply({
        statusCode: 200,
        body: mockSchedule
      });
    }).as('getAvailability');

    // 4. Intercept Save Availability
    cy.intercept('PUT', '**/api/volunteers/888/availability', (req) => {
      mockSchedule = req.body.schedule;
      req.reply({
        statusCode: 200,
        body: { message: "Availability saved!" }
      });
    }).as('saveAvailability');

    // 5. Intercept Unavailable Dates (Empty)
    cy.intercept('GET', '**/api/volunteers/888/unavailable-dates', {
      statusCode: 200,
      body: []
    }).as('getUnavailableDates');
  });

  it('allows a volunteer to edit their weekly availability', () => {
    // 1. Log in as a volunteer
    cy.visit('/login');
    cy.get('input[name="username"]').type('test_volunteer');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('select').select('volunteer');
    cy.get('button.btn-gold').contains('Login').click();
    
    cy.wait('@loginRequest');
    cy.wait('@profileRequest');
    cy.url().should('include', '/volunteer');

    // 2. Click the image in the upper left corner to go to the home page
    cy.get('.navbar-brand img[alt="Allies Connect logo"]').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // 3. Click the Dashboard button (in navbar)
    cy.get('.navbar').contains('Dashboard').should('be.visible').click();
    cy.url().should('include', '/volunteer');

    // 4. Click Edit Availability
    cy.contains('button', 'Edit Availability').click();
    cy.wait('@getAvailability');
    cy.wait('@getUnavailableDates');

    // 5. Change one of the available days toggle button (Tuesday)
    // Change start time and end time
    cy.contains('tr', 'Tuesday').within(() => {
        // Toggle 'Available' switch
        cy.get('.form-check-input').check();
        
        // Change start time to 10:00
        cy.get('input[type="time"]').first().clear().type('10:00');
        
        // Change end time to 18:00
        cy.get('input[type="time"]').last().clear().type('18:00');
    });

    // 6. Click Save Weekly Schedule
    cy.contains('button', 'Save Weekly Schedule').click();
    cy.wait('@saveAvailability');
    cy.contains('Availability saved!').should('be.visible');

    // 7. Close the modal dialog box
    cy.get('.modal-header .btn-close').click();
    cy.get('.modal').should('not.exist');

    // 8. Reopen the modal dialog box
    cy.contains('button', 'Edit Availability').click();
    cy.wait('@getAvailability');

    // Confirm that the changes made were retained
    cy.contains('tr', 'Tuesday').within(() => {
        cy.get('.form-check-input').should('be.checked');
        cy.get('input[type="time"]').first().should('have.value', '10:00');
        cy.get('input[type="time"]').last().should('have.value', '18:00');
    });
  });
});
