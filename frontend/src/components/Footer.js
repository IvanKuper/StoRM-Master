import React from "react";
import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
  return (
    <footer className="bg-dark">
      <Container>
        <Row>
          <Col className="text-center py-3">
            <h3>Payments Accepted</h3>
            <div className="text-center">
              <img
                src="/images/payment.png"
                className="img-fluid w-25"
                alt="payment"
              />
            </div>
            <p>
              <a
                className="link"
                href="https://www.linkedin.com/in/ivankuper/"
                target="_blank"
              >
                <i className="socials fab fa-linkedin fa-2x px-2"></i>
              </a>
              <a
                className="link"
                href="https://github.com/IvanKuper"
                target="_blank"
              >
                <i className="socials fab fa-github fa-2x px-2"></i>
              </a>
              <a
                className="link"
                href="https://www.instagram.com/ivan_kuper/"
                target="_blank"
              >
                <i className="socials fab fa-instagram fa-2x px-2"></i>
              </a>
            </p>
            <div className="copyright-text">
              <p>
                Developed By:
                <a
                  className="link"
                  href="https://ivankuper.netlify.app/"
                  target={"_blank"}
                >
                  Ivan Kuper
                </a>
                , All Right Reserved 2023.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
