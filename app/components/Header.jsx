import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Link as LinkScroll } from "react-scroll";
import ButtonOutline from "../misc/ButtonOutline.";
// Coloque Logo.svg em public/assets/Logo.svg (ou importe: import logoUrl from '../assets/Logo.svg')
const LOGO_SRC = "/assets/Logo.svg";

const NAV_ITEMS = [
  { id: "about", label: "About", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "feature", label: "Feature", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" },
  { id: "pricing", label: "Pricing", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "testimoni", label: "Testimonial", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
];

const scrollProps = {
  activeClass: "active",
  spy: true,
  smooth: true,
  duration: 1000,
};

function useScrollActive(threshold = 20) {
  const [scrollActive, setScrollActive] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrollActive(window.scrollY > threshold);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);
  return scrollActive;
}

function NavLinkScroll({ item, activeLink, onSetActive }) {
  const isActive = activeLink === item.id;
  const baseClass = "px-4 py-2 mx-2 cursor-pointer animation-hover inline-block relative";
  const activeClass = isActive ? " text-orange-500 animation-active " : " text-black-500 hover:text-orange-500 ";
  return (
    <LinkScroll
      {...scrollProps}
      to={item.id}
      onSetActive={() => onSetActive(item.id)}
      className={baseClass + activeClass}
    >
      {item.label}
    </LinkScroll>
  );
}

function MobileNavLink({ item, activeLink, onSetActive }) {
  const isActive = activeLink === item.id;
  const baseClass =
    "mx-1 sm:mx-2 px-3 sm:px-4 py-2 flex flex-col items-center text-xs border-t-2 transition-all ";
  const activeClass = isActive ? " border-orange-500 text-orange-500" : " border-transparent ";
  return (
    <LinkScroll
      {...scrollProps}
      to={item.id}
      onSetActive={() => onSetActive(item.id)}
      className={baseClass + activeClass}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
      </svg>
      {item.label}
    </LinkScroll>
  );
}

const Header = () => {
  const [activeLink, setActiveLink] = useState(null);
  const scrollActive = useScrollActive(20);

  return (
    <>
      <header
        className={
          "fixed top-0 w-full z-30 bg-white-500 transition-all " +
          (scrollActive ? " shadow-md pt-0" : " pt-4")
        }
      >
        <nav className="max-w-7xl px-6 sm:px-8 lg:px-16 mx-auto grid grid-flow-col py-3 sm:py-4">
          <div className="col-start-1 col-end-2 flex items-center">
            <img src={LOGO_SRC} alt="Logo" className="h-8 w-auto" />
          </div>
          <ul className="hidden lg:flex col-start-4 col-end-8 text-black-500 items-center">
            {NAV_ITEMS.map((item) => (
              <NavLinkScroll
                key={item.id}
                item={item}
                activeLink={activeLink}
                onSetActive={setActiveLink}
              />
            ))}
          </ul>
          <div className="col-start-10 col-end-12 font-medium flex justify-end items-center">
            <Link
              to="/"
              className="text-black-600 mx-2 sm:mx-4 capitalize tracking-wide hover:text-orange-500 transition-all"
            >
              Sign In
            </Link>
            <ButtonOutline>Sign Up</ButtonOutline>
          </div>
        </nav>
      </header>

      <nav className="fixed lg:hidden bottom-0 left-0 right-0 z-20 px-4 sm:px-8 shadow-t ">
        <div className="bg-white-500 sm:px-3">
          <ul className="flex w-full justify-between items-center text-black-500">
            {NAV_ITEMS.map((item) => (
              <MobileNavLink
                key={item.id}
                item={item}
                activeLink={activeLink}
                onSetActive={setActiveLink}
              />
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;
