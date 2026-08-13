import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { SpacePlannerProvider } from './hooks/useSpacePlanner';

const Admin = lazy(() => import('./pages/Admin').then((module) => ({ default: module.Admin })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Catalog = lazy(() => import('./pages/Catalog').then((module) => ({ default: module.Catalog })));
const Contact = lazy(() => import('./pages/ContentPages').then((module) => ({ default: module.Contact })));
const Editorial = lazy(() => import('./pages/ContentPages').then((module) => ({ default: module.Editorial })));
const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Inspiration = lazy(() => import('./pages/Inspiration').then((module) => ({ default: module.Inspiration })));
const InspirationArticle = lazy(() => import('./pages/InspirationArticle').then((module) => ({ default: module.InspirationArticle })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetail })));
const SpacePlanner = lazy(() => import('./pages/SpacePlanner').then((module) => ({ default: module.SpacePlanner })));

function PageLoading() {
  return <section className="empty"><p className="eyebrow">CASA NATIVA</p><h2>Preparando el espacio…</h2></section>;
}

function PublicSite() {
  return <Shell><Suspense fallback={<PageLoading/>}><Routes><Route path="/" element={<Home/>}/><Route path="/catalog" element={<Catalog/>}/><Route path="/catalog/:slug" element={<ProductDetail/>}/><Route path="/space" element={<SpacePlanner/>}/><Route path="/contact" element={<Contact/>}/><Route path="/spaces" element={<Editorial kind="spaces"/>}/><Route path="/collections" element={<Editorial kind="collections"/>}/><Route path="/inspiration" element={<Inspiration/>}/><Route path="/inspiration/:slug" element={<InspirationArticle/>}/><Route path="/about" element={<About/>}/><Route path="*" element={<NotFound/>}/></Routes></Suspense></Shell>;
}

export default function App() {
  return <BrowserRouter><SpacePlannerProvider><Suspense fallback={<PageLoading/>}><Routes><Route path="/admin" element={<Admin/>}/><Route path="*" element={<PublicSite/>}/></Routes></Suspense></SpacePlannerProvider></BrowserRouter>;
}
