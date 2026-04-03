import { useState } from "react";
import { Button, Col, Container, Form, Row, Tab, Tabs } from "react-bootstrap";
import "../App.css";

function Register() {
  // Volunteer form state
  const [volFormData, setVolFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    zip: "",
  });

  // Organization form state
  const [orgFormData, setOrgFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    name: "",
    phone: "",
    zip: "",
    ein: "",
  });

  // Validation functions
  const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhoneFormat = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ""));
  };

  const isValidPasswordFormat = (password) => {
    // Must be more than 6 characters, have at least one capital letter, one special character, and no spaces
    const hasMinLength = password.length > 6;
    const hasCapitalLetter = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/~`]/.test(password);
    const hasNoSpaces = !/\s/.test(password);
    return hasMinLength && hasCapitalLetter && hasSpecialChar && hasNoSpaces;
  };

  const getPasswordErrors = (password) => {
    const errors = [];
    if (password.length <= 6) errors.push("Must be more than 6 characters");
    if (!/[A-Z]/.test(password))
      errors.push("Must include at least one capital letter");
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:',.<>?/~`]/.test(password))
      errors.push("Must include at least one special character");
    if (/\s/.test(password)) errors.push("Cannot contain spaces");
    return errors;
  };

  const isValidUsernameFormat = (username) => {
    // Username must be 3-50 characters, contain only letters, numbers, underscores, and hyphens, and no spaces
    const hasValidLength = username.length >= 3 && username.length <= 50;
    const hasValidChars = /^[a-zA-Z0-9_-]+$/.test(username);
    const hasNoSpaces = !/\s/.test(username);
    return hasValidLength && hasValidChars && hasNoSpaces;
  };

  const isValidEINFormat = (ein) => {
    // EIN must be in format XX-XXXXXXX (9 digits with a dash)
    const einRegex = /^\d{2}-\d{7}$/;
    return einRegex.test(ein);
  };

  const hasNineDigits = (ein) => {
    // Check if EIN has exactly 9 digits (ignoring formatting)
    const digits = ein.replace(/\D/g, "");
    return digits.length === 9;
  };

  const formatEIN = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    // Format to XX-XXXXXXX pattern
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 9) {
      return digits.slice(0, 2) + "-" + digits.slice(2);
    }
    return digits.slice(0, 2) + "-" + digits.slice(2, 9);
  };

  // Handle volunteer form changes
  const handleVolChange = (e) => {
    const { name, value } = e.target;
    setVolFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle organization form changes
  const handleOrgChange = (e) => {
    const { name, value } = e.target;
    // Auto-format EIN as user types
    if (name === "ein") {
      const formattedEIN = formatEIN(value);
      setOrgFormData((prev) => ({
        ...prev,
        [name]: formattedEIN,
      }));
    } else {
      setOrgFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle volunteer registration
  const handleVolunteerRegister = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (
      !volFormData.username ||
      !volFormData.email ||
      !volFormData.password ||
      !volFormData.confirmPassword ||
      !volFormData.firstName ||
      !volFormData.lastName ||
      !volFormData.phone ||
      !volFormData.zip
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (!isValidEmailFormat(volFormData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!isValidUsernameFormat(volFormData.username)) {
      alert(
        "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
      );
      return;
    }

    if (!isValidPhoneFormat(volFormData.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!isValidPasswordFormat(volFormData.password)) {
      alert(
        "Password requirements not met:\n" +
          getPasswordErrors(volFormData.password).join("\n"),
      );
      return;
    }

    if (volFormData.password !== volFormData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: volFormData.username,
          email: volFormData.email,
          password: volFormData.password,
          first_name: volFormData.firstName,
          last_name: volFormData.lastName,
          phone: volFormData.phone,
          zip_code: volFormData.zip,
          role: "volunteer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Registration failed: " + data.error);
        return;
      }

      alert("Registration successful! You can now log in.");
      // Reset form
      setVolFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        zip: "",
      });
    } catch (err) {
      console.error("Error registering volunteer:", err);
      alert("An error occurred during registration");
    }
  };

  // Handle organization registration
  const handleOrganizationRegister = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (
      !orgFormData.username ||
      !orgFormData.email ||
      !orgFormData.password ||
      !orgFormData.confirmPassword ||
      !orgFormData.firstName ||
      !orgFormData.lastName ||
      !orgFormData.name ||
      !orgFormData.phone ||
      !orgFormData.zip ||
      !orgFormData.ein
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (!isValidEmailFormat(orgFormData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!isValidUsernameFormat(orgFormData.username)) {
      alert(
        "Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens (no spaces)",
      );
      return;
    }

    if (!isValidPhoneFormat(orgFormData.phone)) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    if (!isValidPasswordFormat(orgFormData.password)) {
      alert(
        "Password requirements not met:\n" +
          getPasswordErrors(orgFormData.password).join("\n"),
      );
      return;
    }

    if (orgFormData.password !== orgFormData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!isValidEINFormat(orgFormData.ein)) {
      alert("Please enter a valid EIN number in the format XX-XXXXXXX");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/organizations/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: orgFormData.username,
            email: orgFormData.email,
            password: orgFormData.password,
            organization_name: orgFormData.name,
            phone_number: orgFormData.phone,
            first_name: orgFormData.firstName,
            last_name: orgFormData.lastName,
            zip_code: orgFormData.zip,
            ein: orgFormData.ein,
            verification_method: "ein",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert("Registration failed: " + data.error);
        return;
      }

      alert("Registration successful! You can now log in.");
      // Reset form
      setOrgFormData({
        username: "",
        password: "",
        confirmPassword: "",
        email: "",
        firstName: "",
        lastName: "",
        name: "",
        phone: "",
        zip: "",
        ein: "",
      });
    } catch (err) {
      console.error("Error registering organization:", err);
      alert("An error occurred during registration");
    }
  };

  return (
    <Container className="register-container">
      <div className="text-container mb-5">
        <h1>Create Your Account!</h1>
      </div>
      <div className="feature-box">
        <div className="text-container mb-5">
          <h2>Register</h2>
          <p>Select a tab to begin creating your desired account type.</p>
        </div>
        <Tabs defaultActiveKey="volunteer" className="mb-3">
          <Tab eventKey="volunteer" title="Volunteer">
            <Form>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Username: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="username"
                      type="text"
                      placeholder="Enter username"
                      value={volFormData.username}
                      onChange={handleVolChange}
                      required
                      isInvalid={
                        volFormData.username &&
                        !isValidUsernameFormat(volFormData.username)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Username must be 3-50 characters and contain only letters,
                      numbers, underscores, and hyphens (no spaces)
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Password: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="password"
                      type="password"
                      placeholder="Enter password"
                      value={volFormData.password}
                      onChange={handleVolChange}
                      required
                      isInvalid={
                        volFormData.password &&
                        !isValidPasswordFormat(volFormData.password)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {getPasswordErrors(volFormData.password).map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Confirm Password: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="confirmPassword"
                      type="password"
                      placeholder="Enter password again"
                      value={volFormData.confirmPassword}
                      onChange={handleVolChange}
                      required
                      isInvalid={
                        volFormData.confirmPassword &&
                        volFormData.password !== volFormData.confirmPassword
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Passwords do not match
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Email: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="email"
                      type="email"
                      placeholder="Enter email"
                      value={volFormData.email}
                      onChange={handleVolChange}
                      required
                      isInvalid={
                        volFormData.email &&
                        !isValidEmailFormat(volFormData.email)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Email must be in a valid format (e.g., user@example.com)
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    First Name: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={volFormData.firstName}
                    onChange={handleVolChange}
                    required
                  />
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Last Name: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={volFormData.lastName}
                    onChange={handleVolChange}
                    required
                  />
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Phone Number: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={volFormData.phone}
                      onChange={handleVolChange}
                      required
                      isInvalid={
                        volFormData.phone &&
                        !isValidPhoneFormat(volFormData.phone)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Phone number must be a valid 10-digit format
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    ZIP Code: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="zip"
                    type="tel"
                    placeholder="Enter ZIP code"
                    value={volFormData.zip}
                    onChange={handleVolChange}
                    required
                  />
                </Col>
              </Row>
            </Form>
            <Row className="justify-content-end">
              <Col md={4}>
                <Button className="btn-gold" onClick={handleVolunteerRegister}>
                  Register
                </Button>
              </Col>
            </Row>
          </Tab>

          <Tab eventKey="organization" title="Organization">
            <Form>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Username: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="username"
                      type="text"
                      placeholder="Enter username"
                      value={orgFormData.username}
                      onChange={handleOrgChange}
                      required
                      isInvalid={
                        orgFormData.username &&
                        !isValidUsernameFormat(orgFormData.username)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Username must be 3-50 characters and contain only letters,
                      numbers, underscores, and hyphens (no spaces)
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Password: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="password"
                      type="password"
                      placeholder="Enter password"
                      value={orgFormData.password}
                      onChange={handleOrgChange}
                      required
                      isInvalid={
                        orgFormData.password &&
                        !isValidPasswordFormat(orgFormData.password)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      {getPasswordErrors(orgFormData.password).map((err, i) => (
                        <div key={i}>{err}</div>
                      ))}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Confirm Password: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="confirmPassword"
                      type="password"
                      placeholder="Enter password again"
                      value={orgFormData.confirmPassword}
                      onChange={handleOrgChange}
                      required
                      isInvalid={
                        orgFormData.confirmPassword &&
                        orgFormData.password !== orgFormData.confirmPassword
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Passwords do not match
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Email: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="email"
                      type="email"
                      placeholder="Enter email"
                      value={orgFormData.email}
                      onChange={handleOrgChange}
                      required
                      isInvalid={
                        orgFormData.email &&
                        !isValidEmailFormat(orgFormData.email)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Email must be in a valid format (e.g., user@example.com)
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    First Name: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={orgFormData.firstName}
                    onChange={handleOrgChange}
                    required
                  />
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Last Name: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={orgFormData.lastName}
                    onChange={handleOrgChange}
                    required
                  />
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Organization Name: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="name"
                    type="text"
                    placeholder="Enter organization name"
                    value={orgFormData.name}
                    onChange={handleOrgChange}
                    required
                  />
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    Phone Number: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={orgFormData.phone}
                      onChange={handleOrgChange}
                      required
                      isInvalid={
                        orgFormData.phone &&
                        !isValidPhoneFormat(orgFormData.phone)
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Phone number must be a valid 10-digit format
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    ZIP Code: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Control
                    name="zip"
                    type="tel"
                    placeholder="Enter ZIP code"
                    value={orgFormData.zip}
                    onChange={handleOrgChange}
                    required
                  />
                </Col>
              </Row>
              <Row className="text-start mb-3">
                <Col md={3} className="d-flex align-items-center">
                  <h5>
                    EIN Number: <span className="text-danger">*</span>
                  </h5>
                </Col>
                <Col className="d-flex align-items-center">
                  <Form.Group className="w-100">
                    <Form.Control
                      name="ein"
                      type="tel"
                      placeholder="Enter EIN number (9 digits)"
                      value={orgFormData.ein}
                      onChange={handleOrgChange}
                      required
                      isInvalid={
                        orgFormData.ein &&
                        hasNineDigits(orgFormData.ein) &&
                        !isValidEINFormat(orgFormData.ein)
                      }
                      maxLength="11"
                    />
                    <Form.Control.Feedback type="invalid">
                      EIN must be in the format XX-XXXXXXX (9 digits)
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Form>
            <Row className="justify-content-end">
              <Col md={4}>
                <Button
                  className="btn-gold"
                  onClick={handleOrganizationRegister}
                >
                  Register
                </Button>
              </Col>
            </Row>
          </Tab>
        </Tabs>
      </div>
    </Container>
  );
}

export default Register;
