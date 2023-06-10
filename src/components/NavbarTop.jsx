import React, { useState } from 'react'

import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
    Nav,
    NavItem} from 'reactstrap';
import {Container }from 'react-bootstrap';
import { MdMenu } from "react-icons/md";
import '../style/navbar.css';
import logoIMG from "../images/kosign-logo.jpg";

const NavbarTop = (props) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);

    return (
        <div className={'navbarWrapper'}>
            <Container>
                <Navbar expand="md" className={'navbarCustom'} >
                    <NavbarBrand href="/" className={'nav-brand'}>
                        <div className='navbarLogo'>
                            {/*<SiMeteor className={'navbarLogoIcon'} />*/}
                            <img src={logoIMG} />
                            Kosign
                        </div>
                    </NavbarBrand>
                    <NavbarToggler onClick={toggle} className={'navbar-toggler'} >
                        <MdMenu fill={'#000'}/>
                    </NavbarToggler>
                    <Collapse isOpen={isOpen} navbar>
                        <Nav className="justify-content-end" navbar style={{width:'100%'}}>
                            <NavItem className={'nav-item'}>
                                <a href={'https://kosign.xyz'} className={"nav-link"}>Go to Kosign.xyz</a>
                            </NavItem>
                        </Nav>
                    </Collapse>
                </Navbar>

            </Container>
        </div>
    )


};

export default NavbarTop;
