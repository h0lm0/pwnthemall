import { useTheme } from '@/context/ThemeContext';
import IndexContent from '@/components/IndexContent';

export default function Home() {
  const { darkMode } = useTheme();
  return <IndexContent darkMode={darkMode} />;
}
