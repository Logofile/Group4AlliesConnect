import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import "../App.css";

function InviteRegister() {
  const { token } = useParams();
  const navigate = useNavigate();

  // Invite data from backend
  const [inviteData, setInviteData] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    zip: "",
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
    const hasValidLength = username.length >= 3 && username.length <= 50;
    const hasValidChars = /^[a-zA-Z0-9_-]+$/.test(username);
    const hasNoSpaces = !/\s/.test(username);
    return hasValidLength && hasValidChars && hasNoSpaces;
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const formatZip = (value) => {
    const digits = value.replace(/\D/g, "");
    return digits.slice(0, 5);
  };

  // Fetch invite details on mount
  const fetchInvite = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/organizations/invite/${token}`,
      );

      if (!response.ok) {
        setInviteError(
          "This invitation link is invalid or has expired. Please contact the organization for a new invite.",
        );
        return;
      }

      const data = await response.json();
      setInviteData(data);

      // Pre-fill email and suggested username from invite
      setFormData((prev) => ({
        ...prev,
        email: data.email || "",
        username: data.username_suggestion || "",
      }));
    } catch (err) {
      console.error("Error fetching invite:", err);
      setInviteError("Unable to load invitation. Please try again later.");
    } finally {
      setLoadingInvite(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === "zip") {
      setFormData((prev) => ({ ...prev, [name]: formatZip(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Form validity
  const isFormValid =
    formData.username &&
    isValidUsernameFormat(formData.username) &&
    formData.email &&
    isValidEmailFormat(formData.email) &&
    formData.password &&
    isValidPasswordFormat(formData.password) &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    formData.firstName &&
    formData.lastName &&
    formData.phone &&
    isValidPhoneFormat(formData.phone) &&
    formData.zip;

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      alert("Please fill in all fields correctly.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/organizations/invite-register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phone.replace(/\D/g, ""),
            zip_code: formData.zip,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert("Registration failed: " + data.error);
        return;
      }

      alert("Account created successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      console.error("Error registering via invite:", err);
      alert("An error occurred during registration.");
    }
  };

  // Loading state
  if (loadingInvite) {
    return (
      <Container className="register-container">
        <div className="text-center mt-5">
          <Spinner animation="border" className="me-2" />
          Loading invitation...
        </div>
      </Container>
    );
  }

  // Error state
  if (inviteError) {
    return (
      <Container className="register-container">
        <div className="text-container mb-5">
          <h1>Welcome to Allies Connect</h1>
        </div>
        <Alert variant="danger" className="text-center">
          {inviteError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="register-container">
      <div className="text-container mb-3">
        <h1>Welcome to Allies Connect</h1>
      </div>
      <div className="text-container mb-5">
        <h2>{inviteData?.organization_name}</h2>
        <p>
          You&apos;ve been invited to join this organization. Fill out the form
          below to create your account.
        </p>
      </div>
      <div className="feature-box">
        <div className="text-container mb-4">
          <h3>Create Your Account</h3>
        </div>
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
                  value={formData.username}
                  onChange={handleChange}
                  required
                  isInvalid={
                    formData.username &&
                    !isValidUsernameFormat(formData.username)
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                  isInvalid={
                    formData.password &&
                    !isValidPasswordFormat(formData.password)
                  }
                />
                <Form.Control.Feedback type="invalid">
                  {getPasswordErrors(formData.password).map((err, i) => (
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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  isInvalid={
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
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
                  value={formData.email}
                  onChange={handleChange}
                  required
                  isInvalid={
                    formData.email && !isValidEmailFormat(formData.email)
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
                value={formData.firstName}
                onChange={handleChange}
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
                value={formData.lastName}
                onChange={handleChange}
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
                  placeholder="(XXX) XXX-XXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  maxLength="14"
                  isInvalid={
                    formData.phone && !isValidPhoneFormat(formData.phone)
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
                placeholder="XXXXX"
                value={formData.zip}
                onChange={handleChange}
                required
                maxLength="5"
              />
            </Col>
          </Row>

          {/* EIN field — read-only, pre-filled from the org */}
          <div
            style={{
              border: "2px solid #ccc",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "1rem",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h5 className="text-center mb-3" style={{ fontWeight: "bold" }}>
              Organization EIN
            </h5>
            <Row className="text-start mb-2">
              <Col md={3} className="d-flex align-items-center">
                <h5>EIN Number:</h5>
              </Col>
              <Col className="d-flex align-items-center">
                <Form.Control
                  type="text"
                  value={inviteData?.ein || ""}
                  disabled
                  readOnly
                  style={{ backgroundColor: "#e9ecef" }}
                />
              </Col>
            </Row>
            <Alert variant="info" className="mt-2 mb-0">
              <small>
                This EIN is pre-filled from your organization and cannot be
                changed.
              </small>
            </Alert>
          </div>
        </Form>
        <Row className="justify-content-end">
          <Col md={4}>
            <Button
              className="btn-gold"
              onClick={handleRegister}
              disabled={!isFormValid}
              style={{ opacity: isFormValid ? 1 : 0.5 }}
            >
              Register
            </Button>
          </Col>
        </Row>
      </div>
    </Container>
  );
}

export default InviteRegister;
