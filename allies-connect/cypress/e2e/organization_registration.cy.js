describe('Organization Registration Flow', () => {
  it('successfully registers a new organization into the platform', () => {
    // Navigate to the live local server
    cy.visit('/register');
    
    // Switch to the Organization tab using the role and text selectors
    cy.get('button[role="tab"]').contains('Organization').click();
    
    // Generate randomized inputs to ensure no duplicate email/username/ein collision with the live DB
    const randomNumber = Math.floor(Math.random() * 10000000);
    const username = `TestOrg${randomNumber}`;
    const email = `testorg${randomNumber}@example.com`;
    const einRaw = String(Math.floor(Math.random() * 900000000) + 100000000); // 9 random digits
    const phone = String(Math.floor(Math.random() * 9000000000) + 1000000000); // 10 random digits
    
    // Scope our queries to only the form currently visible on the screen
    cy.get('.tab-pane.active').within(() => {
      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type('TestP@ssw0rd!1'); // Needs >6 characters, 1 capital, 1 special
      cy.get('input[name="confirmPassword"]').type('TestP@ssw0rd!1');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="name"]').type('Test Foundation E2E');
      cy.get('input[name="phone"]').type(phone);
      cy.get('input[name="zip"]').type('90210');
      // Types 9 digits for EIN validation
      cy.get('input[name="ein"]').type(einRaw);

      // Intercept the backend request before it happens so we can monitor its status
      cy.intercept('POST', '**/api/organizations/register').as('registerRequest');

      // Click the nested Register button
      cy.get('button').contains('Register').click();
    });
    
    // Wait for the backend to respond with a 201 Created and confirm it succeeded
    cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
    
    // Verify the browser alert popup displays the correct success string
    cy.on('window:alert', (text) => {
      expect(text).to.contain('Registration successful');
    });
  });
});
