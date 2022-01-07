import { Navbar, Container, Nav } from 'react-bootstrap';
export default function Header() {
  return (
    <Navbar collapseOnSelect expand="md" bg="secondary" variant="dark">
      <Container>
        <Navbar.Brand className="fs-3 fw-bold" href="./">
          JW3T
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto"></Nav>
          <Nav>
            <Nav.Link target="_blank" href="https://github.com/hamidra/jw3t">
              What is JW3T?!
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
