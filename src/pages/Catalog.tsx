import { useContext } from 'react';
import { AppShell, ThemeContext } from '../components/AppShell';
import { CatalogContent } from '../catalog/CatalogContent';
import '../styles/catalog.css';

export function Catalog() {
  const { theme } = useContext(ThemeContext);
  return <AppShell module="settings" mobileTitle="Component catalog">{(bp) => <CatalogContent theme={theme} showHeading={bp !== 'mobile'} />}</AppShell>;
}
