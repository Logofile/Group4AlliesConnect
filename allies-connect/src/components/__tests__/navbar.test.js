import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../navbar';

describe('Navbar Component', () => {
  it('renders standard links for unauthenticated users', () => {
    // Mock local storage to contain nothing
    Storage.prototype.getItem = jest.fn(() => null);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
  });

  it('renders volunteer links for volunteer role', () => {
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'role') return 'volunteer';
      if (key === 'token') return 'fake-token';
      return null;
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Volunteer')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('renders provider links for provider role', () => {
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'role') return 'provider';
      if (key === 'token') return 'fake-token';
      return null;
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Provider Portal')).toBeInTheDocument();
  });
});
