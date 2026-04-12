import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../register';

describe('Register Page', () => {
  it('renders tabs to select account type', () => {
    // Avoid missing DOM errors for maps API
    window.google = {
      maps: {
        places: {
          Autocomplete: class {}
        }
      }
    };

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByText(/Volunteer\/Individual/i)).toBeInTheDocument();
    expect(screen.getByText(/Service Provider/i)).toBeInTheDocument();
  });
});
