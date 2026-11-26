import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-dark">
      <Container>
        <Row>
          <Col className="text-center py-3">
            <h2>Payments Accepted</h2>
            <div className="text-center">
              <img
                src="/images/payment.png"
                className="img-fluid w-25"
                alt="Visa, Mastercard, American Express and PayPal"
                width="2463"
                height="512"
              />
            </div>
            <p className="demo-note">
              Demo store: checkout uses a test payment and no real money is taken.
            </p>
            <p>
              <a aria-label="LinkedIn"
                className="link"
                href="https://www.linkedin.com/in/ivankuper/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="socials fab fa-linkedin fa-2x px-2"></i>
              </a>
              <a aria-label="GitHub"
                className="link"
                href="https://github.com/IvanKuper"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="socials fab fa-github fa-2x px-2"></i>
              </a>
            </p>
            <div className="copyright-text">
              <p>
                Developed By:
                <a
                  className="link"
                  href="https://ivankuper.github.io/"
                  target={"_blank"}
                  rel="noopener noreferrer"
                >
                  Ivan Kuper
                </a>
                , All Right Reserved {new Date().getFullYear()}.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
