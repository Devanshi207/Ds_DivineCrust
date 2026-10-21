import './style.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import About from './components/About';
import Menu from './components/Menu';
import Specialties from './components/Specialties';
import OrderCta from './components/OrderCta';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Menu />
      <Specialties />
      <OrderCta />
      <Contact />
      <Footer />
    </>
  );
}
