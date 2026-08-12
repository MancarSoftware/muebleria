import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { Admin } from './pages/Admin';
import { About } from './pages/About';
import { Catalog } from './pages/Catalog';
import { Contact, Editorial } from './pages/ContentPages';
import { Home } from './pages/Home';
import { Inspiration } from './pages/Inspiration';
import { InspirationArticle } from './pages/InspirationArticle';
import { NotFound } from './pages/NotFound';
import { ProductDetail } from './pages/ProductDetail';
import { SpacePlanner } from './pages/SpacePlanner';
import { SpacePlannerProvider } from './hooks/useSpacePlanner';

function PublicSite() {
  return <Shell><Routes><Route path="/" element={<Home/>}/><Route path="/catalog" element={<Catalog/>}/><Route path="/catalog/:slug" element={<ProductDetail/>}/><Route path="/space" element={<SpacePlanner/>}/><Route path="/contact" element={<Contact/>}/><Route path="/spaces" element={<Editorial kind="spaces"/>}/><Route path="/collections" element={<Editorial kind="collections"/>}/><Route path="/inspiration" element={<Inspiration/>}/><Route path="/inspiration/:slug" element={<InspirationArticle/>}/><Route path="/about" element={<About/>}/><Route path="*" element={<NotFound/>}/></Routes></Shell>;
}

export default function App() {
  return <BrowserRouter><SpacePlannerProvider><Routes><Route path="/admin" element={<Admin/>}/><Route path="*" element={<PublicSite/>}/></Routes></SpacePlannerProvider></BrowserRouter>;
}
